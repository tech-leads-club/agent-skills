# Resilience Reference

Defend every external/inter-service call in layers so a transient failure never takes down the flow or overwhelms a recovering dependency.

## Table of Contents

1. The layered model
2. Retries: capped exponential backoff + full jitter
3. Idempotency (prerequisite for retries)
4. Circuit breaker
5. Retry budget, bulkhead, timeouts
6. Fallbacks
7. Durable execution (when)

---

## 1. The layered model

Compose, do not substitute: **timeout → circuit breaker → retry → call**. Retry handles a single transient error; the breaker handles sustained failure; the timeout bounds latency; the bulkhead isolates resources. Use a proven library (e.g., Cockatiel for TS) instead of hand-rolling.

## 2. Retries: capped exponential backoff + full jitter

Naive retries cause the outages they try to fix: synchronized clients all retry at the same instant. Always use **full jitter**:

```
sleep = random(0, min(cap, base * 2^attempt))
```

Defaults to tune from: `base ≈ 100ms`, `factor = 2`, `cap ≈ 30s`, `maxAttempts = 3–5`. Honor `Retry-After` when present (and still add jitter on top). Retry at **one layer only** — do not stack retries across layers.

## 3. Idempotency (prerequisite for retries)

Only retry operations that are safe to repeat. Reads (GET/HEAD/PUT/DELETE) are safe by construction. For non-idempotent writes (POST, charge, send), the API must accept a client-supplied **idempotency key** that the server uses to dedupe (e.g., `idempotency_key = payment.id`). Never enable retries on a write without server-side dedupe — a timed-out request may have already executed.

## 4. Circuit breaker

Configure on a **sliding time-window error rate**, not an absolute count: e.g., trip at 50% errors over ≥20 requests in a 10s window; also trip on a high slow-call rate (a service returning 200 OK in 6s is failing your SLA). When the breaker is open, the retry loop fails fast — do not even attempt the call.

## 5. Retry budget, bulkhead, timeouts

- **Retry budget:** cap retries at ~10% of request volume over a rolling window; retries are load multipliers.
- **Bulkhead:** isolate resource pools per dependency so one failing dependency cannot exhaust threads/connections for others.
- **Timeout:** set request timeout to 2–5× the downstream p99; never wait forever.

## 6. Fallbacks

Every circuit breaker needs a **named fallback** — stale cache read, outbox write, or an explicit degraded response — never a raw exception to the user. For idempotent reads, serving last-known-good data (flagged stale if needed) beats a 500.

## 7. Durable execution (when)

Add durable execution (a workflow engine such as Restate, Temporal, or DBOS) only for **long-running, multi-step processes that must resume exactly where they left off** after a crash (e.g., ingest → OCR → human review → ERP upsert → notify → close). Per-step retries and idempotency are built in. Keep ordinary request/response logic out of it.

- If the engine is owned by another team, treat it as an external system behind a `WorkflowOrchestrationPort` (ACL) — and keep your own integrations (ERP, storage, notifications) as capabilities the workflow invokes, so you retain control of vendor-agnosticism.
- For your own background work (outbox relay, jobs, crons), start simple with a Postgres-backed queue; reach for heavier engines only when scale or complexity justifies it.
