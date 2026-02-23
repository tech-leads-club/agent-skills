# Frontend and Backend Migration Strategies

Stack-specific patterns for both frontend and backend migrations. This reference is direction-agnostic — it covers decomposition, consolidation, and cross-stack migrations for both layers.

Always verify tool/framework recommendations via web search before including them in the migration plan. Never recommend a tool based solely on this reference — versions and ecosystems change.

## Frontend Strategies

### Frontend Decomposition: Monolith SPA → Microfrontends

**When:** A large SPA has become too complex for a single team, deployment is slow, and teams need autonomy.

**Seam identification:**

- Route-level boundaries — Each route or route group becomes a candidate microfrontend.
- Feature boundaries — Distinct features (dashboard, settings, admin) that have minimal shared state.
- Look for: React Router config, Vue Router config, Angular routing modules. Cite `file:line`.

**Strangler approach:**

1. Add a shell application (app shell) that handles routing and loads microfrontends.
2. Migrate one route at a time to a separate microfrontend.
3. The shell routes to either the legacy SPA or the new microfrontend based on URL.
4. Shared components are extracted to a component library consumed by all microfrontends.

**Shared state during transition:**

- Custom events via `window.dispatchEvent()` / `window.addEventListener()`.
- Shared state store accessible to both old and new (e.g., a global proxy object).
- URL-based state (query parameters, hash fragments) as a coordination mechanism.

**Key risks:**

- Bundle size bloat (two frameworks loaded simultaneously).
- CSS conflicts between old and new frameworks.
- Shared authentication/session state.
- Performance degradation from multiple framework bootstraps.

### Frontend Consolidation: Microfrontends → Unified SPA

**When:** Microfrontend overhead exceeds benefits — too few teams, excessive duplication, poor user experience from inconsistent UI, complex deployment pipeline.

**Strangler approach (reverse):**

1. Create the unified SPA application.
2. For each microfrontend, reimplement its functionality as a module/route within the unified SPA.
3. The shell application routes to the new unified SPA for migrated routes, and to legacy microfrontends for the rest.
4. Once all routes are migrated, decommission the shell and microfrontend infrastructure.

**Key considerations:**

- Merge shared component libraries into one.
- Consolidate state management (multiple stores → single store).
- Unify build tooling and CI/CD.
- Resolve CSS/styling conflicts.

### Frontend Cross-Framework Migration

**When:** jQuery → React, Angular → React, Vue 2 → Vue 3, any framework-to-framework.

**Strangler approach:**

1. **Mount point strategy** — The new framework mounts into specific DOM elements while the old framework controls the rest of the page.
2. **Route-level migration** — Entire pages are rewritten in the new framework. The router (or server) decides which framework serves which route.
3. **Component-level migration** — Individual components are replaced. A wrapper component bridges the old framework to render the new component.

**Choosing the right level:**

- Route-level is safer and simpler (clear boundary, no cross-framework communication needed within a page).
- Component-level is necessary when pages are too complex to rewrite at once, or when a shared component (e.g., navigation bar) must be migrated independently.

**Shared state bridge patterns:**

- **Event bus** — Both frameworks emit and listen to custom DOM events.
- **Global state proxy** — A `Proxy` object that triggers re-renders in both frameworks when mutated.
- **URL state** — State encoded in URL (query params, hash) is framework-agnostic.
- **Cookie/localStorage** — For persistent state that both frameworks need to read.

**CSS isolation strategies:**

- CSS Modules (scoped class names).
- Shadow DOM (full isolation).
- BEM naming convention (less isolation but no tooling needed).
- CSS-in-JS (framework-specific — only works for the framework using it).

### Server-Rendered ↔ Client-Rendered Migration

**SSR → CSR (or vice versa):**

1. Identify which pages benefit from SSR (SEO, initial load performance) vs CSR (interactivity, dynamic content).
2. Migrate page by page — the server can return either SSR HTML or a CSR shell based on the route.
3. Use progressive hydration or streaming SSR as intermediate steps if the target framework supports it.

**Key risks:**

- SEO impact when moving from SSR to CSR (verify with web search for current best practices).
- Initial load performance changes.
- Data fetching patterns differ (server-side data loading vs client-side API calls).

## Backend Strategies

### Backend Decomposition: Monolith → Microservices

**Seam identification:**

- **API route groups** — Routes that share a prefix (`/api/orders/*`, `/api/users/*`) are natural service candidates. Cite route definitions at `file:line`.
- **Database table clusters** — Tables that are only accessed by one module are good extraction candidates. Tables accessed by multiple modules need facade/dual-write strategies.
- **Background job groups** — Scheduled tasks and workers that process a specific domain.

**Strangler approach:**

1. Place an API gateway or reverse proxy in front of the monolith.
2. Extract one bounded context at a time into a new service.
3. The gateway routes requests for extracted endpoints to the new service, everything else to the monolith.
4. The new service has its own database (if data was isolated) or uses dual-write (if data was shared).
5. Inter-service communication uses events (preferred) or synchronous calls (when necessary).

**Database extraction patterns:**

- **Owned tables** (only this domain writes to them) → Move tables to new service's database. The monolith reads via API instead of direct DB access.
- **Shared tables** (multiple domains write) → Dual-write pattern during transition. One service becomes the owner, others use API.
- **Reference tables** (lookup data read by many) → Replicate via events or shared read-only access during transition.

**Communication patterns during transition:**

- **Synchronous** (HTTP/gRPC) — Simpler to implement, but creates runtime coupling. Use for commands (writes) where the caller needs immediate confirmation.
- **Asynchronous** (message queue/events) — Decouples services, but adds complexity. Use for notifications, data sync, and operations where eventual consistency is acceptable.
- **Hybrid** — Commands via sync, events via async. Most common pattern during migration.

### Backend Consolidation: Microservices → Modular Monolith

**When:** Operational overhead of microservices exceeds value — too many services for the team size, distributed system complexity is unwarranted, data consistency problems across services.

**Strangler approach (reverse):**

1. Create the monolith application with clear module boundaries (separate directories, dependency injection, no cross-module database access).
2. For each microservice, reimplement its logic as a module within the monolith.
3. The API gateway routes migrated endpoints to the monolith, non-migrated to legacy services.
4. Replace inter-service HTTP/gRPC calls with in-process function calls.
5. Merge databases into a single database with schema-level isolation (one schema per module).

**Key considerations:**

- Preserve module boundaries within the monolith (do not create a big ball of mud).
- Use dependency injection to maintain loose coupling between modules.
- Keep the option to re-extract services later if needed.
- Consolidate observability (one set of logs, metrics, traces instead of per-service).

### Backend Cross-Language Migration

**When:** Python → TypeScript/NestJS, Ruby → Go, Java → Kotlin, PHP → Node.js, or any language-to-language migration.

**Strangler approach:**

1. **API gateway routes** between old and new language services.
2. Migrate one endpoint group at a time to the new language.
3. Both implementations share the same database during transition (or use dual-write if schema changes).
4. Contract tests verify both implementations produce identical responses.

**Critical research requirements:**

- Use web search to find official migration guides between the specific languages/frameworks.
- Use context7 to query the target framework's documentation for: project setup, ORM/database patterns, authentication, middleware, testing.
- Research the ecosystem: are equivalent libraries available? (e.g., does the target language have a mature ORM, job scheduler, etc.)
- Research deployment: does the target language fit the existing infrastructure? (Docker images, serverless compatibility, memory/CPU requirements)

**Data layer considerations:**

- ORM differences (SQLAlchemy vs TypeORM vs Prisma vs GORM) — model definitions, migration tools, query builders differ significantly.
- Connection pooling strategies differ by language runtime.
- Transaction management patterns differ (context managers in Python, decorators in NestJS, defer in Go).

## Database Migration Strategies

These apply to BOTH frontend (client-side storage, IndexedDB, localStorage) and backend (SQL, NoSQL, etc.) migrations.

### Schema Evolution (Expand-Contract)

For changing schema within the same database:

1. **Expand** — Add new columns/tables. Do not remove anything yet. Ensure defaults or nullable.
2. **Migrate code** — Update application to write to BOTH old and new columns.
3. **Backfill** — Migrate existing data from old columns to new columns.
4. **Switch reads** — Application reads from new columns (with fallback to old).
5. **Contract** — Remove old columns once all reads are migrated and validated.

### Technology Change (PostgreSQL → DynamoDB, etc.)

Use the Database Strangler (Dual-Write) pattern from `strangler-fig-patterns.md`:

1. New writes go to new database (source of truth).
2. Async sync to old database.
3. Reads try new first, fallback to old.
4. Lazy migration on read.
5. Backfill job for cold data.
6. Decommission old database.

**Critical:** Research the target database thoroughly via web search. Understand: data modeling differences (relational vs document vs key-value), query pattern changes, transaction support, consistency model, and operational requirements (backup, monitoring, scaling).

## API Versioning During Migration

When endpoints are being migrated, you need a versioning strategy to avoid breaking existing consumers.

**Strategies (choose based on context):**

| Strategy | Mechanism | Best For |
|----------|-----------|----------|
| **URL versioning** | `/api/v1/` vs `/api/v2/` | Public APIs with many consumers |
| **Header versioning** | `Accept-Version: 2` | Internal APIs, fewer consumers |
| **Content negotiation** | `Accept: application/vnd.api.v2+json` | REST-purist APIs |
| **No versioning** (additive only) | New fields added, nothing removed | Simple migrations, backward-compatible changes |

**Deprecation protocol:**

1. Add deprecation header to old version responses: `X-API-Deprecated: true`, `X-API-Sunset: {date}`.
2. Log usage of deprecated endpoints to track consumer migration progress.
3. Notify consumers (via documentation, email, or API response headers).
4. Sunset old version only after usage drops to zero (or after sunset date with advance notice).

## Observability During Migration

Every migration must include observability to compare old and new behavior:

**Metrics to track:**

- Error rate (old vs new)
- Latency (p50, p95, p99 — old vs new)
- Throughput (requests per second — old vs new)
- Business metrics (conversion rate, order value, etc. — verify no degradation)

**Recommended approach:**

- Tag all requests/events with `migration_path: legacy | new` in the observability tool.
- Create a dashboard comparing old vs new across all metrics.
- Set alerts for: error rate difference > 1%, latency difference > 2x, business metric difference > 5%.
- ASK THE USER what observability tools they use. Do not assume.
