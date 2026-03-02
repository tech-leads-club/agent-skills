# Research Phase — Detailed Methodology

This reference contains the step-by-step process for the RESEARCH phase. Every finding must cite `file:line` from the user's codebase or a verified external URL. If you cannot verify something, do not include it — ask the user instead.

## Step 1: Codebase Deep Analysis

### 1.1 — Project Structure Scan

Read the root directory and map the top-level structure. Identify:

- **Entry points** — `main.ts`, `index.ts`, `app.py`, `manage.py`, `server.go`, etc. Cite each as `file:line`.
- **Configuration files** — `package.json`, `requirements.txt`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `pom.xml`, `docker-compose.yml`, `Makefile`, etc. These reveal the stack, versions, and scripts.
- **Build and deploy config** — `Dockerfile`, CI/CD pipelines (`.github/workflows/`, `Jenkinsfile`, `.gitlab-ci.yml`), infrastructure as code (`terraform/`, `cdk/`, `cloudformation/`).
- **Monorepo indicators** — `nx.json`, `lerna.json`, `turbo.json`, `pnpm-workspace.yaml`, workspace definitions in `package.json`.

### 1.2 — Dependency Inventory

For each dependency file found:

1. Read the file completely.
2. List every dependency with its **pinned or range version**.
3. Use web search to check: is this dependency still maintained? What is the latest version? Are there known security vulnerabilities?
4. Flag deprecated, unmaintained, or end-of-life dependencies.

Output format for `dependency-map.md`:

```markdown
## Dependencies — {file:line ref to dependency file}

| Dependency | Current Version | Latest Version | Status | Notes |
|------------|----------------|----------------|--------|-------|
| express    | 4.17.1         | 4.21.2         | Active | Minor upgrade needed |
| moment     | 2.29.1         | 2.30.1         | Deprecated | Replace with dayjs/date-fns |
```

### 1.3 — Module Responsibility Mapping

For each directory/module in the codebase:

1. Read the main files (entry point, index, barrel exports).
2. Identify the module's **single responsibility** in one sentence.
3. List its **internal imports** (which other modules does it depend on?).
4. List its **exports** (what does it expose to other modules?).
5. Identify **external service calls** (HTTP clients, database queries, message queues, gRPC, etc.).

Do NOT summarize or paraphrase code. Reference it: "Module `src/orders/` (see `src/orders/index.ts:1-45`) handles order creation and delegates payment to `src/payments/` (import at `src/orders/service.ts:3`)."

### 1.4 — Database and Data Layer Analysis

Identify all data persistence:

- **Database connections** — Connection strings, ORM configurations, migration files.
- **Schema definitions** — Models, entities, migration files. Map every table/collection and its relationships.
- **Shared databases** — Multiple modules accessing the same tables is a critical coupling point. Flag every instance with `file:line`.
- **Data flow** — Where is data written? Where is it read? Are there read replicas, caches, or derived stores?

## Step 2: Domain / Bounded Context Mapping

Load `references/assessment-framework.md` for the scoring methodology.

### 2.1 — Candidate Identification

Based on the module mapping from Step 1, group modules into candidate bounded contexts. A bounded context is a group of modules that:

- Share a common business domain (e.g., "Orders", "Payments", "User Management")
- Have high internal cohesion (many imports between themselves)
- Have low external coupling (few imports from other groups)

### 2.2 — Coupling Analysis

For each candidate domain, calculate:

- **Internal dependencies** — Number of imports between modules within this domain.
- **External dependencies** — Number of imports from modules outside this domain.
- **Shared database tables** — Tables accessed by this domain AND other domains.
- **Coupling ratio** — `external_deps / (internal_deps + external_deps)`. Lower is better. Above 0.5 means the domain boundary is wrong.

### 2.3 — Domain Candidate Report

Output format for `domain-candidates.md`:

```markdown
## Domain: {Name}

**Modules**: `src/orders/`, `src/order-items/`, `src/order-history/`
**Responsibility**: Handles order lifecycle from creation to fulfillment.
**Internal cohesion**: 12 internal imports
**External coupling**: 3 external imports (payments, inventory, notifications)
**Shared tables**: `orders`, `order_items` (also accessed by `src/reports/` at `src/reports/monthly.ts:45`)
**Coupling ratio**: 0.20 (good)
**Migration complexity**: Medium — shared table access from reports needs facade.
```

## Step 3: Stack Research

This step is MANDATORY. Never skip it. Never rely solely on training data.

### 3.1 — Current Stack Research

For each technology identified in the dependency inventory:

1. **Web search** the technology name + "documentation" + current year.
2. **Context7** (if available): resolve the library ID and query for migration guides, deprecation notices, and upgrade paths.
3. Document: current version in use, latest stable version, LTS status, end-of-life dates, known migration paths.

### 3.2 — Target Stack Research (if applicable)

If the migration involves a new stack (e.g., Python to NestJS, jQuery to React):

1. **Web search** for official migration guides between the two stacks.
2. **Context7**: query the target framework's documentation for getting started, architectural patterns, and best practices.
3. **Web search** for community migration experiences (blog posts, conference talks, case studies).
4. Document: target stack version recommendation (with justification), architectural differences, feature parity gaps, and learning curve considerations.

### 3.3 — Compatibility Matrix

Output format for `stack-research.md`:

```markdown
## Current Stack

| Technology | Version in Use | Latest Stable | EOL Date | Source |
|------------|---------------|---------------|----------|--------|
| Node.js    | 16.x          | 22.x LTS     | 2023-09  | [nodejs.org/releases](url) |

## Target Stack (if applicable)

| Technology | Recommended Version | Justification | Source |
|------------|-------------------|---------------|--------|
| NestJS     | 10.x             | Latest stable, TS-first | [docs.nestjs.com](url) |

## Migration Guides Found

- [Official NestJS migration from Express](url) — covers middleware, guards, pipes
- [Community: Django to NestJS lessons learned](url) — data layer considerations
```

## Step 4: Risk and Dependency Mapping

Load `references/assessment-framework.md` for the risk matrix methodology.

### 4.1 — Integration Point Catalog

For every external integration (APIs, databases, message queues, third-party services):

1. Identify the integration point with `file:line`.
2. Document: protocol, authentication method, data format, error handling.
3. Assess: can this integration be wrapped in a facade? Is there a contract/schema?

### 4.2 — Circular Dependency Detection

Trace import chains looking for cycles: A imports B, B imports C, C imports A. Each cycle is a critical blocker for domain extraction. Document every cycle with the full import chain and `file:line` references.

### 4.3 — Risk Assessment

For each identified risk, document in `risk-assessment.md`:

```markdown
## Risk: {Description}

**Impact**: Critical | High | Medium | Low
**Probability**: High | Medium | Low
**Evidence**: {file:line or external reference}
**Mitigation**: {Specific strategy}
**Residual risk after mitigation**: {Assessment}
```

## Research Completion Checklist

Before moving to PLAN phase, verify ALL of the following:

- [ ] Every module in the codebase has been read and mapped
- [ ] Every dependency has been checked against current versions via web search
- [ ] Bounded context candidates are identified with coupling ratios
- [ ] Current stack is researched with verified, cited sources
- [ ] Target stack (if applicable) is researched with verified, cited sources
- [ ] All integration points are cataloged with `file:line` refs
- [ ] Circular dependencies are identified
- [ ] Risk assessment is complete with mitigations
- [ ] All four research output files are written to `./migration-plan/research/`
- [ ] No unverified claims exist in any output file
