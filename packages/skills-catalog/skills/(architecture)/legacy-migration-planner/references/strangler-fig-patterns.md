# Strangler Fig Patterns

The Strangler Fig pattern, coined by Martin Fowler, gradually replaces legacy systems by building new functionality around the old system, eventually replacing it entirely. Named after tropical fig vines that germinate on a host tree, draw nutrients from it, and eventually become self-sustaining.

This reference covers the pattern in ALL directions — not just decomposition.

## Core Concept

Four high-level activities (per Cartwright, Horn, and Lewis, cited by Fowler):

1. **Establish clear desired outcomes** with organizational alignment.
2. **Identify seams** to decompose the system into manageable components.
3. **Replace isolated components** with acceptable risk levels.
4. **Evolve organizational culture** and development practices alongside the system.

Key principle: **transitional architecture** — temporary code that enables new and legacy systems to coexist. This overhead is justified by the reduced risk compared to big-bang replacement.

## Pattern 1: API Gateway Strangler

Use when the system exposes HTTP/REST/GraphQL APIs and you need to route traffic between legacy and new implementations.

**How it works:**

1. Place a routing layer (API gateway, reverse proxy, or application-level router) in front of the legacy system.
2. New implementations register for specific routes.
3. The router directs traffic based on feature flags, percentage rollout, or user segments.
4. Legacy routes are decommissioned once the new implementation is validated.

**Applies to:**

- Monolith → microservices (route individual endpoints to new services)
- Microservices → monolith (route service endpoints back to a unified application)
- Framework migration (e.g., Flask → FastAPI: proxy unmigrated routes to old framework)

**Routing decision logic:**

- `percentage = 0` → all traffic to legacy
- `percentage = 100` → all traffic to new
- `0 < percentage < 100` → use consistent hashing on user ID or session for sticky routing (so the same user always hits the same implementation during canary)

**Rollback:** Set routing percentage back to 0. Instant. No deployment needed.

## Pattern 2: Service Extraction with Adapter

Use when extracting a bounded context from a monolith into a separate service (or the reverse — absorbing a service into a monolith).

**How it works:**

1. **Extract interface** — Define an abstraction (interface/protocol/ABC) that represents the capability.
2. **Wrap legacy** — Create an adapter that implements the interface by delegating to the legacy code.
3. **Implement new** — Build the new implementation behind the same interface.
4. **Route via dependency injection** — Use feature flags to select which implementation to inject.

**Applies to:**

- Monolith → services (extract module behind interface, then move implementation to separate deployment)
- Services → monolith (create interface in monolith, implement by calling the service, then inline the implementation and remove the service)

**Key considerations:**

- The adapter must handle protocol differences (sync → async, different error types, data format translation).
- Both implementations must satisfy the same contract tests.
- During transition, the interface acts as the seam.

## Pattern 3: Database Strangler (Dual-Write)

Use when the migration involves changing the data store (different database, different schema, or splitting a shared database).

**How it works:**

1. **New writes go to new database** (source of truth).
2. **Async sync to legacy** database for backwards compatibility (best effort — log failures but do not fail the operation).
3. **Reads try new database first**, fall back to legacy if not found.
4. **Lazy migration** — When a record is read from legacy, copy it to new database before returning.
5. **Once all data is migrated**, stop dual-write and decommission legacy database.

**Applies to:**

- Schema migration (old schema → new schema in same or different DB)
- Database technology change (PostgreSQL → DynamoDB, MongoDB → PostgreSQL, etc.)
- Database split (shared DB → per-service databases)
- Database merge (per-service DBs → unified database)

**Critical safeguards:**

- The new database is ALWAYS the source of truth for writes once dual-write begins.
- Legacy sync failures are logged and retried, never blocking the main operation.
- Data consistency validation runs continuously comparing both databases.
- Backfill job migrates historical data that is never lazy-migrated (cold data).

## Pattern 4: UI Component Strangler

Use when migrating frontend frameworks (jQuery → React, Angular → Vue, microfrontends → monolith, etc.).

**How it works:**

1. **Both frameworks coexist** in the same page/application.
2. **Feature flag wrapper component** decides which implementation to render.
3. **New components load lazily** (code splitting) to avoid bundle bloat during transition.
4. **Shared state bridge** connects old and new frameworks for data that must be in sync.
5. **Route-level migration** — Migrate entire pages/routes at a time, not individual components (unless components are truly independent).

**Applies to:**

- jQuery/Backbone → React/Vue/Svelte
- Microfrontends → unified SPA
- Unified SPA → microfrontends
- Angular → React (or any framework-to-framework)
- Server-rendered → client-rendered (or vice versa)

**Key considerations:**

- Bundle size grows during transition (two frameworks loaded). Mitigate with lazy loading and route-based code splitting.
- Shared state is the hardest problem. Use an event bus or global state proxy that both frameworks can subscribe to.
- CSS conflicts between frameworks need scoping (CSS modules, Shadow DOM, or naming conventions).

## Pattern 5: Event Interception

Use when the legacy system communicates through events (message queues, event emitters, webhooks) and you need to intercept and redirect those events.

**How it works:**

1. **Intercept events** at the source — wrap legacy event producers to also emit to the new event bus.
2. **Both old and new consumers** receive events during transition.
3. **New consumers process events** using the modern format/logic.
4. **Legacy consumers are decommissioned** once new consumers are validated.

**Applies to:**

- Modernizing event-driven architectures
- Migrating message queue technology (RabbitMQ → Kafka, SQS → EventBridge)
- Adding event sourcing to a system that currently does direct writes

**Key considerations:**

- Event format transformation must be well-defined and tested (old format → new format mapping).
- Ordering guarantees may differ between old and new systems — document and handle this.
- During transition, some events will be processed twice (by old and new consumers). Ensure idempotency.

## Pattern 6: Branch by Abstraction

Use for large-scale refactoring where you cannot extract a service but need to replace an internal implementation.

**How it works:**

1. **Create an abstraction** (interface) for the component being replaced.
2. **All call sites are updated** to use the abstraction instead of the concrete implementation.
3. **Legacy implementation wrapped** behind the abstraction.
4. **New implementation built** behind the same abstraction.
5. **Feature flag switches** between implementations.
6. **Legacy implementation removed** once new is validated.

**Applies to:**

- Replacing internal libraries (custom ORM → SQLAlchemy, custom HTTP client → axios)
- Algorithm replacement (performance optimization)
- Replacing vendor SDKs
- Any internal refactoring that is too large for a single PR

**Difference from Service Extraction:** Branch by Abstraction stays within the same deployment unit. Service Extraction moves the implementation to a separate deployment.

## Migration Phase Management

Regardless of which pattern(s) you use, every migration follows these phases:

| Phase       | Traffic to New                 | Duration                   | Validation                   | Rollback Trigger           |
| ----------- | ------------------------------ | -------------------------- | ---------------------------- | -------------------------- |
| **Setup**   | 0%                             | Until infrastructure ready | Smoke tests pass             | N/A                        |
| **Shadow**  | 0% (dual-run, compare results) | 1-2 weeks                  | Result parity > 99%          | Mismatch rate > 5%         |
| **Canary**  | 5-10%                          | 1-2 weeks                  | Error rate < baseline + 0.1% | Error rate > baseline + 1% |
| **Ramp**    | 25% → 50% → 75%                | 2-4 weeks per step         | Performance parity           | Latency > 2x baseline      |
| **Full**    | 100%                           | Minimum 30 days            | All metrics green            | Any metric degradation     |
| **Cleanup** | 100% (legacy removed)          | 1-2 weeks                  | Legacy unused for 30 days    | N/A (cannot rollback)      |

**Critical rule:** Never proceed to the next phase until the current phase's validation criteria are met. If a rollback trigger fires, go back ONE phase (not all the way to 0%).

## Choosing the Right Pattern

When writing the migration plan, use this decision matrix to select patterns for each domain:

| Situation                                 | Primary Pattern                 | Supporting Patterns                            |
| ----------------------------------------- | ------------------------------- | ---------------------------------------------- |
| HTTP API needs to route between old/new   | API Gateway Strangler           | Service Extraction for each endpoint           |
| Module needs to become a separate service | Service Extraction with Adapter | Branch by Abstraction for internal deps        |
| Database schema must change               | Database Strangler (Dual-Write) | API Gateway for read/write routing             |
| Frontend framework change                 | UI Component Strangler          | Event Interception for shared state            |
| Internal library replacement              | Branch by Abstraction           | —                                              |
| Event/messaging system change             | Event Interception              | Database Strangler if events drive writes      |
| Multiple services → monolith              | API Gateway Strangler (reverse) | Service Extraction (reverse — absorb)          |
| Monolith → modular monolith               | Branch by Abstraction           | — (no service boundary, just internal modules) |
