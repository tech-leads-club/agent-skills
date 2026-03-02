# State Isolation

## Table of Contents

1. Entity Naming Conventions (line ~10)
2. Prisma Schema Isolation (line ~50)
3. Duplicate Entity Detection (line ~110)
4. Anti-Patterns Detection (line ~150)
5. Pre-Commit Hook (line ~190)

---

## 1. Entity Naming Conventions

**Critical rule:** Every entity MUST be prefixed with its module name. Generic names like `User`, `Plan`, `Item` cause collisions across modules and make it impossible to know which module owns the data.

### Correct Entity Naming

| Module   | Entity Name           | Database Table          |
| -------- | --------------------- | ----------------------- |
| Identity | `IdentityUser`        | `identity_users`        |
| Identity | `IdentityProfile`     | `identity_profiles`     |
| Billing  | `BillingPlan`         | `billing_plans`         |
| Billing  | `BillingSubscription` | `billing_subscriptions` |
| Orders   | `OrderItem`           | `order_items`           |
| Content  | `ContentArticle`      | `content_articles`      |

### Wrong Entity Naming

| ❌ Name   | Problem                                |
| --------- | -------------------------------------- |
| `User`    | Which module? Identity? Billing?       |
| `Plan`    | Billing plan? Subscription plan?       |
| `Item`    | Order item? Cart item? Inventory item? |
| `Profile` | User profile? Company profile?         |

### Prisma Model Naming

```prisma
// ✅ Correct: Module-prefixed with explicit table mapping
model IdentityUser {
  id    String @id @default(cuid())
  email String @unique
  name  String
  // ...
  @@map("identity_users")
}

model BillingPlan {
  id           String @id @default(cuid())
  name         String
  priceInCents Int
  // ...
  @@map("billing_plans")
}

// ❌ Wrong: Generic names without module prefix
model User {
  // ...
  @@map("users")  // Which module owns this?
}
```

---

## 2. Prisma Schema Isolation

### Option A: Single Schema, Module Prefixes

All models live in one `schema.prisma` but are clearly prefixed and grouped.

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ═══════════════════════════════════════════
// Identity Module
// ═══════════════════════════════════════════

model IdentityUser {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@map("identity_users")
}

// ═══════════════════════════════════════════
// Billing Module
// ═══════════════════════════════════════════

model BillingPlan {
  id            String              @id @default(cuid())
  name          String
  priceInCents  Int
  interval      BillingInterval
  subscriptions BillingSubscription[]
  @@map("billing_plans")
}

model BillingSubscription {
  id        String   @id @default(cuid())
  userId    String   // Reference by ID only, no FK to IdentityUser
  planId    String
  status    BillingSubscriptionStatus
  plan      BillingPlan @relation(fields: [planId], references: [id])
  createdAt DateTime @default(now())
  @@map("billing_subscriptions")
}

enum BillingInterval {
  MONTHLY
  YEARLY
}

enum BillingSubscriptionStatus {
  ACTIVE
  CANCELLED
  PAST_DUE
}

// ═══════════════════════════════════════════
// Orders Module
// ═══════════════════════════════════════════

model OrderRecord {
  id        String      @id @default(cuid())
  userId    String      // Reference by ID only
  status    OrderStatus
  total     Decimal     @db.Decimal(10, 2)
  items     OrderItem[]
  createdAt DateTime    @default(now())
  @@map("order_records")
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  price     Decimal @db.Decimal(10, 2)
  order     OrderRecord @relation(fields: [orderId], references: [id])
  @@map("order_items")
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}
```

**Key rule:** Cross-module references use `userId String` (just the ID), NOT `user IdentityUser @relation(...)`. Foreign key relations should only exist WITHIN a module.

### Option B: Multi-Schema (Prisma 5.15+)

For larger projects, use Prisma's multi-schema support:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["identity", "billing", "orders"]
}

model IdentityUser {
  id    String @id @default(cuid())
  email String @unique
  @@schema("identity")
  @@map("users")
}

model BillingPlan {
  id   String @id @default(cuid())
  name String
  @@schema("billing")
  @@map("plans")
}
```

---

## 3. Duplicate Entity Detection

Run these checks before every commit or PR merge.

### Find Duplicate Entity Names

```bash
# For Prisma schemas — find duplicate model names
grep -r "^model " prisma/ | awk '{print $2}' | sort | uniq -d
```

### Find Duplicate Table Mappings

```bash
# Find duplicate @@map values
grep -r '@@map(' prisma/ | grep -o '"[^"]*"' | sort | uniq -d
```

### Find Cross-Module Foreign Key Relations

```bash
# These should NOT exist — only within-module relations are allowed
grep -rn '@relation' prisma/schema.prisma | while read line; do
  echo "CHECK: $line"
  echo "  → Verify this relation is WITHIN a single module"
done
```

---

## 4. Anti-Patterns Detection

### Detect Shared Mutable State

```bash
# Exported mutable singletons — should not exist
grep -r "export.*=.*new" libs/ | grep -v test | grep -v node_modules
```

### Detect Direct Cross-Module Imports

```bash
# Modules should only import from @project/[module] (index barrel), never from deep paths
grep -rn "from '@project/" libs/ | grep -v "/index" | grep -v "shared" | grep -v node_modules | grep -v ".spec."
```

### Detect Synchronous Cross-Module Calls

```bash
# Direct service calls across modules — should use events instead
grep -rn "await.*Service\." libs/ | grep -v "this\." | grep -v test | grep -v node_modules
```

### Detect Missing Module Prefixes in Entities

```bash
# Entities/models with generic single-word names (potential violations)
grep -rn "^export class [A-Z][a-z]*\b " libs/*/domain/ | grep -v "Error\|Exception\|Event\|Command\|Query\|Handler\|Dto\|Module\|Guard\|Filter"
```

---

## 5. Pre-Commit Hook

Add this to `.husky/pre-commit` or equivalent. For a more comprehensive version, use `scripts/validate-isolation.sh` included in this skill.

```bash
#!/bin/bash
echo "🔍 Running state isolation checks..."

ERRORS=0

# Check 1: Duplicate Prisma model names
DUPES=$(grep -r "^model " prisma/ 2>/dev/null | awk '{print $2}' | sort | uniq -d)
if [ -n "$DUPES" ]; then
  echo "❌ Duplicate model names found: $DUPES"
  echo "   Fix: Prefix each model with its module name (e.g., BillingPlan)"
  ERRORS=$((ERRORS + 1))
fi

# Check 2: Duplicate table mappings
MAP_DUPES=$(grep -r '@@map(' prisma/ 2>/dev/null | grep -o '"[^"]*"' | sort | uniq -d)
if [ -n "$MAP_DUPES" ]; then
  echo "❌ Duplicate table mappings found: $MAP_DUPES"
  ERRORS=$((ERRORS + 1))
fi

# Check 3: Direct cross-module imports (non-barrel)
CROSS_IMPORTS=$(grep -rn "from '@project/" libs/ 2>/dev/null | grep -v "/index" | grep -v "shared" | grep -v node_modules | grep -v ".spec.")
if [ -n "$CROSS_IMPORTS" ]; then
  echo "⚠️  Direct cross-module imports detected:"
  echo "$CROSS_IMPORTS"
  echo "   Fix: Import only from module barrel (@project/module-name)"
  ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -gt 0 ]; then
  echo "❌ State isolation check failed with $ERRORS error(s). Fix issues before committing."
  exit 1
fi

echo "✅ State isolation checks passed."
```
