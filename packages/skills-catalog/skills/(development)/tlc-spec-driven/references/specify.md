# Specify

**Goal**: Capture WHAT to build with testable, traceable requirements.

If the feature has ambiguous gray areas (multiple valid approaches for user-facing behavior), the agent will automatically trigger the [discuss gray areas](discuss.md) process within this phase. For clear, well-defined features, it goes straight to the next phase.

## Implicit-Requirement Dimensions

The canonical rubric for requirements that are easy to miss. Referenced by [discuss.md](discuss.md) - defined here, not duplicated.

| Dimension | What to cover |
| --------- | ------------- |
| Input validation & bounds | Limits, formats, sanitization |
| Failure / partial-failure states | Timeouts, partial saves, rollbacks |
| Idempotency / retry / duplicate handling | Safe retries, dedup keys |
| Auth boundaries & rate limits | Who can call what, throttle rules |
| Concurrency / ordering | Race conditions, ordering guarantees |
| Data lifecycle / expiry | TTL, archival, deletion |
| Observability | Logging, metrics, tracing hooks |
| External-dependency failure | Circuit breakers, fallbacks |
| State-transition integrity | Valid transitions, guards |

---

## Process

### 1. Clarify Requirements

**Load confirmed lessons first:** Before clarifying, load the project's confirmed lessons so past verification failures shape this spec instead of repeating. Run `python3 <skill-dir>/scripts/lessons.py list --status confirmed` (optionally `--scope [area]` or `--query [term]` for the area this feature touches) and apply what comes back as guidance. Load only `confirmed` - never `candidate` or `quarantined`. If no store exists yet or no code tool is available, skip silently. See [lessons.md](lessons.md).

**Lightweight context scan first (Knowledge Verification Chain Step 1):** Before asking questions, briefly scan existing code, patterns, and neighboring features relevant to this feature. Use what you find to ground your clarifying questions in reality - not to constrain the spec to current implementation. Keep it lightweight (stay within the <40k token budget; reuse the chain, no new machinery). The spec captures WHAT is needed, not only what exists.

You are a thinking partner, not an interviewer. Start open - let the user dump their mental model. Follow the energy: whatever they emphasize, dig into that.

Ask conversationally (not as a checklist):

- "What problem are you solving?"
- "Who is the user and what's their pain?"
- "What does success look like?"

If needed:

- "What are the constraints (time, tech, resources)?"
- "What is explicitly out of scope?"

**Facts you look up; decisions you ask.** Anything discoverable by reading the environment (the codebase, config, docs, existing conventions) you resolve yourself through the Knowledge Verification Chain - do not spend the user's attention asking for it. Reserve questions for genuine decisions that are the user's to make: scope, priorities, product behavior, trade-offs. A question you could have answered by reading the code erodes trust and wastes a turn.

**Challenge vagueness.** Never accept fuzzy answers. "Good" means what? "Users" means who? "Simple" means how? Make the abstract concrete: "Walk me through using this." "What does that actually look like?"

**Know when to stop - then run the dimensions sweep.** When you understand what they're building, why, who it's for, and what done looks like, run a closing **implicit-requirement dimensions sweep** before offering to proceed:

- **Large / Complex:** Cover every dimension above - each must resolve to a requirement OR an explicit `N/A because [reason]`. No blank entries allowed.
- **Medium:** Cover only dimensions obviously present for this feature's domain; collapse the rest to a single `remaining dimensions N/A for this scope`.
- **Small:** Skip the sweep entirely.

The `N/A because...` escape is mandatory - it prevents inventing requirements to fill the checklist. Bound the sweep to THIS feature's scope; never add requirements outside the feature boundary.

### 2. Capture User Stories with Priorities

**P1 = MVP** (must ship), **P2** (should have), **P3** (nice to have)

Each story MUST be **independently testable** - you can implement and demo just that story.

### 3. Write Acceptance Criteria (EARS notation)

Write every acceptance criterion in **EARS** (Easy Approach to Requirements Syntax). Each criterion resolves to exactly one pattern, which keeps it unambiguous and directly testable. Choose the pattern that fits the requirement instead of forcing everything into a single shape:

| Pattern | Keyword | Template | Use for |
| ------- | ------- | -------- | ------- |
| Ubiquitous | (none) | The [system] SHALL [response] | Always-on invariants and constraints |
| Event-driven | WHEN | WHEN [trigger] THEN the [system] SHALL [response] | A response to a discrete trigger |
| State-driven | WHILE | WHILE [state] the [system] SHALL [response] | Behavior that holds during a state |
| Optional-feature | WHERE | WHERE [feature is present] the [system] SHALL [response] | Behavior gated behind an optional capability or flag |
| Unwanted-behavior | IF / THEN | IF [undesired condition] THEN the [system] SHALL [response] | Errors, failures, invalid input, timeouts |
| Complex | combination | WHILE [state], WHEN [trigger] the [system] SHALL [response] | Richer behavior combining the above |

**Why patterns beat one shape:** failure states, state transitions, and optional behavior become first-class criteria instead of footnotes squeezed into WHEN/THEN. The patterns map onto the implicit-requirement dimensions above: state-transition integrity to State-driven; failure and external-dependency failure to Unwanted-behavior; feature flags to Optional-feature.

**Rules:** one requirement per criterion (never bundle two behaviors); use concrete values (a specific status code, a specific message, a bound) rather than "quickly" or "gracefully"; every criterion contains a SHALL and is measurable. `python3 <skill-dir>/scripts/validate_spec.py` flags any criterion without a SHALL and any that matches no recognized pattern.

### 4. Screens and their design

Skip this step when the feature puts no screen in front of a user.

**Walk each screen's decisions.** Every screen carries the same ones: empty, loading, error and
unauthorised states; the order of its content; the window widths it must work at (the captures'
sizes, or asked when no capture settles it); what a long list or a wide table does - what scrolls
and what stays in view; what a destructive action confirms; what each control does when used. Each
lands on a criterion, an existing behaviour you name, or a question.

**A control owes a gesture.** Every control gets a criterion naming who acts, which control, and
what the page shows afterwards. A screenshot shows the button, never what it does.

**Which references bind.** A capture, screenshot, design frame or live site that comes with the
request binds: it is the result the user expects, and the user does not have to say so. It is
`non-binding` only when the user called it inspiration, and its `Sources` line quotes them:
`non-binding - user: "<their words>"`. Something the source draws that the stored model cannot hold
- a code, a field - is a departure you ask about, never a reason to make the source non-binding.

**A binding source lives in files.** Export each frame or state to
`.specs/features/[feature]/captures/` and show each one on its `Sources` line,
`![<name>](captures/<file>) - binding - <what it draws>`, so whoever approves sees the screen.

**A screen with a binding source points at it.** Each screen or state the source draws gets one
criterion naming the gesture that reaches it and its capture file:

```
3. WHEN a member uses "Update card" THEN the system SHALL show the form in
   `.specs/features/billing/captures/card-form.png`
```

The builder matches the image for composition and look. Do not retype the screen into criteria;
add criteria for what the source cannot show: what a control does, states nobody captured, the rules
behind a form. Labels and sentences the capture draws are copied character for character; its sample
data - names, quantities, dates - is not transcribed: the builder recreates it with the capture open.

**Departing from a binding source is the user's call.** Removing, renaming or changing something it
draws is asked, with your recommendation. The answer becomes an `AD-NNN` in `.specs/STATE.md` whose
rationale quotes the question and the option chosen, and each departure gets a row in
`## Differences from the source` citing it.

**A screen with no reference gets outcomes, not layout.** Say what a user can see and do, never where
things sit; layout is the builder's call, held to the design system.

### 5. Requirement Closure Gate (before confirm)

Before presenting the spec for confirmation, run the three checks below. The spec is not presentable for confirmation until every item is resolved or assumption-logged - this is the guarantee that no requirement leaves the spec silently unclear.

**Scope-tiered:** Large/Complex = full gate; Medium = resolve obvious ambiguities, log the rest as assumptions; Small = skip entirely (consistent with skipping the sweep).

1. **Unambiguity + precision (hard).** Every AC must (a) have a single interpretation and (b) define a precise, spec-defined expected outcome. Any AC that fails either check: resolve with the user, split it, or log it as an explicit assumption with the chosen interpretation and rationale. No AC proceeds readable two ways or with an undefined outcome.

2. **Open-questions / assumptions closure.** Enumerate every unresolved decision that surfaced during clarification. A decision that is the user's - scope, product behaviour, a departure from a binding source - is asked before the spec is presented, with your recommendation; when nobody is there to answer, end your turn with the questions. An assumption never stands in for one of those to save a question. Only a default the code settles, or one the user delegated ("you decide"), is recorded as an **assumption** (chosen default + rationale). Nothing proceeds unmarked.

3. **Declined gray areas become assumptions.** A gray area the user declined to discuss is written to the spec's Assumptions & Open Questions section (agent's chosen default + rationale, `user declined`) - never silently dropped. See [discuss.md](discuss.md).

4. **The request, sentence by sentence.** Read the request again, one sentence at a time: each one lands on a criterion, an `Out of Scope` row or an open question. A sentence that lands nowhere is the requirement that goes missing, and nobody downstream reads the request again.

Fix inline. This gate is bounded to THIS feature's stated dimensions and actual behavior - never to "anything imaginable." The Out of Scope table and anti-scope-creep rules remain the counterweights: the gate clarifies existing requirements, it never invents new ones.

**Deterministic backing (run before you present the spec).** `python3 <skill-dir>/scripts/validate_spec.py <spec-path-or-feature>` checks the structure: required sections, EARS-shaped ACs, filled assumptions, well-formed requirement IDs, and with captures, that each is binding or quoted as inspiration, cited by a criterion, shown in the spec, and that every departure is confirmed under an active `AD-NNN`. A non-zero exit means fix before confirming. The judgment calls stay yours.

**Then present the spec and stop.** Approval of the spec is a stop for a human: lead with the questions that block, then the defaults you picked for the user to correct.

Each answer goes into the spec in the turn it arrives - a criterion, an Assumptions row with `y`, or an `AD-NNN` for a departure - not at the end of the conversation. When the user approves, write `**Approved**: <YYYY-MM-DD> - user: "<their words>"` under the title. An approval the user did not give is never written; `validate_tasks.py --execute` refuses to start without it.

---

## Template: `.specs/features/[feature]/spec.md`

```markdown
# [Feature Name] Specification

**Approved**: [written when the user approves - YYYY-MM-DD - user: "their words"]

## Problem Statement

[Describe the problem in 2-3 sentences. What pain point are we solving? Why now?]

## Goals

- [ ] [Primary goal with measurable outcome]
- [ ] [Secondary goal with measurable outcome]

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature     | Reason         |
| ----------- | -------------- |
| [Feature X] | [Why excluded] |
| [Feature Y] | [Why excluded] |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default  | Rationale | Confirmed? |
| --------------------- | --------------- | --------- | ---------- |
| [ambiguity]           | [what we'll do] | [why]     | [y/n]      |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: [Story Title] ⭐ MVP

**User Story**: As a [role], I want [capability] so that [benefit].

**Why P1**: [Why this is critical for MVP]

**Acceptance Criteria** (each line is one EARS pattern):

1. WHEN [user action/event] THEN system SHALL [expected behavior]  <!-- event-driven -->
2. IF [invalid input / failure] THEN system SHALL [graceful handling]  <!-- unwanted-behavior -->
3. WHILE [state holds] system SHALL [behavior during that state]  <!-- state-driven -->
4. The system SHALL [always-on invariant]  <!-- ubiquitous -->

**Independent Test**: [How to verify this story works alone - e.g., "Can demo by doing X and seeing Y"]

---

### P2: [Story Title]

**User Story**: As a [role], I want [capability] so that [benefit].

**Why P2**: [Why this isn't MVP but important]

**Acceptance Criteria**:

1. WHEN [event] THEN system SHALL [behavior]
2. WHEN [event] THEN system SHALL [behavior]

**Independent Test**: [How to verify]

---

### P3: [Story Title]

**User Story**: As a [role], I want [capability] so that [benefit].

**Why P3**: [Why this is nice-to-have]

**Acceptance Criteria**:

1. WHEN [event] THEN system SHALL [behavior]

---

## Edge Cases

Edge cases are usually unwanted-behavior (IF/THEN) or boundary (WHEN) criteria:

- IF [error scenario] THEN system SHALL [graceful handling]
- IF [unexpected input] THEN system SHALL [validation response]
- WHEN [boundary condition] THEN system SHALL [behavior]

---

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story       | Phase  | Status  |
| -------------- | ----------- | ------ | ------- |
| [FEAT]-01      | P1: [Story] | Design | Pending |
| [FEAT]-02      | P1: [Story] | Design | Pending |
| [FEAT]-03      | P2: [Story] | -      | Pending |

**ID format:** `[CATEGORY]-[NUMBER]` (e.g., `AUTH-01`, `CART-03`, `NOTIF-02`)

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** X total, Y mapped to tasks, Z unmapped ⚠️

---

## Differences from the source

Only when a source binds. Every way the product departs from what it draws, each one approved.

| Source shows | Product shows | Confirmed |
| ------------ | ------------- | --------- |
| [label, control or state in the capture] | [what the product shows instead, or nothing] | y - [AD-NNN] |

## Sources

- [ticket or document] - [what it settles]
- ![[capture]](captures/[capture].png) - binding - [what it draws]

---

## Success Criteria

How we know the feature is successful:

- [ ] [Measurable outcome - e.g., "User can complete X in < 2 minutes"]
- [ ] [Measurable outcome - e.g., "Zero errors in Y scenario"]
```

---

## Tips

- **P1 = Vertical Slice** - A complete, demo-able feature, not just backend or frontend
- **EARS is code** - If you can't write a criterion as a test, rewrite it; pick the pattern (WHEN / WHILE / WHERE / IF / ubiquitous) that fits
- **Requirement IDs are mandatory** - Every story maps to trackable IDs
- **Edge cases matter** - What breaks? What's empty? What's huge?
- **Out of Scope prevents creep** - If it's not here, it doesn't get built
- **Closure gate before confirm** - Three checks: unambiguity + precision, open-questions/assumptions closure, declined gray areas logged; scope-tiered; bounded to stated dimensions; never invents requirements
- **Confirm after the gate passes** - Present the spec for user confirmation only after the closure gate passes and `validate_spec.py` exits clean; the user approves the spec before Design or Tasks
