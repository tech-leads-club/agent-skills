# Architecture Patterns Reference

## Common Patterns for Solo Founders

### Modular Monolith

Structure a monolith with clear module boundaries:

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.repository.ts
│   │   └── auth.types.ts
│   ├── billing/
│   │   ├── billing.service.ts
│   │   ├── billing.controller.ts
│   │   └── billing.types.ts
│   └── core/
│       ├── core.service.ts
│       └── core.types.ts
├── shared/
│   ├── database/
│   ├── middleware/
│   └── utils/
└── app.ts
```

Rules:
- Modules communicate through defined interfaces, never direct imports of internals
- Each module owns its database tables
- Shared code lives in `shared/` and must be stateless
- You can extract any module into a service later by replacing the interface with an API call

### Event-Driven (Lightweight)

For async operations without full message queues:

```
// In-process event bus (good for monoliths)
EventBus.emit('user.created', { userId, email })
EventBus.on('user.created', sendWelcomeEmail)
EventBus.on('user.created', createDefaultWorkspace)
```

Upgrade path: Replace in-process EventBus with Redis Pub/Sub or SQS when you need cross-service events.

### CQRS (Simple Version)

Separate read and write models when read patterns differ significantly from write patterns:

```
// Write: normalized, validated
POST /api/projects → ProjectService.create(data)

// Read: denormalized, optimized for display
GET /api/dashboard → DashboardReadModel.get(userId)
```

Don't use full CQRS with event sourcing unless you have a specific need (audit trail, temporal queries).

## Database Selection Guide

| Need | Choose | Why |
|------|--------|-----|
| General purpose, relational data | **PostgreSQL** | Mature, JSON support, full-text search, extensions |
| Document-heavy, schema flexibility | **MongoDB** | Flexible schema, good for prototyping (but Postgres JSONB often suffices) |
| Real-time, presence, subscriptions | **Supabase (Postgres)** | Realtime built-in, auth included, generous free tier |
| Key-value cache, sessions | **Redis** | Fast, simple, pub/sub support |
| Full-text search | **PostgreSQL** (with pg_trgm) or **Meilisearch** | Postgres for simple, Meilisearch for advanced |
| Time-series data | **TimescaleDB** (Postgres extension) | Built on Postgres, familiar SQL |
| Edge/embedded | **SQLite** (via Turso/Litestream) | Zero ops, surprisingly powerful |

Default for solo founders: **PostgreSQL** (via Supabase or Neon for managed hosting).

## Scaling Strategies (When You Actually Need Them)

### Vertical First
Before anything else: upgrade your server. A single beefy machine handles more than most startups will ever need.

### Horizontal When Needed
| Component | Strategy |
|-----------|----------|
| Stateless API servers | Add more instances behind load balancer |
| Database reads | Read replicas |
| Database writes | Connection pooling (PgBouncer), then sharding (last resort) |
| Static assets | CDN (Cloudflare, Vercel Edge) |
| Background jobs | Worker queue (BullMQ, SQS) |
| Search | Dedicated search service (Meilisearch, Algolia) |

### Caching Layers
```
Browser Cache → CDN → API Cache (Redis) → Database
```

Cache invalidation strategy: TTL-based for most things. Event-based invalidation for critical data.

## Security Architecture Checklist

| Layer | Must Have |
|-------|----------|
| **Auth** | JWT with refresh tokens OR session-based. Never roll your own crypto. |
| **Authorization** | Role-based (RBAC) minimum. Row-level security for multi-tenant. |
| **Input validation** | Validate ALL inputs at API boundary. Use Zod/Joi. |
| **SQL injection** | Use ORM or parameterized queries. Never string concatenation. |
| **XSS** | React/Next.js handles most. Sanitize user-generated HTML. |
| **CSRF** | SameSite cookies + CSRF tokens for traditional forms. |
| **Rate limiting** | Per-IP and per-user. Use Redis-based rate limiter. |
| **Secrets** | Environment variables. Never in code. Rotate regularly. |
| **HTTPS** | Everywhere. No exceptions. |
| **Headers** | Helmet.js or equivalent for security headers. |
