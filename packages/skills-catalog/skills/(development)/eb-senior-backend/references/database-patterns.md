# Database Patterns Reference

## Migration Strategy

Always use migrations — never modify schemas manually.

```bash
# Drizzle
npx drizzle-kit generate
npx drizzle-kit migrate

# Prisma
npx prisma migrate dev --name add_users_table
npx prisma migrate deploy  # production
```

Rules:
- One migration per logical change
- Never modify a deployed migration — create a new one
- Test migrations against a copy of production data before deploying
- Always have a rollback plan

## Seeding

```typescript
// seed.ts
async function seed() {
  await db.insert(users).values([
    { email: 'admin@example.com', name: 'Admin', role: 'admin' },
  ]);
  console.log('Seed complete');
}
```

Run: `npx tsx seed.ts` (dev only — never auto-seed in production)

## Multi-Tenancy Patterns

| Pattern | Isolation | Complexity | When |
|---------|-----------|-----------|------|
| **Shared DB, tenant column** | Low | Low | <100 tenants, simple data |
| **Shared DB, separate schemas** | Medium | Medium | Compliance needs |
| **Separate databases** | High | High | Enterprise, strict isolation |

Default for solo founders: **Shared DB with tenant column** + row-level security.

```sql
-- Row-level security in Postgres
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON projects
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

## Connection Pooling

Never open a new connection per request.

```typescript
// Use connection pool
import { Pool } from 'pg';
const pool = new Pool({
  max: 20,                    // max connections
  idleTimeoutMillis: 30000,   // close idle connections after 30s
  connectionTimeoutMillis: 2000,
});
```

For serverless: Use a pooler like PgBouncer, Supabase Pooler, or Neon's connection pooling.

## Query Optimization

### Index Strategy

```sql
-- Index columns you filter/sort by
CREATE INDEX idx_users_email ON users(email);

-- Composite index for multi-column queries
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);

-- Partial index for filtered queries
CREATE INDEX idx_active_users ON users(email) WHERE deleted_at IS NULL;
```

### N+1 Query Prevention

```typescript
// BAD: N+1
const users = await db.query('SELECT * FROM users');
for (const user of users) {
  user.posts = await db.query('SELECT * FROM posts WHERE user_id = ?', [user.id]);
}

// GOOD: Join or batch
const usersWithPosts = await db.query(`
  SELECT u.*, json_agg(p.*) as posts
  FROM users u
  LEFT JOIN posts p ON p.user_id = u.id
  GROUP BY u.id
`);
```

### EXPLAIN ANALYZE

Always check query plans for slow queries:
```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = '...' ORDER BY created_at DESC LIMIT 20;
```

Look for: Sequential scans on large tables, high row estimates, missing indexes.
