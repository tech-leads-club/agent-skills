# Assessment Framework

Methods for mapping dependencies, scoring risks, identifying domains, and evaluating technical debt. Every output from this framework must cite `file:line` from the actual codebase or a verified external source.

## Domain Identification Method

### Step 1: Module Inventory

Before identifying domains, you need a complete module inventory. For each module:

```markdown
| Module Path | Responsibility | Internal Imports | External Imports | Data Stores | Lines of Code |
|-------------|---------------|-----------------|-----------------|-------------|--------------|
| `src/orders/` | Order lifecycle | payments, inventory | Stripe API | orders, order_items | 1,200 |
```

Every cell must reference specific `file:line` evidence.

### Step 2: Affinity Grouping

Group modules that have high internal communication and share business vocabulary:

1. **Import analysis** — Modules that import each other frequently belong together.
2. **Data affinity** — Modules that read/write the same database tables belong together.
3. **Business vocabulary** — Modules that use the same domain terms (Order, Payment, Invoice) likely belong to the same or related domain.
4. **Change frequency** — Modules that change together in git history (co-change analysis) likely belong together.

For co-change analysis, check git log for files that are frequently committed together. This is strong evidence of logical coupling even when import analysis does not show it.

### Step 3: Coupling Metrics

For each candidate domain, compute:

**Cohesion score** (internal coupling — higher is better):

```
cohesion = internal_imports / total_module_count_in_domain
```

**Coupling score** (external coupling — lower is better):

```
coupling = external_imports / (internal_imports + external_imports)
```

**Database coupling** (shared tables — lower is better):

```
db_coupling = shared_tables / total_tables_accessed
```

**Interpretation:**

- Coupling < 0.3 → Good domain boundary
- Coupling 0.3-0.5 → Acceptable, may need facade
- Coupling > 0.5 → Bad boundary, consider merging with the domain it couples to

### Step 4: Domain Scorecard

For each candidate domain, produce a scorecard:

```markdown
## Domain Scorecard: {Name}

| Metric | Value | Rating |
|--------|-------|--------|
| Cohesion | 0.85 | Good |
| Coupling | 0.22 | Good |
| DB Coupling | 0.10 | Good |
| Lines of Code | 3,200 | Medium complexity |
| Test Coverage | 45% | Needs improvement before migration |
| Change Frequency | 12 commits/month | Active — high business value |

**Verdict**: Ready for migration / Needs boundary adjustment / Too coupled to migrate independently
```

## Risk Assessment Matrix

### Risk Categories

Evaluate every migration domain against these risk categories:

**Technical risks:**

- Circular dependencies blocking extraction
- Shared mutable state across domains
- Implicit coupling through global variables or singletons
- Missing test coverage for critical paths
- Database migrations affecting data integrity

**Operational risks:**

- Downtime during cutover
- Performance degradation during dual-run
- Monitoring gaps during transition
- Rollback failure scenarios

**Business risks:**

- Revenue-impacting features during migration
- Regulatory/compliance requirements
- Customer-facing SLAs that constrain migration windows
- Team skill gaps for target technology

### Risk Scoring

For each risk:

| Field | Values |
|-------|--------|
| **Impact** | Critical (system down) / High (degraded) / Medium (workaround exists) / Low (cosmetic) |
| **Probability** | High (> 50%) / Medium (20-50%) / Low (< 20%) |
| **Risk Score** | Impact x Probability: Critical=4, High=3, Medium=2, Low=1. Score = impact_val x probability_val |
| **Severity** | Score >= 12: CRITICAL / >= 8: HIGH / >= 4: MEDIUM / < 4: LOW |

### Risk Documentation Format

```markdown
## Risk: {Short description}

**Category**: Technical | Operational | Business
**Impact**: {Level} — {Why, with evidence from codebase: file:line}
**Probability**: {Level} — {Why, with evidence}
**Score**: {Number} → **{Severity}**
**Mitigation**: {Specific strategy — reference pattern from strangler-fig-patterns.md if applicable}
**Residual risk**: {Risk level after mitigation is applied}
**Owner**: {Who should monitor this — ask user if unclear}
```

### Risk Prioritization

Sort all risks by score (descending). The top 3-5 risks must be addressed in the migration roadmap's Phase 0 (Safety Net Setup). Any CRITICAL risk that cannot be mitigated must be escalated to the user before proceeding with the plan.

## Technical Debt Evaluation

### Debt Categories

| Category | Indicators | How to Detect |
|----------|-----------|---------------|
| **Dependency debt** | Outdated/deprecated packages | Compare versions in dependency files against latest via web search |
| **Architecture debt** | Circular deps, god classes, scattered data access | Import analysis, module size, SQL-in-controllers |
| **Test debt** | Low coverage, no integration tests | Test file count vs source file count, coverage config presence |
| **Infrastructure debt** | Manual deployments, no CI/CD, no containerization | Check for Dockerfile, CI config, deployment scripts |
| **Documentation debt** | No API docs, no architecture diagrams | Check for docs/, README content, OpenAPI specs |

### Debt Impact Assessment

For each debt item, evaluate:

1. **Migration blocker?** — Does this debt PREVENT migration? (e.g., circular dependencies block service extraction)
2. **Migration amplifier?** — Does this debt make migration HARDER? (e.g., no tests mean no safety net)
3. **Can resolve during migration?** — Will the migration naturally fix this? (e.g., moving to new framework eliminates deprecated dependency)
4. **Must resolve before migration?** — Is this a prerequisite? (e.g., need test coverage before safe refactoring)

Classification:

- **Blocker** → Must resolve in Phase 0 before any migration begins
- **Amplifier** → Should resolve in Phase 0, or accept increased risk
- **Resolved by migration** → Document but do not prioritize separately
- **Pre-requisite** → Schedule in Phase 0

## Component Complexity Scoring

Rate each domain/module on a 1-10 scale across these dimensions:

| Dimension | 1-3 (Low) | 4-6 (Medium) | 7-10 (High) |
|-----------|-----------|--------------|-------------|
| **Size** | < 500 LOC | 500-2000 LOC | > 2000 LOC |
| **Dependencies** | 0-2 external | 3-5 external | > 5 external |
| **Data coupling** | Own tables only | 1-2 shared tables | 3+ shared tables |
| **Test coverage** | > 70% | 40-70% | < 40% |
| **Change frequency** | < 2 commits/month | 2-10 commits/month | > 10 commits/month |
| **Business criticality** | Internal tools | Customer-facing non-critical | Revenue/auth/payment |

**Composite score** = average of all dimensions.

**Migration order recommendation:**

- Score 1-3: Migrate first (quick wins, low risk)
- Score 4-6: Migrate in middle phases (moderate complexity)
- Score 7-10: Migrate last (highest risk, needs most preparation)

## Integration Point Catalog Format

For every external integration discovered during RESEARCH:

```markdown
## Integration: {Name}

**Type**: REST API | GraphQL | gRPC | Message Queue | Database | File System | Third-party SDK
**Location**: `file:line` (where the call/connection is made)
**Direction**: Outbound (we call them) | Inbound (they call us) | Bidirectional
**Protocol**: HTTP/HTTPS | AMQP | WebSocket | TCP | etc.
**Authentication**: API key | OAuth | mTLS | None | Unknown (ASK USER)
**Data format**: JSON | XML | Protobuf | CSV | Binary | Unknown (ASK USER)
**Error handling**: `file:line` (how errors are currently handled)
**Contract**: OpenAPI spec at {path} | Proto file at {path} | None documented
**SLA**: {If known — ASK USER if critical integration}
**Migration impact**: Can wrap in facade | Needs contract renegotiation | Must maintain as-is
```
