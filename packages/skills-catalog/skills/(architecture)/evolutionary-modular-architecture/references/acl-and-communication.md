# ACL & Communication Reference

How modules talk to the outside world and to each other without coupling.

## Table of Contents

1. Ports & Adapters (Anti-Corruption Layer)
2. Inter-module communication: events + transactional outbox
3. Event naming and idempotent consumers
4. Real-time: SSE (and when WebSocket)

---

## 1. Ports & Adapters (Anti-Corruption Layer)

Every external system — third-party API, ERP, ticketing, storage, AI, identity provider, **and even an internal service owned by another team** — sits behind a **Port** (an interface in your domain's language) implemented by an **Adapter** (infrastructure). The adapter **translates** the external model into your domain model and back, so no vendor type leaks inside.

- The **domain declares the port** (e.g., `ErpLedgerPort`, `TicketSourcePort`, `DocumentStoragePort`, `AiAssistPort`, `WorkflowOrchestrationPort`, `IdentityProviderPort`).
- The **adapter implements it** (`OmieAdapter`, `ZendeskAdapter`, ...). Dependencies point inward: the adapter knows the port; the port never knows the adapter (Dependency Inversion).
- Swapping a vendor = writing a new adapter behind the same port. The core does not change.
- This is what makes a platform ERP-agnostic / source-agnostic as a structural property, not a promise.

Keep ports expressed as capabilities ("post a ledger entry", "fetch the next demand"), never as the provider's API shape. Use in-memory/fake adapters for fast domain tests.

## 2. Inter-module communication: events + transactional outbox

- **Synchronous only inside one aggregate** (one ACID transaction). Within a context, change the aggregate and its children atomically.
- **Across modules, use events** — never a direct call into another module's service. Publish reliably with the **transactional outbox**: write the business change and the event row in the **same transaction**; a relay publishes the event afterward. This removes the dual-write problem (the data commits but the notification is lost, or vice versa).
- In a single deploy, the relay runs as a background worker inside the same app — no extra infrastructure. When you scale out, the same relay can become a dedicated worker without changing the contract.
- Not everything is an event: keep the things that need atomicity (e.g., approving a payment and changing the request status) inside the aggregate; use events for what tolerates eventual consistency (audit, gamification, notifications, queue reordering).

## 3. Event naming and idempotent consumers

- Name events `module.aggregate.action` (e.g., `review.payments.approved`, `erp.upsert.succeeded`). Payloads carry serializable primitives and ids only — never entity references. Version events when the schema changes.
- The outbox guarantees **at-least-once** delivery, so **every consumer must be idempotent**: dedupe by `aggregateId + eventType` (or an event id). Log processing for observability.
- Transport: start in-memory only for local dev/tests (never for production inter-module). In production use a durable transport (e.g., a Postgres-backed queue, Redis/Valkey streams, SQS, or Kafka when you truly outgrow simpler options).

## 4. Real-time: SSE (and when WebSocket)

For server-to-client push (live queues, notifications, dashboards, AI token streaming), prefer **SSE (Server-Sent Events)**: plain HTTP, automatic reconnection with `Last-Event-ID`, works through proxies/WAF/load balancers, no special infrastructure. In NestJS use the `@Sse()` decorator; in the browser `EventSource`.

- Multi-instance: fan out via Valkey/Redis pub/sub so any instance can push to its connected clients. Single instance needs no pub/sub.
- Reconnection should use the same backoff + jitter policy as the rest of the system.
- TanStack Query has no native SSE: open `EventSource` and update the cache via `setQueryData` / `invalidateQueries` — SSE signals "something changed", Query keeps the cache coherent.
- Use **WebSocket** only when you genuinely need low-latency bidirectional traffic (collaborative editing, multiplayer). It costs sticky sessions plus a pub/sub backbone — do not reach for it by default. In ~80% of "need WebSocket" cases, SSE is enough.
