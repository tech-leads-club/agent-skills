# Spec-Kit Reference Templates

Structured templates for every artifact in the dev-workflow lifecycle.
Derived from spec-kit patterns. Use these as starting points — fill in every
section; delete nothing without a documented reason.

---

## Feature Specification Template

**File:** `specs/<feature-slug>/spec.md`

```markdown
# Feature Specification: <Feature Name>

## Metadata
- **Spec ID:** SPEC-<NNN>
- **Status:** Draft | In Review | Approved | Superseded
- **Author:** <name>
- **Reviewers:** <names>
- **Created:** YYYY-MM-DD
- **Last updated:** YYYY-MM-DD

---

## Problem Statement

One paragraph. What user pain or business gap does this solve?
Avoid mentioning implementation details here.

---

## User Scenarios

Priority levels:
- **P1** — must ship in MVP; directly tied to core value proposition
- **P2** — high value, ship in v1.1 or second sprint
- **P3** — nice to have; defer unless scope allows

Each scenario uses strict Given/When/Then acceptance criteria.

### US1 [P1] — <Scenario Title>

**As a** <user role>
**I want to** <goal>
**So that** <outcome / benefit>

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | <precondition> | <action> | <observable result> |
| AC2 | <precondition> | <action> | <observable result> |

**[NEEDS CLARIFICATION]** — Use this marker (max 3 per spec) only for decisions
that impact scope, security, or UX and cannot be resolved without stakeholder
input. Format: `[NEEDS CLARIFICATION: <question> — owner: <name> — due: YYYY-MM-DD]`

---

### US2 [P2] — <Scenario Title>

*(repeat structure above)*

---

### US3 [P3] — <Scenario Title>

*(repeat structure above)*

---

## Functional Requirements

Format: `FR-<NNN>: <imperative verb> <subject> <constraint>`

| ID | Requirement | Priority | Linked Scenario |
|----|-------------|----------|-----------------|
| FR-001 | The system SHALL <action> when <condition> | P1 | US1 |
| FR-002 | The system SHALL NOT <action> unless <precondition> | P1 | US1, US2 |
| FR-003 | The system SHOULD <action> within <measurable constraint> | P2 | US2 |
| FR-004 | The system MAY <action> if <condition> | P3 | US3 |

**Requirement verbs:**
- **SHALL** — mandatory, part of contract
- **SHALL NOT** — explicit prohibition
- **SHOULD** — strongly recommended; deviation needs justification
- **MAY** — optional capability

---

## Key Entities

List the domain objects this feature introduces or significantly modifies.

| Entity | Description | Key Attributes | Relationships |
|--------|-------------|----------------|---------------|
| `<EntityName>` | What it represents | field1, field2, field3 | belongs to `<Other>` |

---

## Success Criteria

Technology-agnostic, measurable outcomes. These feed directly into Phase 5 gates.

| Criterion | Measurement method | Target | Baseline |
|-----------|-------------------|--------|----------|
| <Outcome> | <How you will measure it> | <Target value> | <Current value or N/A> |

Example rows:
- Task completion rate / User testing observation / >= 90% / N/A
- Error rate on <flow> / Production logs / < 0.5% / N/A
- Time-to-complete <action> / Instrumentation / < 3 s at p95 / N/A

---

## Out of Scope

Explicitly list things this spec does NOT cover. Prevents scope creep.

- <item>
- <item>

---

## Open Questions

| # | Question | Owner | Due | Status |
|---|----------|-------|-----|--------|
| Q1 | <question> | <name> | YYYY-MM-DD | Open |
```

---

## Implementation Plan Template

**File:** `specs/<feature-slug>/plan.md`

```markdown
# Implementation Plan: <Feature Name>

- **Spec:** SPEC-<NNN>
- **Status:** Draft | Approved | In Progress | Done
- **Author:** <name>
- **Created:** YYYY-MM-DD

---

## Phase 0 — Research

For each technical unknown, create a `research/<topic>.md` file answering:
1. What is the unknown?
2. What options exist?
3. What did we spike / prototype?
4. Decision and rationale.

**Unknowns to research before planning:**

| Unknown | Research file | Owner | Status |
|---------|--------------|-------|--------|
| <question about infra, library, API, etc.> | `research/<slug>.md` | <name> | Pending |

**Gate:** All research files complete before Phase 1 begins.

---

## Pre-Implementation Gates

Run these checks before writing a single line of implementation code.

### Simplicity Check
- [ ] Is there a simpler solution that still satisfies all P1 ACs?
- [ ] Have we removed every abstraction that is not justified by a concrete requirement?
- [ ] Does the plan avoid premature generalisation?

### Anti-Abstraction Check
- [ ] No interfaces/base classes introduced unless 2+ concrete implementations exist today.
- [ ] No "extension point" added for hypothetical future requirements.
- [ ] Utility functions only extracted if used in 3+ call sites.

### Integration-First Check
- [ ] Can we write an integration/E2E test for the happy path before building internals?
- [ ] Are API contracts (request/response shapes) defined and agreed before coding?
- [ ] Does Phase 1 include a quickstart doc so we know it's buildable end-to-end?

---

## Phase 1 — Foundation

Deliverables that must land together (one PR or one tightly-scoped commit sequence):

1. **Data model** — schema migrations, entity definitions, seed data if needed.
2. **API contracts** — OpenAPI/GraphQL schema or typed interfaces committed to the repo.
3. **Quickstart doc** — `docs/quickstart-<feature>.md` proving the happy path works end-to-end
   (even if UI is a curl call or a test).

**Exit condition:** A developer unfamiliar with the feature can follow the quickstart doc
and see the happy path succeed.

---

## Phase 2 — Core Implementation

List implementation tasks grouped by layer. Reference user stories from the spec.

### Backend
- [ ] <task> — links to FR-001, US1

### Frontend / UI
- [ ] <task> — links to FR-003, US2

### Infrastructure / Config
- [ ] <task>

---

## Phase 3 — Tests & Hardening

- [ ] Unit tests for all non-trivial functions (target: >= 80% coverage on new code)
- [ ] Integration tests covering all P1 ACs
- [ ] E2E (Playwright) covering happy path + top error path
- [ ] Load / performance test if any Success Criterion is time-bounded
- [ ] Security review checklist complete

---

## Phase 4 — Rollout

- [ ] Feature flag configured (if applicable)
- [ ] Rollback plan documented
- [ ] Monitoring / alerting in place for Success Criteria metrics
- [ ] Documentation updated (README, changelog, API docs)

---

## MVP Scope Suggestion

Identify the minimal set of tasks that deliver the P1 user scenarios end-to-end.
Everything else is post-MVP.

**MVP includes:** <list tasks/phases>
**Post-MVP:** <list deferred items and their priority>

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| <risk> | High/Med/Low | High/Med/Low | <mitigation> |
```

---

## Task Breakdown Template

**File:** `specs/<feature-slug>/tasks.md`

```markdown
# Task Breakdown: <Feature Name>

- **Spec:** SPEC-<NNN>
- **Plan:** `plan.md`
- **Created:** YYYY-MM-DD

---

## Format

```
- [ ] T<NNN> [P] [US<N>] <Description>
```

- `T<NNN>` — zero-padded task ID, unique within this spec (T001, T002, …)
- `[P]` — parallel marker: task can run concurrently with other [P] tasks in the same group
- `[US<N>]` — user story this task contributes to; use `[INFRA]` for cross-cutting work
- Description — imperative verb, no ambiguity, scoped to a single concern

**Sequential tasks** (no [P] marker) must complete before the next group starts.

---

## Phase 0 — Research

- [ ] T001 [INFRA] Research <unknown-1> and write `research/<slug>.md`
- [ ] T002 [INFRA] Research <unknown-2> and write `research/<slug>.md`

*(Sequential — all T00x must be done before Phase 1 starts)*

---

## Phase 1 — Foundation

- [ ] T010 [INFRA] Define data model and write migration
- [ ] T011 [P] [INFRA] Define API contracts (typed interfaces / OpenAPI)
- [ ] T012 [P] [INFRA] Write quickstart doc (`docs/quickstart-<feature>.md`)

*(T010 sequential; T011 and T012 can run in parallel after T010)*

---

## Phase 2 — Core

- [ ] T020 [US1] Implement <backend service or function>
- [ ] T021 [P] [US1] Implement <another backend component>
- [ ] T022 [P] [US2] Implement <frontend component>
- [ ] T023 [US1] Wire T020 output to T022 input

---

## Phase 3 — Tests

- [ ] T030 [P] [US1] Write unit tests for T020
- [ ] T031 [P] [US1] Write integration test for AC1, AC2
- [ ] T032 [P] [US2] Write Playwright E2E for happy path (US2)
- [ ] T033 [US1] Run full test suite; fix regressions

---

## MVP Cut Line

Tasks **above** this line are MVP. Tasks below are post-MVP.

- - - POST-MVP - - -

- [ ] T040 [P3] [US3] <post-MVP task>
```

---

## Requirements Checklist Template

**File:** `specs/<feature-slug>/checklist.md`

Use this checklist to validate a spec before approving it for implementation.
Each item is format `CHK<NNN>`. A spec must pass all CHK items marked REQUIRED
and explain any skip with a documented exception.

```markdown
# Requirements Quality Checklist: <Feature Name>

- **Spec:** SPEC-<NNN>
- **Reviewer:** <name>
- **Date:** YYYY-MM-DD
- **Result:** Pass | Fail | Pass-with-exceptions

---

## Category 1 — Completeness

| ID | Check | Required | Result | Notes |
|----|-------|----------|--------|-------|
| CHK001 | Every P1 user scenario has at least 2 acceptance criteria | REQUIRED | [ ] Pass / [ ] Fail | |
| CHK002 | All functional requirements are linked to at least one user scenario | REQUIRED | [ ] Pass / [ ] Fail | |
| CHK003 | "Out of Scope" section is present and non-empty | REQUIRED | [ ] Pass / [ ] Fail | |
| CHK004 | All Key Entities have at least 3 attributes listed | Recommended | [ ] Pass / [ ] Fail | |
| CHK005 | Success Criteria have both a target value and a measurement method | REQUIRED | [ ] Pass / [ ] Fail | |

---

## Category 2 — Clarity

| ID | Check | Required | Result | Notes |
|----|-------|----------|--------|-------|
| CHK010 | No acceptance criterion uses vague terms (fast, easy, good, nice) without measurement | REQUIRED | [ ] Pass / [ ] Fail | |
| CHK011 | No requirement uses passive voice that hides the system subject ("it should be possible to…") | REQUIRED | [ ] Pass / [ ] Fail | |
| CHK012 | Every [NEEDS CLARIFICATION] marker has an owner and a due date | REQUIRED | [ ] Pass / [ ] Fail | |
| CHK013 | Spec uses SHALL / SHALL NOT / SHOULD / MAY correctly (RFC 2119 style) | Recommended | [ ] Pass / [ ] Fail | |
| CHK014 | No requirement describes implementation (HOW) instead of behaviour (WHAT) | REQUIRED | [ ] Pass / [ ] Fail | |

---

## Category 3 — Consistency

| ID | Check | Required | Result | Notes |
|----|-------|----------|--------|-------|
| CHK020 | Entity names in spec match entity names in data model / codebase glossary | REQUIRED | [ ] Pass / [ ] Fail | |
| CHK021 | No two functional requirements contradict each other | REQUIRED | [ ] Pass / [ ] Fail | |
| CHK022 | Priority levels (P1/P2/P3) are used consistently across scenarios and requirements | Required | [ ] Pass / [ ] Fail | |
| CHK023 | All user roles mentioned in scenarios are defined (implicitly or explicitly) | Recommended | [ ] Pass / [ ] Fail | |

---

## Category 4 — Acceptance Criteria Quality

| ID | Check | Required | Result | Notes |
|----|-------|----------|--------|-------|
| CHK030 | Every AC uses Given/When/Then (or equivalent structured format) | REQUIRED | [ ] Pass / [ ] Fail | |
| CHK031 | Every "Then" clause is observable / verifiable (can be confirmed by a test or user action) | REQUIRED | [ ] Pass / [ ] Fail | |
| CHK032 | No AC describes UI chrome or visual style unless the feature IS the UI | Recommended | [ ] Pass / [ ] Fail | |
| CHK033 | ACs are technology-agnostic (no mentions of React, Postgres, REST unless required by spec scope) | Recommended | [ ] Pass / [ ] Fail | |

---

## Category 5 — Scenario Coverage

| ID | Check | Required | Result | Notes |
|----|-------|----------|--------|-------|
| CHK040 | Every user role that interacts with the feature has at least one scenario | REQUIRED | [ ] Pass / [ ] Fail | |
| CHK041 | At least one scenario covers the primary happy path end-to-end | REQUIRED | [ ] Pass / [ ] Fail | |
| CHK042 | At least one scenario per P1 FR covers the unhappy / error path | REQUIRED | [ ] Pass / [ ] Fail | |
| CHK043 | P2 and P3 scenarios are present (even if deferred) | Recommended | [ ] Pass / [ ] Fail | |

---

## Category 6 — Edge Cases

| ID | Check | Required | Result | Notes |
|----|-------|----------|--------|-------|
| CHK050 | Empty / null input behaviour is specified for all user-provided data | REQUIRED | [ ] Pass / [ ] Fail | |
| CHK051 | Boundary values (min/max) are called out where numeric constraints exist | REQUIRED | [ ] Pass / [ ] Fail | |
| CHK052 | Concurrent access or race conditions are addressed if the feature mutates shared state | REQUIRED | [ ] Pass / [ ] Fail | |
| CHK053 | Auth / permission edge cases are specified (unauthenticated, insufficient role) | REQUIRED | [ ] Pass / [ ] Fail | |

---

## Category 7 — Non-Functional Requirements (NFRs)

| ID | Check | Required | Result | Notes |
|----|-------|----------|--------|-------|
| CHK060 | Performance requirements are captured in Success Criteria (p95 latency, throughput, etc.) | Recommended | [ ] Pass / [ ] Fail | |
| CHK061 | Security requirements or threat model reference is present | REQUIRED for auth-touching features | [ ] Pass / [ ] Fail | |
| CHK062 | Accessibility requirements are called out for any UI changes | Recommended | [ ] Pass / [ ] Fail | |
| CHK063 | Data retention / privacy requirements are addressed if PII is involved | REQUIRED if PII | [ ] Pass / [ ] Fail | |

---

## Category 8 — Dependencies

| ID | Check | Required | Result | Notes |
|----|-------|----------|--------|-------|
| CHK070 | External service dependencies are listed with failure-mode behaviour | REQUIRED | [ ] Pass / [ ] Fail | |
| CHK071 | Internal feature dependencies (other specs / issues) are referenced | REQUIRED | [ ] Pass / [ ] Fail | |
| CHK072 | Breaking changes to existing APIs or contracts are flagged | REQUIRED | [ ] Pass / [ ] Fail | |
| CHK073 | Migration / backward-compatibility strategy is documented for schema changes | REQUIRED if schema changes | [ ] Pass / [ ] Fail | |

---

## Summary

**REQUIRED checks failed:** <list CHK IDs or "None">
**Recommended checks failed:** <list CHK IDs or "None">
**Exceptions documented:** <describe any approved exceptions>
**Decision:** Approve for implementation / Return for revision
```

---

## Constitution Concept (Optional — Phase 0)

A project **Constitution** is a single document capturing the architectural DNA of the
project. It is written once (or updated very deliberately) and consulted at the start
of every phase. It acts as a filter: any plan, task, or PR that violates a constitutional
article must be revised before proceeding.

**File location:** `specs/CONSTITUTION.md`

### When to write one

Write a Constitution when:
- The project is greenfield and you want to lock in foundational decisions.
- The codebase has recurring architectural drift and you need a shared reference.
- Multiple agents or developers work on the same codebase and need alignment.

### Article Format

Each article has: a name, a one-line principle, rationale, and a concrete test
(how to tell if a PR violates this article).

```markdown
# Project Constitution

> Version: 1.0 — ratified YYYY-MM-DD
> This document is immutable except by explicit team consensus.
> All phases of the dev-workflow must pass a constitution check before merging.

---

## Article 1 — Library-First

**Principle:** Prefer established libraries over custom implementations.

**Rationale:** Reduces maintenance burden, benefits from community security patches,
and avoids reinventing well-understood solutions.

**Violation test:** A PR introduces custom code to solve a problem for which a
well-maintained library exists with > 1 k weekly downloads and an active maintainer.

---

## Article 2 — CLI Interface Mandate

**Principle:** Every user-facing capability MUST be accessible via CLI before a UI
is considered.

**Rationale:** CLI interfaces are testable, scriptable, and force clean API design.
They also serve power users and CI pipelines.

**Violation test:** A PR ships a UI feature with no corresponding CLI command or API
endpoint that exposes the same capability.

---

## Article 3 — Test-First Imperative

**Principle:** No feature code is written before a failing test exists that proves
the feature is absent.

**Rationale:** Tests written after implementation tend to test the implementation,
not the requirement. Test-first forces requirement clarity.

**Violation test:** A PR contains feature code with no corresponding new test, or
all tests were added in the same commit as the implementation with no red-phase
evidence.

---

## Article 4 — Simplicity

**Principle:** The simplest solution that satisfies all P1 acceptance criteria is
the correct solution.

**Rationale:** Complexity is the primary source of bugs, onboarding friction, and
maintenance cost. Every added abstraction must be justified by a concrete, present
requirement.

**Violation test:** A PR introduces a layer of indirection (interface, factory,
event bus, etc.) that has exactly one implementation and no documented plan to
add a second.

---

## Article 5 — Anti-Abstraction

**Principle:** Do not extract until you have concrete duplication in 3+ call sites.

**Rationale:** Premature abstraction optimises for hypothetical futures at the cost
of present clarity. Duplication is cheaper than the wrong abstraction.

**Violation test:** A PR extracts a utility or base class that is called from fewer
than 3 places and the PR description does not cite an imminent third use case.

---

## Article 6 — Integration-First Testing

**Principle:** Integration and E2E tests take precedence over unit tests for
verifying user-facing behaviour.

**Rationale:** Unit tests verify internal contracts; integration tests verify user
value. A feature with 100% unit coverage that fails its E2E scenario is not done.

**Violation test:** A PR closes an issue where the E2E / integration test for the
primary AC is absent or skipped, regardless of unit coverage percentage.

---

## Constitution Check Protocol

At Phase 3 (QA Planning) and Phase 6 (Code Review), explicitly verify each article:

| Article | Status | Notes |
|---------|--------|-------|
| 1 — Library-First | Pass / Fail / N/A | |
| 2 — CLI Interface Mandate | Pass / Fail / N/A | |
| 3 — Test-First Imperative | Pass / Fail / N/A | |
| 4 — Simplicity | Pass / Fail / N/A | |
| 5 — Anti-Abstraction | Pass / Fail / N/A | |
| 6 — Integration-First Testing | Pass / Fail / N/A | |

A single Fail blocks the phase from closing. Document the exception explicitly
if the team decides to proceed despite a violation.
```
