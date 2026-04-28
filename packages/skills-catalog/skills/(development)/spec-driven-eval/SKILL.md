---
name: spec-driven-eval
description: Scores how completely an implementation fulfills a PRD/spec, case by case, and produces a single comparable final grade. Invoke only when explicitly named (e.g. run spec-driven-eval); do not auto-trigger. Use when benchmarking spec-driven implementations, grading acceptance criteria, evaluating whether a feature was 100% implemented, comparing multiple implementations of the same PRD, or auditing implementation and test coverage (unit and e2e) against product requirements. Do NOT use for planning or building features (use tlc-spec-driven), writing PRDs, or general code review unrelated to a spec.
license: CC-BY-4.0
disable-model-invocation: true
metadata:
  author: Waldemar Neto - github.com/waldemarnt
  version: '1.0.0'
---

# Spec-Driven Implementation Evaluation

Evaluate a spec-driven-development (SDD) effort against a PRD **case by case** (acceptance criterion by acceptance criterion), scoring **implementation** and **tests** separately, and roll up to a single comparable final grade. Designed for benchmarking: the same PRD evaluated across different SDD frameworks — and the same effort evaluated twice — must yield comparable, reproducible numbers.

### Two subjects, two questions

This eval answers two independent questions, and keeps their verdicts separate because they fail independently:

1. **How good is the framework at respecting and extracting requirements?** — Did it honor the PRD and stay in bounds (*respect*: `Final` implementation side + Scope `S`), and did it surface the implicit requirements the PRD only implied, without noise (*extract*: Elicitation `E`)?
2. **How good is the harness at ensuring they are all implemented?** — Does the test suite prove every sanctioned requirement is actually built (`T` + Engineering Gates `G`)?

> **The linkage that makes "all implemented" well-defined:** the harness is held accountable for the **full sanctioned requirement set = `PRD acceptance criteria ∪ valid E-additions`**. A valid requirement the framework extracted but the harness never tests is a *harness* miss (`T`), not a framework miss (`E` keeps the extraction credit). Extraction defines the verification target.

Scoring is **checklist-based**: every criterion is decomposed into atomic binary (MET / UNMET) checks, each backed by `file:line` evidence. Binary decomposition is the design choice that makes the grade reproducible — graded/Likert scales (`is this a 3 or a 4?`) are the dominant source of evaluator-to-evaluator disagreement; binary checks raise inter-evaluator agreement to roughly human level. Partial credit is **derived** from the fraction of checks met, never judged on a sliding scale.

## When to use

- "Evaluate/score this PRD case by case and give a final grade"
- "Was this story/feature implemented 100%?"
- Benchmarking multiple spec-driven implementations of the same PRD
- Auditing implementation **and** test coverage (unit + e2e) against acceptance criteria

## Inputs required

1. **The PRD** (ground-truth product intent) — the user story acceptance criteria are the unit of evaluation.
2. **The implementation** (production code).
3. **The tests** (unit + e2e).
4. **The SDD-derived artifacts** — `spec.md` and `tasks.md` (refined ACs, requirement IDs, derived requirements). Required for the Elicitation `E` and Scope `S` axes (they grade *these* against the PRD). When absent, `Final`/`T` still run, but report `E`/`S` as `n/a — no derived spec`. The **PRD remains the source of truth** for what counts as "expected"; the derived spec is what gets graded for respect and extraction.

**Scoping the diff.** Before scoring, use git to identify which files changed for this implementation. That **diff surface** is the primary search scope for all `file:line` evidence in steps 4 and 8:

```bash
git diff <base>..<head> --name-only   # branch or PR
git diff --name-only HEAD             # uncommitted changes
git status --short                    # include untracked new files
```

Record the diff surface in the report. Evidence outside it is still valid (e.g. a pre-existing file was modified), but note when a check relies on files not in the diff — that may indicate the wrong base was chosen.

---

## Quick start

New to running this end-to-end? See [quickstart.md](references/quickstart.md) for the 4-chat-session flow (freeze baseline → plan → implement → evaluate) with paste-ready prompts. Read it when you need the operational how-to; the rest of this file is the scoring methodology.

---

## Core rules (read first)

These five rules govern every score. They exist to make the grade auditable and reproducible.

1. **Evidence or zero.** Every MET check MUST cite evidence as `file:line` (or `file:startLine-endLine`). No located evidence ⇒ the check is UNMET. Never award credit from assumptions or from the PRD restating intent.
2. **Search-before-zero (anti false-negative).** Before marking a check UNMET for "not found", record the search actually performed — starting with the diff-surface files from the scoping step, then the grep/glob terms tried and any additional files/dirs inspected. A check scored UNMET must confirm the behavior is absent from the diff surface, not just from an ad-hoc grep across the full repo. UNMET means *searched and genuinely absent*, not *did not look*. If no search is shown, the check is **not yet scored**, not UNMET.
3. **Read the path end-to-end — including the data shape.** A check is MET only if you traced the real code/test path, not because a symbol name matches. For an emitted/returned/persisted artifact, **inspect the constructed payload object itself**, not just the call site — a present `emit(...)`/`return ...` does not prove the named field is in the payload (see the Conjunction rule). A test that *exercises* a behavior but does not *assert* it does **not** meet a verification check.
4. **Judge ≠ author for benchmarks.** When grading to compare implementations, the evaluating model should differ from the model that wrote the code; LLM judges over-reward their own output (self-preference bias). If they are the same, flag it under *Assumptions* and treat borderline checks as UNMET.
5. **The evaluator is read-only over the subject.** Never modify the code under evaluation — not to fix a failing gate, not to "help", not even for trivial type errors. A red gate stays red: record `✗`, apply the `Adjusted Final`, and put the required correction in the report's fix list. Modifying the subject mid-evaluation contaminates the benchmark (the grade no longer measures the framework's output) and invalidates the diff surface. If a correction was accidentally applied, revert it and score the original state.

---

## Reproducibility rules

The grade must be stable: the **same PRD + same commit** must yield the **same `Final`** across runs and evaluators. Obey all of:

1. **Freeze the AC list AND its checklist (the single biggest drift source).** AC enumeration and check granularity are decided **once** and pinned, because both `I`, `T`, and the `Story_score` denominator depend on them:
   - If `spec.md` with stable requirement IDs exists, the AC list and IDs are frozen — use them verbatim; do not re-split or merge.
   - Derive the binary checklist for each AC once and persist it to `<spec-folder>/evaluations/_ac-baseline.md` (IDs + verbatim AC text + the I-checks and T-checks). **Every implementation of that PRD is scored against the identical checklist.**
   - One AC = one testable assertion of intent; one check = one atomic, observable yes/no proposition. Do not collapse distinct behaviors into one check, nor split one behavior across several.
2. **Priority comes from the PRD, never inferred silently.** Use the PRD's explicit P0/P1/P2 labels. If a story is unlabeled, mark its priority `ASSUMED` in the report and list it under *Assumptions*; never let an inferred priority silently move the `3/2/0` weights.
3. **Round once, at the end.** Carry full precision through the arithmetic; round only the reported `AC_score`, `Story_score`, and `Final` to **2 decimals**. Band assignment uses the rounded `Final`.
4. **Compute, don't calculate.** The roll-up (`Σw`, every `Story_score`, `Final`, `Adjusted Final`) MUST be computed by executing a script (e.g. `node -e` / `python3 -c`) that takes the per-AC `I`/`T` fractions and the priority-weight table as input, with the script's output pasted into the report. Never do the arithmetic mentally or by hand — a hand-summed denominator (`Σw`) is a known failure mode that silently shifts the grade band. `Σw` must be derived inside the script from the same priority table shown in the report, not typed in as a literal.
5. **Self-consistency ensemble (k = 3).** Evaluate the checklist **three times independently** at low/zero temperature and take the **majority MET/UNMET per check** before computing any number. Majority voting over k=3 removes most stochastic flips at low cost. If the three passes disagree on a check, that check is borderline — keep the majority verdict and note it; persistent disagreement means the check wording is ambiguous (sharpen it in the baseline, see Calibration).

---

## Scoring model

### Unit of scoring: the acceptance criterion (AC), decomposed into binary checks

For each in-scope AC, the frozen checklist holds two sets of atomic checks, each scored **MET (1) / UNMET (0)**:

**Implementation checks (`I`-checks)** — one per distinct observable behavior the AC asserts. A check is MET only if production code performs that behavior, evidenced `file:line`. Include only behaviorally-observable clauses (a verb the AC states: creates / returns / rejects / persists / grants / defaults-to). Non-functional polish (wording, logging) is **not** a check — note it separately so it never moves the score.

When parsing an AC into checks (done once, at baseline-freeze time), apply both rules below so verbs aren't the only thing captured:

**Conjunction / payload-field rule.** When an AC enumerates multiple items — joined by *"and"*, *","*, *"with [field]"*, *"including"* — *especially in the subject or payload of an emitted/returned/persisted artifact*, treat **each named field or entity as its own I-check**. Do not stop at confirming the parent method is called: for each named field, **open the actual data object constructed at `file:line` and verify the field is present in it** (score against the payload shape, not the call site). 
*Example:* "emit a trigger associated with the user **and** the trial end date" → two I-checks: (1) trigger payload carries `userId`, (2) trigger payload carries `trialEndsAt`. Confirming `emit(...)` is reached does **not** satisfy check (2) if the payload object omits the field.

**Disjunction / product-chosen rule.** When an AC presents alternatives ("A or B", "pause or cancel", "immediately or at period end"), decide the reading **once and freeze it in the baseline** (the reading itself must not vary per run):
- *Independent paths* — both are separately reachable behaviors (e.g. "cancel immediately **or** at period end"): **one I-check per path**, each independently MET/UNMET.
- *Product-controlled / configurable* — the AC frames the choice as product-driven (e.g. "apply the **product-chosen** behavior: pause or cancel"): **two I-checks** — (1) the recommended/default behavior is implemented, and (2) the alternative is *reachable without a code change* (config key / flag / env). Hard-coding one option with no switch to the other ⇒ check (2) UNMET. A different feature that happens to reach the other option (e.g. user-initiated cancel) does **not** satisfy (2) — it must be the *same* product-controlled decision point.
- If *"product-chosen"* is itself ambiguous between *runtime-configurable* and *design-time chosen*, resolve it against the PRD/spec wording and record the resolved reading in the baseline; only require reachability of the non-default path when the AC frames the choice as runtime/product-controlled.

**Wiring / ingress rule (asynchronously-delivered side-effects).** When an observable side-effect is delivered asynchronously through an inbound event (e.g. a Stripe webhook → handler → persisted status), add a dedicated **wiring I-check** *in addition to* the behavior I-check: the entry endpoint actually **receives, verifies, and dispatches the inbound event — by type — to the handler.** This is distinct from the `T-outcome` test that the handler produces the right state: a fully-tested handler sitting behind a dead, unregistered, or mis-routed endpoint still fails the wiring check. Without it, a correct-but-unreachable handler would earn full credit (the blind spot the `T-outcome` entry-point-neutrality opens up — letting the test bypass HTTP means *something else* must prove the route exists). Score the wiring I-check against the controller/route that maps the event type to the handler (signature/authenticity verification + dispatch), not against the handler internals. Freeze a wiring I-check on every AC whose observable effect arrives via an inbound async event.

```
I = (# I-checks MET) / (# I-checks)
```

**Test checks (`T`-checks)** — verification checks at the required level(s). Required levels are fixed by policy, not judged per-AC:

- pure / business logic ⇒ **unit required**
- observable HTTP / contract / persistence side-effect ⇒ **e2e / integration required**
- an AC with both ⇒ **both required**

**`T-outcome` — persistence / async side-effects (outcome-based, entry-point-neutral).** When the AC asserts a *resulting state* — phrased "results in / persisted / displayed status / reflects the change / updates the status" — the verification check is on the **real resulting state**, not on a call. Label these checks **`T-outcome`** (distinct from a plain synchronous-response `T-e2e`). The policy has four parts:

- **Assert the real outcome.** MET requires asserting the actual persisted state (a real DB row) or the actually-returned payload, against real infra. A test that only exercises the path without asserting the resulting state is UNMET (Core rule 3).
- **Entry point is the implementation's choice (entry-point-neutral).** Drive the real component via **any** entry point and assert the resulting state: the HTTP endpoint, OR by invoking the handler / queue-consumer / service method directly against the real DB. An async (ack-fast-then-process) design need **not** be tested through the full HTTP→queue→worker path — awaiting the handler and asserting the persisted row is sufficient and equivalent. Do **not** penalize a queue/async architecture for not being driven end-to-end through HTTP; the question is whether the real resulting state is asserted, not which door the test entered.
- **Mock-only exclusion (scoped precisely).** Asserting that a method was *called* on a mocked repository / state-machine (`expect(save).toHaveBeenCalled()` / `expect(transition).toHaveBeenCalledWith(...)`) proves a call, not a persisted outcome ⇒ **UNMET** for any "results in / persisted / displayed status" check (it may still count toward Robustness `R`). **The exclusion is scoped to outcome checks only — it must not over-fire:** a check whose proposition is *"invokes the external API"* (e.g. "immediate cancel calls `StripeClient.cancel`", "creates the subscription in Stripe") is *correctly* verified by a spy/mock, because the asserted proposition **is** the call. Mock-only is fine there; the exclusion does not apply.
- **Minimum-level floor.** The required level is a **floor, not an exact match.** A stronger-level test (an e2e/integration test covering a unit-required proposition) **satisfies** that proposition, provided the specific proposition (e.g. a named payload field, a default value) is actually asserted on the real artifact. Do not mark a unit-required check UNMET solely because the only assertion of it lives in an e2e/integration test.

For each required level, derive binary checks such as: *primary behavior asserted at this level* (MET only if asserted, not merely exercised), *relevant negative/error case asserted*, *each secondary clause asserted*. Mocked external systems (e.g. Stripe via nock) cannot prove the external side — write the check against the observable local contract and note the limitation.

The **conjunction rule applies to T-checks too**: each named payload field gets its own verification check. A test that asserts the artifact was emitted/returned but does **not** assert the field's presence/value is UNMET for that field's check (asserting `emit` was called ≠ asserting the payload carries `trialEndsAt`).

```
T = (# T-checks MET across all required levels) / (# T-checks)
```

> Both `I` and `T` land on a fine-grained value, but every underlying atom is a binary, evidence-backed yes/no — that is what makes them reproducible. There is no "minor vs meaningful" judgment: a clause either has its own check or it does not, and that decision was frozen in the baseline.

### Per-AC, per-story, final

```
AC_score    = 0.6 * I + 0.4 * T
Story_score = mean(AC_score over the story's ACs)      # ACs equally weighted by default
Final       = Σ(w_s * Story_score) / Σ(w_s)            # weighted by story priority
```

**Story priority weights `w_s`:**

| Priority | Weight | Rationale |
| --- | --- | --- |
| P0 | 3 | Core MVP |
| P1 | 2 | MVP-adjacent / launch |
| P2 / out-of-scope | 0 | Excluded from the grade; report separately as *roadmap readiness* |

> The 0.6/0.4 implementation/test split reflects "working software first, proven by tests". Keep these weights — and the P0/P1/P2 weights — fixed across the benchmark; changing them breaks comparability.

### Grade bands

| Final | Band |
| --- | --- |
| ≥ 0.90 | Spec-complete |
| 0.75–0.89 | Strong (minor gaps) |
| 0.60–0.74 | Partial (meaningful gaps) |
| 0.40–0.59 | Weak |
| < 0.40 | Inadequate |

### Bias controls

LLM judges have well-documented biases; hold these explicitly:

- **Verbosity / quantity bias** — more code or more tests **never** raises `I` or `T`. Only checks that map to an AC clause count. Surplus tests go to `R`/`D` (below), never into the grade.
- **Self-preference bias** — see Core rule 4 (judge ≠ author).
- **Anchoring** — score against the frozen baseline and the calibration anchors in `references/reference.md`, not against the previous implementation you happened to grade.

### Reported beside the grade (NOT folded into Final — keep comparable)

- **Robustness Index `R`** — extra tests beyond PRD cases, weighted High=1.0 / Med=0.5 / Low=0.25, summed. Signals defensive quality. Never inflates `Final`.
- **Scope Adherence `S`** — `pass` / `partial` / `fail`, governed by the **traceability principle: every built behavior must trace to a sanctioned source** (a PRD acceptance criterion → `Final`, or a *valid* `E`-addition). Three checks, each per built behavior:
  - **PRD-boundary** — built something on the PRD's explicit out-of-scope list ⇒ `fail`.
  - **Rogue build** — built something that traces to *neither* a PRD AC *nor* a valid `E`-addition (untraceable / invented) ⇒ `fail`.
  - **Plan drift** — `spec.md`/`tasks.md` sanctioned a behavior the code didn't build (or left half-built / inconsistent) ⇒ `partial`.
  Everything traces cleanly ⇒ `pass`. Report the failing/partial behaviors with `file:line`. **A valid requirement the framework derived into the spec but correctly did NOT build (because it is out of scope) is good discipline — it is *not* an `S` penalty;** record it as deferred-valid under `E`.
- **Engineering Gates `G`** — `build`, `lint`, `unit`, `e2e`. **Each gate must be an actually-executed `✓`/`✗` or an explicit `not-run` (with reason, e.g. e2e infra unavailable).** Never report a gate as passing without running it. **The `build` gate is pinned mechanically to remove evaluator discretion:** pick the project's canonical build command once per benchmark (the build script the repo documents) and define the gate as that command exiting `0` — nothing else decides it. Record the exact command in the report so every run uses the identical gate. A pre-existing, unrelated toolchain failure in code the change didn't touch (e.g. a known typecheck error in an untouched migration path) is a **documented non-graded NOTE**, not a `✗`: it does not gate `build` and does not trigger `Adjusted Final`. Record it in the report as a known note, but the `build` verdict follows only the pinned build command's exit code. **Probe-before-not-run:** a gate may only be reported `not-run` after a recorded real attempt — the command executed (or the prerequisite check, e.g. `docker ps` for e2e infra) and its error output pasted as evidence. A reason without an attempt is not valid; the gate stays *not yet scored*, exactly like an UNMET without a search (Core rule 2 applied to gates). **Only a confirmed-red gate (`✗`) triggers `Adjusted Final = Final × 0.5`**; a `not-run` gate cannot grant or deduct credit — it is reported as a known blind spot. The unadjusted `Final` stays reported for comparison. A red gate is **never** fixed by the evaluator (Core rule 5) — record `✗`, adjust, and list the fix.
- **Test Distribution `D`** — every feature test classified into one of three tiers, reported as counts **and** % of the suite. Shows where the testing effort went; never inflates `Final`. See below.

### Test distribution by tier `D` (reported beside)

Classify **every added feature test** (each `it`/test case, counting `it.each` rows individually) into exactly one tier. The classification reuses work already done in the test-check and robustness steps, so it is cheap and reproducible:

| Tier | Definition | Maps to |
| --- | --- | --- |
| **Necessary** (primary happy path) | Asserts the **primary success path** of a **P0/MVP** AC, or a dependency required for that path to work. | A T-check MET on a P0 main flow |
| **Secondary** (important) | Maps to an AC but is **not** the P0 primary path: P1 ACs, edge/negative/error paths, secondary clauses, security/authz, duplicate/idempotency/dedup, status-trigger emission. | A T-check MET that is not Necessary |
| **Nice-to-have** | Maps to **no** AC: defensive/exhaustive coverage (enum mapping, unknown-status, repo/infra internals, helper methods) or unit coverage redundant with an e2e-proven path. | The Robustness `R` extras |

**Rule of thumb:** AC-mapped tests split into Necessary + Secondary; the Robustness `R` inventory is the Nice-to-have tier. A test belongs to exactly one tier — do not double-count.

Report `D` as a table of `tier → count → %` over total feature tests, plus a one-line **shape** read. Healthy suites cover every P0 primary path with at least one Necessary test; a suite thin on Necessary but heavy on Nice-to-have is a smell (robustness without proven core), and the opposite (no defensive tests) is fragile. `D` is descriptive — it never changes `Final`.

---

## Elicitation `E` — how well the framework *extracts* requirements (reported beside; never folded into Final)

`E` grades the SDD-derived `spec.md`/`tasks.md` against the PRD: did the framework surface the implicit requirements a senior engineer would insist on, **and** did it do so cleanly (no hallucinated or contradictory additions)? This is the "value beyond transcription" of an SDD framework. It evaluates the **spec artifacts, not the code**. Like `R`/`S`/`D`, it is reported beside `Final` so the fidelity grade stays comparable.

Three binary-checklist sub-metrics:

### `E_recall` — did it find what it should have?

Run the **frozen implicit-requirement category rubric** below. For each category, mark **Addressed** (cite `spec.md:line`), **Missed**, or **N/A** (the PRD/domain makes it irrelevant). The rubric is PRD-agnostic and reusable, so recall is reproducible without per-PRD gold labeling.

```
E_recall = Addressed / (Addressed + Missed)        # N/A excluded
```

| # | Category | A requirement is expected if the feature… |
| --- | --- | --- |
| 1 | Input validation & bounds | accepts user/external input (ranges, formats, required fields) |
| 2 | Error taxonomy & messaging | can fail in ways the caller must distinguish (typed errors, codes) |
| 3 | AuthN / AuthZ | exposes an endpoint or touches user-owned data |
| 4 | Idempotency & dedup | can be retried or replayed (payments, create-once resources) |
| 5 | Concurrency & race conditions | has interleaving writes / check-then-act on shared state |
| 6 | Data lifecycle & consistency | persists state (transactions, partial-failure rollback, retention) |
| 7 | Observability | runs in production (logs, metrics, traceability of failures) |
| 8 | Limits, pagination & rate | returns lists or is callable at volume |
| 9 | External-dependency failure | calls a third party (timeouts, retries, circuit-breaking, fallback) |
| 10 | State-transition integrity | has a lifecycle/status machine (illegal-transition guards) |

> Extend the rubric per domain, but freeze it per benchmark and apply the identical list to every framework. For head-to-head benchmarks, **also** report **pooled recall**: union the valid additions across all frameworks into one adjudicated master list, then score each framework's recall against that pool.

### `E_precision` — is the signal clean, or gold-plating?

Build the **added-requirement ledger**: every requirement in `spec.md`/`tasks.md` *not traceable to a PRD line*. Adjudicate each, binary, with a one-line warrant + `spec.md:line`:

| Verdict | Meaning |
| --- | --- |
| **Valid-necessary** | a real gap the PRD implied (e.g. "reject `trialDays > 30`") |
| **Valid-defensive** | reasonable hardening (observability, retries, typed errors) |
| **Invalid** | hallucinated, contradicts the PRD, or scope-creep into the explicit out-of-scope list |

```
E_precision = (Valid-necessary + Valid-defensive) / total additions
```

The valid additions become the **`valid E-additions`** set referenced everywhere else (the harness denominator, and `S` traceability). Mark each valid addition **built** or **deferred** (deferred-valid = good discipline, see `S`).

### `E_justified` — are additions warranted?

```
E_justified = additions carrying an explicit rationale/traceability / total additions
```

Unjustified additions are a smell even when individually plausible. Report all three: `E_recall / E_precision / E_justified`. A strong framework reads high on all three — *found the implicit requirements, added little noise, justified what it added*.

---

## Calibration (do this once per PRD, before trusting a benchmark)

The checklist is a hypothesis about what each AC means; calibrate it so different evaluators agree:

1. **Anchor.** `references/reference.md` holds worked checklist anchors — at least one clearly-MET, one clearly-UNMET, and one borderline check with the verdict and reasoning. Read them before scoring; they fix where the MET/UNMET boundary sits.
2. **Agreement check.** For a high-stakes benchmark, have the checklist reviewed against a human-labeled reference (or a second judge model). If verdicts disagree on more than ~20% of checks, the **checklist wording is too vague** — sharpen the ambiguous checks in `_ac-baseline.md` and re-run. Do not "average away" disagreement; fix the operational definition.
3. **Borderline cases are the valuable ones.** When you find a check humans/judges split on, add it to the anchor pool in `references/reference.md` with the resolved verdict.

---

## Process

Copy this checklist and track progress:

```
FRAMEWORK — respect & extract requirements
- [ ] 1. Locate PRD, spec.md/tasks.md. Run git diff to identify changed files (diff surface). Use the diff surface as the primary search scope for implementation and test evidence throughout steps 4 and 8
- [ ] 2. Enumerate stories + ACs; tag priority; mark out-of-scope items
- [ ] 3. Build/load the frozen binary checklist per AC (I-checks + T-checks) → _ac-baseline.md
- [ ] 4. Score I-checks MET/UNMET with file:line evidence (record searches before any UNMET)
- [ ] 5. Elicitation E: run the category rubric (E_recall) + added-requirement ledger (E_precision, E_justified) → freeze the `valid E-additions` set
- [ ] 6. Scope S: trace every built behavior (PRD-boundary / rogue-build / plan-drift)

HARNESS — ensure they are all implemented
- [ ] 7. Define the sanctioned set = PRD ACs ∪ valid E-additions; ensure each has a T-check
- [ ] 8. Score T-checks MET/UNMET with file:line evidence (unit + e2e per fixed level policy)
- [ ] 9. Inventory extra tests → Robustness Index R
- [ ] 10. Classify every feature test into tiers → Test Distribution D (counts + %)
- [ ] 11. Run/record Engineering Gates G (✓/✗/not-run)

ROLL-UP
- [ ] 12. Repeat the scoring steps three times (k=3); take majority verdict per check
- [ ] 13. Compute I, T, AC/Story/Final; apply bands; Adjusted Final only if a gate is ✗
- [ ] 14. Emit the report (see references/reference.md template): Final + E + S + R/G/D + ranked gaps + fixes
```

**Step rules:**

- **Step 1** — Identify the diff surface before any evidence search. Pick the base that matches what you are evaluating (branch tip, last commit, or working tree):

```bash
git diff <base>..<head> --name-only   # for a branch/PR
git diff --name-only HEAD~1           # for the last commit
git diff --name-only HEAD             # for uncommitted changes
git status --short                    # for untracked new files
```

Record the file list in the report. Steps 4 and 8 use it as the first set of paths to inspect.
- **Step 2** — Out-of-scope items from the PRD's explicit out-of-scope / non-goals section (whatever heading the PRD uses) get `w=0`. Absence is **not** a defect. Do not score them.
- **Step 3** — Reuse the existing `_ac-baseline.md` if present; otherwise create it and treat it as the contract for all future runs of this PRD. Include only observable-behavior clauses as checks.
- **Step 5** — `E` grades `spec.md`/`tasks.md`, not code. The ledger's *valid* additions define the `valid E-additions` set used by Steps 6 and 7. Mark each valid addition built/deferred.
- **Step 6** — Traceability: a built behavior with no PRD AC and no valid `E`-addition is a rogue build (`fail`). A deferred-valid out-of-scope addition is **not** a penalty.
- **Step 7** — The harness denominator is the **sanctioned set (PRD ACs ∪ valid E-additions)**. A valid extracted requirement with no test is a `T` miss, not an `E` miss.
- **Step 8** — Binary only: MET (evidence) or UNMET (searched, absent). No partial per-check values.
- **Step 9** — Extra tests are a positive signal but never substitute for missing coverage. A high `R` with low `T` is still a low grade.
- **Step 10** — Each test lands in exactly one tier; counts must sum to the total feature-test count. Exclude pre-existing tests not added by the feature (note them separately).
- **Step 11** — A gate is `✓`/`✗` only if actually executed; otherwise `not-run` with the **attempt evidence** (command + error output — see Probe-before-not-run). Do not assume infra is unavailable: check it (e.g. `docker ps`, or whatever the project's own docs say the e2e suite needs running). If a gate is red, do NOT fix the subject code (Core rule 5).
- **Step 12** — Majority over k=3. Note any check where the three passes disagreed.
- **Step 13** — Show the arithmetic: list MET/total per check set so `I` and `T` are recomputable. Execute the roll-up as a script and paste its output (Reproducibility rule 4) — never hand-compute `Σw` or `Final`.

---

## Output

Produce a markdown report following the template in [reference.md](references/reference.md). It must separate the **two subjects** and contain: per-AC implementation checklist table (I-checks, MET/UNMET, evidence); the Elicitation `E` block (category-rubric recall table + added-requirement ledger with verdicts → `E_recall` / `E_precision` / `E_justified`); the Scope `S` traceability verdict; per-requirement unit/e2e test checklist table (T-checks over the **sanctioned set = PRD ACs ∪ valid E-additions**); extra-tests inventory; the test-distribution `D` table (tiers with counts + %); the computed `Final` (+ `Adjusted Final` if a gate is ✗); `R` / `G` / `D`; a ranked gap list; and concrete fixes to reach 1.00.

Save the report to `<spec-folder>/evaluations/<priority>-<story-slug>-<timestamp>.md` when a `.specs`/spec folder exists; otherwise present it inline. The `<timestamp>` is a UTC instant in `YYYYMMDDTHHMMSSZ` form (e.g. `20260606T143012Z`), obtained from the system clock at write time (`date -u +%Y%m%dT%H%M%SZ`). The timestamp makes every report filename unique so **multiple agents evaluating the same story in parallel never overwrite each other** — each run produces its own file. If a same-second collision is still possible (many parallel runs), append a short run id: `<priority>-<story-slug>-<timestamp>-<run-id>.md`.

Note: only the **report** filename is timestamped. The frozen `_ac-baseline.md` is deliberately **not** timestamped — it is a single shared artifact that every run reads from to stay comparable; never fork it per run.

## Worked example

A complete applied evaluation (an example billing service's P0 "Start Free Trial Without a Card") showing the binary checklist per AC with `file:line` evidence, plus calibration anchors, is in [reference.md](references/reference.md). Mirror its structure and rigor.

## Anti-patterns

- Scoring `I`/`T` on a sliding "feels like a 0.75" judgment instead of counting binary checks.
- Re-deriving the AC list or checklist per implementation (breaks comparability) instead of reusing the frozen baseline.
- Marking a check UNMET without showing the search performed; or MET without `file:line` evidence.
- Searching the full codebase for evidence without first running `git diff` to bound the diff surface — this produces unreliable searches and inflates "not found" confidence.
- Awarding implementation credit without reading the production code path end-to-end.
- Counting extra/defensive tests toward an AC's required coverage, or letting more code/tests raise the grade.
- Reporting an Engineering Gate as passing without running it; or applying `Adjusted Final` for a `not-run` gate.
- Marking a gate `not-run` without a recorded attempt (command + error output). "Infra not available" without a probe is fabricated evidence.
- Fixing the code under evaluation to turn a red gate green — the evaluator is read-only over the subject; a red gate is scored `✗` and the fix goes in the report.
- Hand-computing the roll-up (`Σw`, `Final`) instead of executing it as a script and pasting the output.
- Penalizing missing out-of-scope features.
- Folding `E` or `S` into `Final` — the headline grade must mean only "fidelity to the given PRD" or comparability breaks.
- Penalizing a valid requirement the framework extracted but correctly *deferred* as out-of-scope (that is good discipline, not a scope failure).
- Scoring harness completeness (`T`) against the PRD alone — the denominator is the sanctioned set (PRD ACs ∪ valid E-additions).
- Rewarding requirement *volume* in `E`: hallucinated/scope-creep additions lower `E_precision`, they don't raise the score.
- Changing the weights (`0.6/0.4`, P0/P1/P2) between implementations of the same PRD.
