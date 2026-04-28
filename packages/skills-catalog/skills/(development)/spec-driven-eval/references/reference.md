# spec-driven-eval — Report template, calibration anchors & worked example

## 1. Report template

Copy and fill. Replace bracketed text; keep the section order. `I` and `T` are **derived** from the MET/total counts, never typed in directly.

```markdown
# Evaluation — [Priority]: [Story title]

**Feature**: [feature name]
**Source of truth**: [PRD ref] (cross-ref [spec.md IDs] if present)
**AC baseline**: [_ac-baseline.md ref — frozen checklist used]
**Judge model**: [model] (author model: [model] — flag if same)
**Module / paths**: [where the code lives]

## Acceptance criteria
- AC1 — [restate the criterion]
- ACn — ...

## Implementation checklist (binary — MET/UNMET, evidence required for MET)
| AC | I-check (atomic, observable) | Verdict | Evidence (file:line) |
| --- | --- | --- | --- |
| AC1 | I1. [behavior 1] | MET | `path:line` |
| AC1 | I2. [behavior 2] | UNMET | searched: [terms/files], absent |
| ... | ... | ... | ... |

Per-AC: **I = MET / total** → AC1 = x/y = X.XX

---
# FRAMEWORK — extract & respect

## Elicitation E — category rubric (recall)
| # | Category | Verdict | Evidence (spec.md:line) / why N/A |
| --- | --- | --- | --- |
| 1 | Input validation & bounds | Addressed/Missed/N-A | `spec.md:line` |
| ... | ... | ... | ... |

**E_recall = Addressed / (Addressed + Missed) = X.XX**

## Elicitation E — added-requirement ledger (precision + justification)
| # | Requirement added beyond PRD | Verdict | Built? | Justified? | Evidence (spec.md:line) + warrant |
| --- | --- | --- | --- | --- | --- |
| A1 | [requirement] | Valid-necessary | built | yes | `spec.md:line` — [why] |
| A2 | [requirement] | Invalid (creep/hallucination) | — | no | `spec.md:line` — [why] |

**E_precision = valid / total = X.XX** · **E_justified = justified / total = X.XX**
`valid E-additions` set (used by S + harness denominator): [A1, …]

## Scope S — traceability of built behavior
| Built behavior | Traces to | Verdict | Evidence (file:line) |
| --- | --- | --- | --- |
| [behavior] | PRD AC1 / valid add A1 / none | pass / fail (rogue) / fail (PRD out-of-scope) | `path:line` |
| [planned, not built] | spec/tasks | partial (plan drift) | `spec.md:line` |

**S = pass / partial / fail** (deferred-valid out-of-scope additions are NOT penalized)

---
# HARNESS — ensure all implemented

## Test checklist (binary — over the sanctioned set = PRD ACs ∪ valid E-additions)
| Requirement | Source | Level | T-check | Verdict | Evidence (file:line) |
| --- | --- | --- | --- | --- | --- |
| AC1 | PRD | unit | [primary behavior asserted] | MET | `path:line` |
| AC1 | PRD | e2e | [observable contract asserted] | MET | `path:line` |
| A1 | valid add | unit | [extracted requirement asserted] | UNMET | searched, no test |
| ... | ... | ... | ... | ... | ... |

Per-requirement: **T = MET / total** → AC1 = x/y = X.XX  ·  harness completeness = MET / |sanctioned set|

## Extra tests (Robustness — not scored toward ACs)
| # | Extra test | Level | Evidence | Value (High/Med/Low) |
| --- | --- | --- | --- | --- |

## Test distribution by tier (D — reported, not scored)
| Tier | Count | % | Evidence (representative) |
| --- | --- | --- | --- |
| Necessary (P0 primary happy path) | n | xx% | `path:line` |
| Secondary (important) | n | xx% | `path:line` |
| Nice-to-have | n | xx% | `path:line` |
| **Total feature tests** | N | 100% | — |

**Shape**: [one line — e.g. "balanced", "top-light / robustness-heavy", "fragile / no defensive tests"]. (Pre-existing tests excluded: [list/none].)

## Result
| AC | I (MET/total) | T (MET/total) | AC_score = 0.6·I + 0.4·T |
| --- | --- | --- | --- |

| Dimension | Subject | Value |
| --- | --- | --- |
| Story_score / Final (PRD fidelity) | framework+harness | X.XX |
| Elicitation E (recall / precision / justified) | framework | X.XX / X.XX / X.XX |
| Scope Adherence S | framework | pass/partial/fail |
| Harness completeness (T over sanctioned set) | harness | X.XX |
| Engineering Gates G | harness | build/lint/unit/e2e: ✓/✗/not-run |
| Robustness Index R | harness | [sum] |
| Test Distribution D | harness | Necessary xx% / Secondary xx% / Nice-to-have xx% (N tests) |
| Adjusted Final (only if a gate is ✗) | — | Final × 0.5 |
| k=3 disagreements | — | [checks where the 3 passes split, or none] |

**Verdict**: [band + one line]. **Framework**: respects + extracts requirements [read from Final-impl / E / S]. **Harness**: ensures implementation [read from T / G].

## Gaps (ranked) and fixes to reach 1.00
1. [AC] — [UNMET check] → [fix]
```

For a **whole-PRD** roll-up, add a final section:

```markdown
## PRD final grade
| Story | Priority | Weight | Story_score |
| --- | --- | --- | --- |
| [P0 a] | P0 | 3 | X.XX |
| [P1 b] | P1 | 2 | X.XX |
| [P2 c] | P2 | 0 (excluded) | — |

**Final = Σ(w·Story)/Σ(w) = X.XX → [band]**
Roadmap readiness (P2, informational): [notes]

| Whole-PRD reported metrics | Subject | Value |
| --- | --- | --- |
| Elicitation E (recall / precision / justified) | framework | X.XX / X.XX / X.XX |
| Scope Adherence S | framework | pass/partial/fail |
| Harness completeness (T over sanctioned set) | harness | X.XX |
| Engineering Gates G | harness | build/lint/unit/e2e: ✓/✗/not-run |
| Robustness Index R | harness | [sum] |
| Test Distribution D | harness | Necessary xx% / Secondary xx% / Nice-to-have xx% (N tests) |
```

---

## 2. Calibration anchors (read before scoring — they fix the MET/UNMET boundary)

These are reference verdicts. Match your verdicts to the reasoning style, not just the outcome. Add new borderline cases here whenever two evaluators split on a check.

| Anchor | Check | Verdict | Why |
| --- | --- | --- | --- |
| **Clearly MET** | "Creates a trialing subscription without a payment method" | **MET** | `stripe.client.ts:59-80` builds the subscription params with no `payment_method` field and `trial_period_days` set; traced end-to-end from `subscription.service.ts:63-106`. Behavior is present and observable. |
| **Clearly UNMET** | "409 conflict response includes the existing subscription" | **UNMET** | `subscription.service.ts:79-85` throws `ConflictDomainException` and `subscription.controller.ts:50-52` maps it to 409, but no existing-subscription payload is attached. Searched the exception body + controller mapping; the data is genuinely absent → UNMET (not partial). |
| **Borderline → resolved UNMET** | "Default of 14 trial days is asserted in e2e" | **UNMET** | `subscription-trial.e2e-spec.ts:157-163` *exercises* the default path (omits `trialDays`) but never asserts the value 14 reached Stripe. Exercised-not-asserted does **not** meet a verification check (Core rule 3). Had it asserted the propagated value, it would be MET. |
| **Borderline → resolved MET** | "Trialing status grants immediate access" | **MET** | `subscription-state-machine.service.ts:28-32,60-62` includes `Trialing ∈ ACCESS_GRANTED_STATUSES`, traced from the success path. The behavior is implemented even though a dedicated access-endpoint e2e is thin — the *implementation* check is MET; the *test* check for it is scored separately. |
| **Borderline → resolved UNMET** (Conjunction rule) | "Trigger payload contains trial end date" | **UNMET** | The AC said "emit a trigger associated with the user **and** the trial end date". The trigger *is* emitted with `userId`, but `stripe-webhook.service.ts:53-55` constructs `payload: { stripeSubscriptionId }` only — `trialEndsAt` is available on `localSubscription` (fetched line 46) but never written into the payload object. Per the Conjunction rule each named field after "and" is its own check; the field's absence **at the construction site** is UNMET regardless of whether the parent `emit(...)` is present. (This is the trap Core rule 3's data-shape clause exists to catch.) |
| **Borderline → resolved UNMET** (Disjunction rule, configurable) | "Cancel behavior is product-configurable" | **UNMET** | The AC said "SHALL apply the **product-chosen** behavior: pause (recommended) or cancel". `stripe.client.ts:48-50` hard-codes `missing_payment_method: 'pause'`; there is no config key, flag, or env var that switches it to `'cancel'`. "Product-chosen" reads as runtime-configurable, so check (2) "alternative reachable without a code change" is UNMET. The `cancel` path via `customer.subscription.deleted` + `TERMINAL_STATUSES` is a *different* behavior (user-initiated cancel), not this product-controlled decision point, so it does not satisfy (2). |
| **`T-outcome` MET** (outcome-based, entry-point-neutral) | "Inbound status-change event results in the persisted status changing" | **MET** | An integration test invokes the handler against the real DB and asserts the outcome — e.g. `await processWebhookEvent(customerSubscriptionUpdated)` then `expect((await subscriptionRepo.findBy({ stripeSubscriptionId })).status).toBe('paused')`. The real persisted row is asserted. Entry is via the handler directly (not HTTP) — that is fine: `T-outcome` is entry-point-neutral, so an ack-fast async design is not required to be driven through HTTP→queue→worker. |
| **`T-outcome` UNMET (mock-only)** | "Inbound cancellation event updates the displayed status to `cancelado`" | **UNMET** | The test asserts `expect(subscriptionRepo.save).toHaveBeenCalledWith(objectContaining({ status: 'canceled' }))` / `expect(stateMachine.transition).toHaveBeenCalled()` on a mocked repo/state-machine. That proves a *call*, not a *persisted outcome* — mock-only does not satisfy a "results in / displayed status" check (it counts toward `R` only). **Scoping note:** this exclusion does NOT fire on an "invokes the external API" check (e.g. "immediate cancel calls `StripeClient.cancel`"), which a spy/mock verifies correctly because the asserted proposition *is* the call. |
| **`T-outcome` UNMET (ingress-only)** | "Inbound event results in the persisted status changing" | **UNMET** | The test asserts the inbound event row was persisted and a processing job was enqueued (`expect(eventRepo.findBy(...)).toBeDefined()` + `expect(queue.add).toHaveBeenCalled()`) but never asserts the *resulting subscription status*. Ingress capture + enqueue is not the outcome — the resulting state is never asserted, so the `T-outcome` check is UNMET (the enqueue assertion may count toward `R`). |
| **Wiring I-check MET** (async ingress) | "Webhook endpoint receives, verifies, and dispatches the event by type to the handler" | **MET** | `stripe-webhook.controller.ts:22-40` constructs/verifies the event signature (`stripe.webhooks.constructEvent(...)`) and routes by `event.type` (`customer.subscription.updated` → `handleSubscriptionUpdated`). This is the dedicated wiring check — distinct from the `T-outcome` test that the handler produces the right state. A correct handler behind an unregistered/dead route would fail *this* check even with `T-outcome` green; here the route is present and dispatches, so MET. |

**Boundary rule the anchors encode:** MET requires implemented-and-evidenced (impl checks) or asserted-not-merely-exercised (test checks). For multi-field artifacts, each named field is checked against the **constructed payload object**, not the call site; for product-chosen alternatives, the non-default path must be reachable without a code change. For **persistence/async (`T-outcome`) checks**, MET requires asserting the **real resulting state** (persisted DB row / returned payload) via **any** entry point (HTTP or handler/consumer/service invoked directly against real infra) — a mock-only call assertion and an ingress-only (persist-event + enqueue) assertion are both UNMET, while an "invokes the external API" check is still correctly met by a spy/mock; the required level is a **floor**, so a stronger test satisfies a weaker-level proposition. An asynchronously-delivered effect additionally needs a **wiring I-check** (endpoint receives + verifies + dispatches by type) so a correct handler behind a dead route does not earn full credit. Anything else is UNMET. There is no middle verdict per check — partial credit emerges only from the MET/total fraction.

---

## 3. Worked example — billing service P0: Start Free Trial Without a Card

Real evaluation rebuilt on the binary checklist. Use it as the bar for rigor and evidence. The example happens to be a NestJS + Stripe billing service (TypeORM, Jest) with concrete `file:line` evidence — the methodology itself is stack-agnostic; treat the file paths, frameworks, and commands below as illustrative of the level of rigor, not as required tooling.

### Acceptance criteria (from PRD, aligned with `spec.md` STRIPE-01..05)
- AC1 — Auth user starts trial with `planId` (+ optional `trialDays`); create Stripe customer if none + **trialing** sub **without payment method**; persist; return `Trialing` + end date.
- AC2 — No `trialDays` ⇒ default 14.
- AC3 — Existing `Trialing`/`Active` for same plan ⇒ reject duplicate **and inform the existing subscription** (409).
- AC4 — Success ⇒ immediate access (state machine grants `Trialing`).
- AC5 — Transient failure (Stripe/identity) ⇒ clear error, no inconsistent state, idempotent retry (no dup).

### Implementation checklist
| AC | I-check | Verdict | Evidence |
| --- | --- | --- | --- |
| AC1 | I1. Resolve `planId`→`stripePriceId` | MET | `subscription.service.ts:63-106` |
| AC1 | I2. Create Stripe customer if none | MET | `customer-stripe.service.ts:16-38` |
| AC1 | I3. Create trialing sub **without** payment method | MET | `stripe.client.ts:59-80` |
| AC1 | I4. Persist subscription | MET | `subscription.entity.ts:61-62`; service `:97-104` |
| AC1 | I5. Return `Trialing` + end date | MET | `subscription.controller.ts:35-58` |
| AC2 | I1. Default 14 when `trialDays` omitted | MET | `subscription.service.ts:27,71` (`DEFAULT_TRIAL_DAYS=14`) |
| AC3 | I1. Reject duplicate active/trialing for plan (409) | MET | `subscription.service.ts:79-85`; `subscription.controller.ts:50-52` |
| AC3 | I2. Conflict response **informs** the existing subscription | UNMET | searched exception body + controller map; no existing-sub payload |
| AC4 | I1. `Trialing` ∈ access-granted statuses | MET | `subscription-state-machine.service.ts:28-32,60-62` |
| AC5 | I1. Atomic/transactional write (no partial state) | MET | `@Transactional` `subscription.service.ts:63` |
| AC5 | I2. Idempotent customer + sub creation (no dup) | MET | `stripe.client.ts:40-57`, idempotencyKey `:88-95`; unique `stripeSubscriptionId` `subscription.entity.ts:61-62` |
| AC5 | I3. Clear domain error on transient failure | UNMET | bare 500 surfaced; no mapped stable error code/message |

**I per AC:** AC1 5/5=1.00 · AC2 1/1=1.00 · AC3 1/2=0.50 · AC4 1/1=1.00 · AC5 2/3=0.67

### Elicitation E (framework — extract)

**Category rubric (recall):**
| # | Category | Verdict | Evidence / why |
| --- | --- | --- | --- |
| 1 | Input validation & bounds | Addressed | `trialDays` 1–30 bound in `spec.md` (→ impl `subscription.service.ts`, e2e E1) |
| 2 | Error taxonomy & messaging | Missed | transient failure surfaces a bare 500; no typed error spec'd (AC5 I3 UNMET) |
| 3 | AuthN / AuthZ | Addressed | authenticated-user requirement carried into spec/controller |
| 4 | Idempotency & dedup | Addressed | idempotency key + unique `stripeSubscriptionId` spec'd |
| 5 | Concurrency & races | Missed | no guard spec'd for two concurrent trial-starts on same plan |
| 6 | Data lifecycle & consistency | Addressed | transactional write spec'd |
| 7 | Observability | Missed | no logging/metrics/trace requirement on the trial-start path |
| 8 | Limits, pagination & rate | N/A | single-resource create; no list endpoint |
| 9 | External-dependency failure | Addressed | Stripe SDK retries/timeout config spec'd (E6) |
| 10 | State-transition integrity | Addressed | status machine guards illegal transitions |

**E_recall = Addressed 6 / (6 + 3 Missed) = 0.67**

**Added-requirement ledger (precision + justification):**
| # | Requirement beyond PRD | Verdict | Built? | Justified? | Evidence + warrant |
| --- | --- | --- | --- | --- | --- |
| A1 | `trialDays` must be 1–30 | Valid-necessary | built | yes | `spec.md` — PRD implies a sane trial window |
| A2 | Plan without `stripePriceId` ⇒ 404 | Valid-necessary | built | yes | `spec.md` — required precondition for trial |
| A3 | Stripe SDK retry/timeout config | Valid-defensive | built | yes | hardening of external dep |
| A4 | Customer-snapshot caching | Valid-defensive | built | partial | perf; rationale thin in spec |

**E_precision = 4 valid / 4 = 1.00** · **E_justified = 3 / 4 = 0.75**
`valid E-additions` = [A1, A2, A3, A4] (all built; none deferred)

### Scope S (framework — respect)
Every built behavior traces to a PRD AC or a valid `E`-addition (A1–A4); nothing maps to the PRD out-of-scope list (no monetization/cancellation built); spec/tasks items all have corresponding code (no plan drift).
**S = pass.**

### Test checklist (over the sanctioned set = AC1–AC5 ∪ A1–A4)
| AC | Level | T-check | Verdict | Evidence |
| --- | --- | --- | --- | --- |
| AC1 | unit | Trial create asserted | MET | `subscription.service.spec.ts:114-130`; `customer-stripe.service.spec.ts:51-77` |
| AC1 | unit | No-payment-method asserted | MET | `stripe.client.spec.ts:149-193` |
| AC1 | e2e | Trial create returns Trialing+end | MET | `subscription-trial.e2e-spec.ts:129-164` |
| AC2 | unit | Default 14 asserted | MET | `subscription.service.spec.ts:114-130`; `stripe.client.spec.ts:178-190` |
| AC2 | e2e | Default 14 propagated to Stripe asserted | UNMET | `:157-163` exercised, value not asserted |
| AC3 | unit | Duplicate rejected asserted | MET | `subscription.service.spec.ts:151-160` |
| AC3 | unit | Existing-sub returned in conflict asserted | UNMET | not asserted (impl absent) |
| AC3 | e2e | 409 on duplicate asserted | MET | `subscription-trial.e2e-spec.ts:166-187` |
| AC4 | unit | Status `Trialing` asserted | MET | `subscription.service.spec.ts:126` |
| AC4 | e2e | Access actually granted asserted | UNMET | no `GET .../active` assertion |
| AC5 | unit | Transient-failure handling asserted | MET | `subscription.service.spec.ts:162-167`; `customer-stripe.service.spec.ts:79-87` |
| AC5 | e2e | Idempotent retry (twice ⇒ no dup) asserted | UNMET | no retry e2e |
| A1 (valid add) | e2e | `trialDays` 1–30 bound asserted | MET | `subscription-trial.e2e-spec.ts:189-200` |
| A2 (valid add) | unit | Plan without `stripePriceId` ⇒ 404 asserted | MET | `subscription.service.spec.ts:142-149` |
| A3 (valid add) | unit | Stripe SDK retry/timeout config asserted | MET | `stripe.client.spec.ts:262-270` |
| A4 (valid add) | unit | Customer cache-hit path asserted | MET | `customer-stripe.service.spec.ts:38-49` |

**T per AC (PRD):** AC1 3/3=1.00 · AC2 1/2=0.50 · AC3 2/3=0.67 · AC4 1/2=0.50 · AC5 1/2=0.50
**Harness completeness over sanctioned set:** PRD ACs all have ≥1 MET T-check; valid additions A1–A4 all tested ⇒ no extracted requirement is unverified.

> **Reconciliation note.** Because A1–A4 are *valid sanctioned* requirements, their tests (E1, E2, E6, E3 below) are coverage of the sanctioned set — under the two-subject model they reclassify from *Nice-to-have* (Robustness `R`) toward *Secondary*. The `R`/`D` figures below are shown in the legacy PRD-only framing for continuity; in a fresh run scored under the sanctioned set, `R` would shrink and Secondary would rise accordingly. Only genuinely AC-unmappable tests (e.g. E5 snapshot-mapper internals) remain in `R`.

### Extra tests (Robustness)
| # | Extra test | Level | Evidence | Value |
| --- | --- | --- | --- | --- |
| E1 | `trialDays` outside 1–30 ⇒ 400 | e2e | `subscription-trial.e2e-spec.ts:189-200` | High |
| E2 | Plan without `stripePriceId` ⇒ 404 | unit | `subscription.service.spec.ts:142-149` | High |
| E3 | Customer cache hit ⇒ no identity/Stripe call | unit | `customer-stripe.service.spec.ts:38-49` | Med |
| E4 | `ensureCustomer` existing-vs-create | unit | `stripe.client.spec.ts:110-147` | Med |
| E5 | Snapshot mapper: expanded customer / null period | unit | `stripe.client.spec.ts:25-77` | Med |
| E6 | Stripe SDK config (retries/timeout) | unit | `stripe.client.spec.ts:262-270` | Low |

R = 1.0+1.0+0.5+0.5+0.5+0.25 = **3.75**

### Test distribution by tier (D)
| Tier | Count | % | Representative evidence |
| --- | --- | --- | --- |
| Necessary (P0 primary happy path) | 4 | 27% | trial create unit+e2e `subscription.service.spec.ts:114-130`, `subscription-trial.e2e-spec.ts:129-164`; no-payment-method `stripe.client.spec.ts:149-193`; immediate access status `subscription.service.spec.ts:126` |
| Secondary (important) | 5 | 33% | default-14 `:114-130`,`:157-163`; duplicate guard `:151-160`,`:166-187`; idempotency/retry `:162-167` |
| Nice-to-have | 6 | 40% | E1–E6 (robustness inventory above) |
| **Total feature tests** | 15 | 100% | — |

**Shape**: top-light / robustness-heavy — only 27% proves the P0 primary path while 40% is defensive; every P0 path does have ≥1 Necessary test, so acceptable but the happy-path layer is thin. (Pre-existing tests excluded: none.)

### Result
| AC | I | T | AC_score = 0.6·I + 0.4·T |
| --- | --- | --- | --- |
| AC1 | 1.00 | 1.00 | 1.00 |
| AC2 | 1.00 | 0.50 | 0.80 |
| AC3 | 0.50 | 0.67 | 0.57 |
| AC4 | 1.00 | 0.50 | 0.80 |
| AC5 | 0.67 | 0.50 | 0.60 |

| Dimension | Subject | Value |
| --- | --- | --- |
| Story_score / Final (PRD fidelity) | framework+harness | (1.00+0.80+0.57+0.80+0.60)/5 = **0.75** |
| Elicitation E (recall / precision / justified) | framework | 0.67 / 1.00 / 0.75 |
| Scope Adherence S | framework | pass (all built behavior traceable; no out-of-scope build; no plan drift) |
| Harness completeness (T over sanctioned set) | harness | all PRD ACs + A1–A4 verified (gaps are assertion-strength, not coverage holes) |
| Engineering Gates G | harness | run before reporting: the project's pinned build, lint, unit, and e2e commands (run any required DB migration before e2e) → record ✓/✗ each (do not assume) |
| Robustness Index R | harness | 3.75 (legacy framing — see reconciliation note) |
| Test Distribution D | harness | Necessary 27% / Secondary 33% / Nice-to-have 40% (15 tests) — top-light, robustness-heavy |
| k=3 disagreements | — | none (all checks stable across passes) |

**Verdict**: Strong (0.75).
- **Framework — respect + extract:** honors the PRD and stays in bounds (`S pass`); extracts cleanly (`E_precision 1.00`) but with moderate coverage of implicit requirements (`E_recall 0.67` — missed error-taxonomy, concurrency, observability).
- **Harness — ensure implemented:** every sanctioned requirement is tested, but several assertions are weak (exercised-not-asserted), so `T` trails `I`.

### Gaps (ranked) and fixes
**Framework (respect/extract):**
1. `E_recall` — error-taxonomy missed → spec a typed transient-failure error (also fixes AC5 I3).
2. `E_recall` — concurrency missed → spec a guard for two concurrent trial-starts on the same plan.
3. `E_recall` — observability missed → spec logging/metrics on the trial-start path.
4. AC3 I2 (UNMET) — 409 doesn't inform existing sub → return the existing subscription in the conflict payload.

**Harness (ensure implemented):**
5. AC5 I3 / e2e (UNMET) — bare 500 + no idempotent-retry e2e → map to a clear domain error and add a retry e2e (twice ⇒ no dup).
6. AC4 e2e (UNMET) — no access assertion → e2e hitting `GET /subscription/user/:id/active` proving `Trialing` grants access.
7. AC2 e2e (UNMET) — assert default 14 propagated to Stripe when `trialDays` omitted.
