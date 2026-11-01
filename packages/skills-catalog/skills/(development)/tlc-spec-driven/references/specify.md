# Specify

**Goal**: Capture WHAT to build as criteria a test can hold, each with its own ID.

When the feature has gray areas the user must settle, run [discuss.md](discuss.md) inside this phase. A clear feature goes straight on.

## Implicit-Requirement Dimensions

The rubric for requirements that are easy to miss. [discuss.md](discuss.md) points here. `validate_spec.py` reads these exact names in `## Implicit Requirements`.

| Dimension | What to cover |
| --------- | ------------- |
| Input validation & bounds | Limits, formats, sanitization |
| Failure / partial-failure states | Timeouts, partial saves, rollbacks |
| Idempotency / retry / duplicate handling | Safe retries, dedup keys |
| Auth boundaries & rate limits | Who can call what, throttle rules |
| Concurrency / ordering | Races, ordering guarantees |
| Data lifecycle / expiry | TTL, archival, deletion |
| Observability | Logging, metrics, tracing hooks |
| External-dependency failure | Circuit breakers, fallbacks |
| State-transition integrity | Valid transitions, guards |

---

## Process

### 1. Clarify Requirements

**Load confirmed lessons first.** Run `python3 <skill-dir>/scripts/lessons.py list --status confirmed`. Narrow it with `--scope` or `--query` for the area this feature touches. Apply what comes back. Load only `confirmed`, never `candidate` or `quarantined`. Skip this silently when no store or no code tool exists ([lessons.md](lessons.md)).

**Scan the code lightly first.** Read the code, patterns and neighbouring features this feature touches. Use them to ground your questions, not to shrink the spec to what exists. Stay within a budget of about 40k tokens.

You are a thinking partner, not an interviewer. Let the user describe their picture first. Then dig into what they stress. Ask in conversation:

- "What problem are you solving?"
- "Who is the user, and what hurts?"
- "What does success look like?"
- When it matters: "What are the constraints?" and "What is out of scope?"

**Facts you look up. Decisions you ask.** Resolve what the code, the config and the docs can answer yourself. Ask only what is the user's to decide: scope, priorities, product behaviour, trade-offs. A question the code could answer wastes a turn and costs trust.

**Challenge vagueness.** "Good" means what? "Users" means who? "Simple" means how? Ask the user to walk you through it.

**Close with the dimension sweep.** When you know what, why, for whom and what done looks like, sweep the dimensions above:

- **Large and Complex:** every dimension lands on criterion IDs, or on `N/A - <reason>`. `validate_spec.py` refuses a missing row.
- **Medium:** cover the dimensions this feature plainly touches. The table is optional, and when present it is checked the same way.
- **Small:** skip the sweep.

`N/A - <reason>` exists so you never invent a requirement to fill a row. The sweep stays inside this feature.

### 2. Write User Stories with Priorities

**P1** is the MVP and must ship. **P2** should ship. **P3** is nice to have. Each story is testable on its own: you can build and demo that story alone.

### 3. Write Criteria in EARS, One ID Each

Every criterion carries its own ID, and one criterion is one behaviour. Checks cite these IDs, tasks name them, and the gates join on them. Write each criterion in one EARS pattern:

| Pattern | Keyword | Template | Use for |
| ------- | ------- | -------- | ------- |
| Ubiquitous | none | The [system] SHALL [response] | Invariants that always hold |
| Event-driven | WHEN | WHEN [trigger] THEN the [system] SHALL [response] | A response to a trigger |
| State-driven | WHILE | WHILE [state] the [system] SHALL [response] | Behaviour during a state |
| Optional-feature | WHERE | WHERE [feature is present] the [system] SHALL [response] | Behaviour behind a flag |
| Unwanted-behaviour | IF / THEN | IF [condition] THEN the [system] SHALL [response] | Errors, failures, invalid input |
| Complex | combined | WHILE [state], WHEN [trigger] the [system] SHALL [response] | Several of the above |

`validate_spec.py` holds each criterion to these rules:

- It starts with its ID: `1. **AUTH-01** WHEN ...`. An ID is used once.
- It has exactly one SHALL. Two behaviours are two criteria.
- A condition leads the sentence. "The system SHALL retry if the gateway times out" fails. Write `IF the gateway times out THEN the system SHALL retry once`.
- An IF has its THEN.
- It names a value a test can hold: a status, a message, a bound. Vague words fail: quickly, gracefully, properly, adequado, and the rest of the list in `specs.py`.
- It holds no semicolon.

The EARS keywords and SHALL stay in English and in capitals. The rest of the sentence follows the project's language.

### 4. Screens and Their Design

Skip this step when the feature puts no screen in front of a user.

**Walk each screen's decisions.** Every screen has empty, loading, error and unauthorised states. It has an order of content and the window widths it must work at. Decide what a long list or a wide table does. Decide what a destructive action confirms, and what each control does. Each lands on a criterion, an existing behaviour you name, or a question.

**A control owes a gesture.** Each control gets a criterion: who acts, on which control, and what the page shows after. A screenshot shows the button, never what it does.

**Which references bind.** A capture, screenshot, design frame or live site that comes with the request binds. It is `non-binding` only when the user called it inspiration, and its `Sources` line quotes them: `non-binding - user: "<their words>"`. When the source draws something the stored model cannot hold, ask about the departure. That is never a reason to call the source non-binding.

**A binding source lives in files.** Export each frame or state to `.specs/features/[feature]/captures/`. Show each one on its `Sources` line: `![<name>](captures/<file>) - binding - <what it draws>`. Whoever approves then sees the screen.

**A screen with a binding source points at it.** Each state the source draws gets one criterion that names the gesture and the capture file:

```
3. **BILL-03** WHEN a member uses "Update card" THEN the system SHALL show the form in
   `.specs/features/billing/captures/card-form.png`
```

The author matches the image for composition and look. Do not retype the screen into criteria. Add criteria for what the image cannot show: what a control does, states nobody captured, the rules behind a form. Copy labels and sentences from the capture character for character. Do not transcribe its sample data.

**Departing from a binding source is the user's call.** Ask with your recommendation. The answer becomes an `AD-NNN` in `.specs/STATE.md` that quotes the question and the choice. Each departure gets a row in `## Differences from the source` that cites it.

**A screen with no reference gets outcomes, not layout.** Say what a user can see and do, never where things sit. Layout is the author's call, held to the design system.

### 5. Close the Spec Before You Present It

1. **One reading, one outcome.** Each criterion has a single reading and a precise outcome. Resolve, split or log anything that fails as an assumption with its rationale.
2. **Open questions.** A decision that is the user's is asked before the spec is presented, with your recommendation. An assumption never stands in for one. Only a default the code settles, or one the user delegated, becomes an assumption.
3. **Declined gray areas.** A gray area the user declined goes to Assumptions with your default, the rationale and `user declined`.
4. **The request, sentence by sentence.** Read the request again. Each sentence lands on a criterion, an `Out of Scope` row or an open question. A sentence that lands nowhere is the requirement that goes missing.

Then run `python3 <skill-dir>/scripts/validate_spec.py <feature>` and fix every error. It also checks the declared scope against the spec's size. More than 3 criteria or 1 story owes Medium, and more than 8 criteria or 2 stories owes Large.

**Present the spec and stop.** Lead with the questions that block, then the defaults you picked for the user to correct. Write each answer into the spec in the turn it arrives. When the user approves, run `python3 <skill-dir>/scripts/approve.py <feature> spec --user "<their words>"`. It refuses a spec its gate fails or with open questions. You never stamp words the user did not give.

**The approval binds the text.** The line carries a hash of the spec. After it, every change goes back to the user: a review fix, an answer mid-build, a criterion a finding adds. Show them the change, then stamp it again with their new words, in a commit of its own. Until then, every gate refuses the spec.

**A Medium feature keeps its checks here.** Add a `## Checks` section with the `**Build**:` line, the `Run` lines and one check per criterion. [tasks.md](tasks.md) gives their shape.

---

## Template: `.specs/features/[feature]/spec.md`

```markdown
# [Feature Name] Specification

**Approved**: [approve.py writes this line when the user approves]
**Scope**: [Small | Medium | Large | Complex]

## Problem Statement

[The problem in 2-3 sentences. What hurts, and why now?]

## Goals

- [ ] [Primary goal with a measurable outcome]

## Out of Scope

| Feature     | Reason         |
| ----------- | -------------- |
| [Feature X] | [Why excluded] |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| [ambiguity]           | [what we do]   | [why]     | [y/n]      |

**Open questions:** none

---

## User Stories

### P1: [Story Title] ⭐ MVP

**User Story**: As a [role], I want [capability] so that [benefit].

**Why P1**: [Why the MVP needs it]

**Acceptance Criteria**:

1. **[FEAT]-01** WHEN [trigger] THEN the system SHALL [response]
2. **[FEAT]-02** IF [failure or invalid input] THEN the system SHALL [response]
3. **[FEAT]-03** WHILE [state] the system SHALL [response]
4. **[FEAT]-04** The system SHALL [invariant]

**Independent Test**: [How to demo this story alone]

### P2: [Story Title]

**User Story**: As a [role], I want [capability] so that [benefit].

**Acceptance Criteria**:

1. **[FEAT]-05** WHEN [trigger] THEN the system SHALL [response]

---

## Implicit Requirements

| Dimension | Lands on |
| --- | --- |
| Input validation & bounds | [FEAT]-02 |
| Failure / partial-failure states | N/A - [reason] |
| Idempotency / retry / duplicate handling | [IDs or N/A - reason] |
| Auth boundaries & rate limits | [IDs or N/A - reason] |
| Concurrency / ordering | [IDs or N/A - reason] |
| Data lifecycle / expiry | [IDs or N/A - reason] |
| Observability | [IDs or N/A - reason] |
| External-dependency failure | [IDs or N/A - reason] |
| State-transition integrity | [IDs or N/A - reason] |

## Differences from the source

Only when a source binds. Every way the product departs from what it draws, each one approved.

| Source shows | Product shows | Confirmed |
| ------------ | ------------- | --------- |
| [label, control or state in the capture] | [what the product shows instead] | y - [AD-NNN] |

## Sources

- [ticket or document] - [what it settles]
- ![[capture]](captures/[capture].png) - binding - [what it draws]

## Success Criteria

- [ ] [Measurable outcome]
```
