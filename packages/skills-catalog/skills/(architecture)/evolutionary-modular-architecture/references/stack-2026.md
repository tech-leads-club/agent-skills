# Stack 2026 Reference

A state-of-the-art full-stack TypeScript stack for an evolutionary modular monolith. Defaults plus the trade-offs to call out.

## Table of Contents

1. Monorepo & runtime
2. Frontend
3. Backend
4. Data & cache
5. Real-time, messaging, resilience
6. Observability & quality
7. Durable workflow
8. Key decisions & trade-offs

---

## 1. Monorepo & runtime

- **Nx** monorepo: `apps/` for bootstrap (one deploy today; api/worker/scheduler later), `libs/` for bounded contexts + `shared/`. Enforce boundaries in CI with `enforce-module-boundaries`; use `nx affected` for incremental build/test.
- **Node 24 LTS** as the production runtime for the always-on API.
- **Bun** for dev, tests, and scripts (fast install, native TS). Keep Bun off the always-on critical path until validated in staging — its long-running GC behavior is less battle-tested than V8.
- **TypeScript 6** (strictest settings, no `any`). **pnpm** as package manager.

## 2. Frontend

- **React 19** (Actions, `use`, `useOptimistic`, React Compiler — drop manual `useMemo`/`useCallback`).
- **Vite 7** (native ESM), **Tailwind 4** (Rust engine), **TanStack Router** (type-safe, Zod search params), **TanStack Query v5** (Suspense, optimistic).
- **Orval** generates the typed client + Query hooks from the backend OpenAPI — no hand-written fetch.
- **Vitest** + Testing Library; **Playwright** for E2E. **Biome** for lint/format. No `useEffect` for data fetching.

## 3. Backend

- **NestJS 11 + Fastify 5** adapter (higher throughput than Express).
- **Prisma** ORM; **zod** / **class-validator** for input validation; **Swagger/OpenAPI** as the contract (feeds Orval).
- Clean Architecture per module, organized flat-by-aggregate (see `flat-by-aggregate.md`).

## 4. Data & cache

- **PostgreSQL** — one database; each module is the sole writer of its own tables (schema/prefix per context; no cross-context FKs).
- **Valkey** (BSD fork of Redis OSS 7.2, Linux Foundation) for cache, rate limiting, circuit-breaker state, and SSE pub/sub. Drop-in for Redis; on AWS ElastiCache it is ~20% cheaper (node-based) to ~33% (serverless) with a zero-downtime upgrade path. Audit before adopting if you depend on Redis proprietary modules (RediSearch, RedisJSON, etc.).

## 5. Real-time, messaging, resilience

- **SSE** for server-to-client push; Valkey pub/sub to fan out across instances (see `acl-and-communication.md`).
- **Transactional outbox** for inter-module events; idempotent consumers.
- Resilience library (e.g., **Cockatiel**) for backoff + jitter, circuit breaker, bulkhead (see `resilience.md`).

## 6. Observability & quality

- **OpenTelemetry** (traces, metrics) + structured logging (**Pino**), per-module context and correlation ids.
- `tsc --noEmit` in CI; coverage target ≥ 80%; Conventional Commits.

## 7. Durable workflow

- A durable-execution engine for the long-running ticket/order lifecycle. If owned by another team, access it behind a `WorkflowOrchestrationPort` (ACL); keep domain integrations (ERP, storage, notifications) as your own capabilities the workflow invokes.

## 8. Key decisions & trade-offs

- **Runtime:** Node 24 LTS on the API; Bun for dev/test/short-lived workers (GC caveat above).
- **API style:** REST + OpenAPI + Orval by default — neutral contract that also serves external consumers (webhooks) and non-TS clients. Consider tRPC only for a closed internal UI with no external perimeter.
- **Real-time:** SSE by default; WebSocket only for true bidirectional needs.
- **Cache:** Valkey over Redis for license and cost, unless proprietary Redis modules are required.
- **Granularity:** one deploy now; promote a module to its own app/database only when its metrics justify it (evolution, not big-bang).
