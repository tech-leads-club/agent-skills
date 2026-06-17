# Testing Safety Nets

No migration step should execute without a safety net. This reference defines the testing strategies to apply before, during, and after each migration phase. The goal is to detect behavioral regressions BEFORE they reach production.

## Strategy Selection Matrix

Choose testing strategies based on the migration context:

| Situation | Primary Strategy | Supporting Strategies |
|-----------|-----------------|---------------------|
| Legacy code with no tests | Characterization Tests | Golden Master |
| API migration | Contract Tests | Parallel Run, Snapshot Tests |
| Database migration | Data Consistency Validation | Parallel Run |
| Frontend migration | Visual Regression | Snapshot Tests, E2E |
| Algorithm replacement | Property-Based Tests | Parallel Run |
| Full system migration | Parallel Run | All of the above |

## Characterization Tests

**Purpose:** Capture the current behavior of legacy code BEFORE any changes. These tests document what the code does today — even if that behavior is buggy. Bugs are documented, not fixed, during this phase.

**When to use:** Legacy code with no tests, or insufficient test coverage (below 60% for the module being migrated).

**Method:**

1. Identify the public interface of the module (functions, methods, API endpoints).
2. For each public function, write tests that call it with representative inputs and assert the ACTUAL output.
3. Include edge cases: null/undefined inputs, empty collections, boundary values, error conditions.
4. If the function has side effects (database writes, API calls, file I/O), mock the external dependency and assert the mock was called with expected arguments.

**Documentation format in domain plan:**

```markdown
### Testing: Characterization Tests

**Target**: `src/orders/service.ts` (functions: createOrder, updateOrder, cancelOrder)
**Coverage goal**: 80% line coverage before any migration begins
**Edge cases to cover**:
- Empty order items (`file:line` — current behavior: throws generic Error)
- Negative quantities (`file:line` — current behavior: accepts silently, BUG)
- Concurrent modifications (`file:line` — no locking, potential race condition)
**Known bugs captured** (do not fix during characterization):
- {Bug description} at `file:line`
```

## Golden Master / Snapshot Testing

**Purpose:** Capture the complete output of complex functions or API endpoints as a reference snapshot. Any deviation from the snapshot indicates a behavioral change.

**When to use:** Functions with complex output (reports, formatted responses, HTML rendering) where writing individual assertions is impractical.

**Method:**

1. Run the function with fixed inputs.
2. Save the complete output as a "golden master" file.
3. On every subsequent run, compare the current output against the golden master.
4. Any difference requires human review: was this an intentional change?

**Tools to recommend** (verify via web search before recommending):

- Python: `approvaltests`, `syrupy`
- JavaScript/TypeScript: Jest snapshots (`toMatchSnapshot`), `storybook` for UI
- Go: `go-snaps`
- General: `insta` (Rust), custom file comparison

**Documentation format in domain plan:**

```markdown
### Testing: Golden Master

**Target**: `src/reports/monthly.ts:generateReport()`
**Golden master location**: `./migration-plan/golden-masters/monthly-report-{date}.txt`
**Fixed inputs**: {Describe the deterministic test data}
**Non-deterministic elements to normalize**: timestamps, UUIDs, random IDs
```

## Contract Tests

**Purpose:** Verify that the interface contract between two systems (or between old and new implementations) is maintained. If the new implementation satisfies the same contract, it is a safe replacement.

**When to use:** API migration, service extraction, any scenario where the consumer of an interface must not notice the change.

**Method:**

1. Define the contract: request format, response format, status codes, error responses, headers.
2. Write tests that validate BOTH the legacy and new implementations against the same contract.
3. Run contract tests in CI — both implementations must pass before traffic routing changes.

**Types of contracts:**

- **API contracts** — HTTP method, path, request body schema, response body schema, status codes.
- **Event contracts** — Event name, payload schema, ordering guarantees.
- **Database contracts** — Table schema, required columns, data types, constraints.

**Documentation format in domain plan:**

```markdown
### Testing: Contract Tests

**Contract**: Order API
**Endpoints covered**:
- `POST /api/orders` — request: OrderCreate schema, response: Order schema, status: 201
- `GET /api/orders/:id` — response: Order schema, status: 200 | 404
**Schema location**: `file:line` (OpenAPI spec) or defined inline
**Both implementations must pass**: Legacy (`src/legacy/orders.ts`) and New (`src/new/orders.ts`)
```

## Parallel Run Testing

**Purpose:** Run both old and new implementations simultaneously with the same inputs and compare outputs. The legacy result is used in production; the new result is logged for comparison.

**When to use:** High-risk migrations where you need confidence that the new implementation produces identical results before switching traffic.

**Method:**

1. Wrap the call site to invoke BOTH implementations.
2. Return the LEGACY result to the caller (production safety).
3. Run the new implementation in the background.
4. Compare results and log discrepancies.
5. Once discrepancy rate drops below threshold (e.g., < 0.1%), begin traffic migration.

**Critical safeguards:**

- New implementation failures must NEVER affect the production response.
- Comparison must account for acceptable differences (different IDs, timestamps, field ordering).
- Log enough context to reproduce discrepancies (input args, both outputs).
- Run for a statistically significant sample before drawing conclusions.

**Documentation format in domain plan:**

```markdown
### Testing: Parallel Run

**Target function**: `calculateShipping()` at `file:line`
**Comparison criteria**:
- Result amount must match within $0.01
- Delivery date must match exactly
- Carrier selection must match
**Acceptable discrepancy rate**: < 0.1% over 10,000 invocations
**Duration**: 2 weeks minimum
**Monitoring**: Log to `{observability tool}` — ASK USER what they use
```

## Property-Based Testing

**Purpose:** Discover edge cases by testing properties (invariants) that must hold for ALL inputs, not just hand-picked test cases. A test framework generates hundreds of random inputs and verifies the properties.

**When to use:** Algorithm replacement, business logic migration, any function where the space of valid inputs is large and edge cases are hard to enumerate.

**Method:**

1. Identify properties that must ALWAYS hold (e.g., "result is never negative", "output is sorted", "discount never exceeds 50%").
2. Define input generators (random valid inputs).
3. Run the property test with 100+ iterations.
4. Any failing input is a potential regression.

**Tools to recommend** (verify via web search):

- Python: `hypothesis`
- JavaScript/TypeScript: `fast-check`
- Go: `gopter`
- Rust: `proptest`

**Documentation format in domain plan:**

```markdown
### Testing: Property-Based

**Target**: `calculateDiscount()` at `file:line`
**Properties**:
- Result >= 0 (never negative)
- Result <= originalPrice (never exceeds price)
- Result >= originalPrice * 0.5 (max 50% discount, per business rule at `file:line`)
**Input space**: price [0.01, 100000], quantity [1, 1000], customerType [regular, premium]
```

## Data Consistency Validation

**Purpose:** During database migration (dual-write phase), continuously verify that both databases contain the same data.

**When to use:** Any migration involving database changes — schema migration, database technology change, database split/merge.

**Method:**

1. **Row count comparison** — Both databases should have the same number of records (with a small lag tolerance for async sync).
2. **Sample comparison** — Randomly sample N records and compare field-by-field.
3. **Checksum comparison** — Compute checksums over key fields for large tables.
4. **Reconciliation job** — Scheduled job that finds and reports discrepancies.

**Documentation format in domain plan:**

```markdown
### Testing: Data Consistency

**Tables under dual-write**: `orders`, `order_items`
**Validation frequency**: Every 15 minutes during migration
**Tolerance**: Row count difference < 100 (accounting for async lag)
**Sample size**: 1000 random records per validation run
**Discrepancy handling**: Log to monitoring, alert if > 0.1% mismatch
```

## Visual Regression Testing

**Purpose:** Detect unintended visual changes when migrating frontend components.

**When to use:** Frontend framework migration, CSS refactoring, component library replacement.

**Method:**

1. Capture screenshots of every page/component BEFORE migration.
2. After migrating a component, capture screenshots again.
3. Pixel-diff comparison identifies visual regressions.

**Tools to recommend** (verify via web search):

- Playwright visual comparisons
- Chromatic (Storybook)
- Percy
- BackstopJS

**Documentation format in domain plan:**

```markdown
### Testing: Visual Regression

**Pages/components captured**: {List with routes or component names}
**Baseline screenshots**: `./migration-plan/visual-baselines/`
**Tool**: {Verified via web search — include version}
**Threshold**: < 0.1% pixel difference per component
```

## Testing Phase Timeline

Map testing strategies to migration phases:

| Migration Phase | Required Tests | Purpose |
|----------------|---------------|---------|
| **Phase 0 (Safety Net)** | Characterization, Golden Master | Capture current behavior |
| **Phase 0 (Safety Net)** | Contract Tests | Define the interface contract |
| **Shadow phase** | Parallel Run | Compare old vs new without risk |
| **Canary phase** | All above + monitoring | Validate with real traffic |
| **Ramp phase** | Continuous contract + consistency | Ensure no drift at scale |
| **Full migration** | Full regression suite | Confirm no regressions |
| **Post-migration** | Remove parallel run, keep contracts | Ongoing validation |
