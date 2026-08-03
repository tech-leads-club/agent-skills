# Specify: Discuss Gray Areas

**Goal:** Capture HOW the user envisions the feature when the spec has ambiguous areas. This is NOT a separate phase - it's triggered within Specify when the agent detects gray areas that need user input.

**Trigger:** Automatically when gray areas are detected during spec creation, or explicitly via "discuss feature", "how should this work?", "capture context"

**When to trigger (auto-detect):** The spec contains user-facing behavior that could go multiple ways AND the user hasn't expressed a preference. If the spec is clear and unambiguous, skip this entirely.

**When NOT to trigger:** Genuinely trivial features - a pure read endpoint, a config tweak, features with no [implicit-requirement dimensions](specify.md#implicit-requirement-dimensions) present (no persistence/state, external calls, auth, payments, concurrency, or state transitions). When any dimension is present, trigger discuss.

## Why This Phase Exists

Specifications capture WHAT to build. Design captures the architecture. But neither captures the user's vision for ambiguous areas - layout preferences, interaction patterns, error handling style, content tone. Without this, the agent guesses. With this, the agent builds what the user actually imagined.

The output - `context.md` - feeds directly into Design and Tasks:

- **Design reads it** to know what decisions are locked vs. flexible
- **Tasks reads it** to include specific behaviors in task definitions

## Process

### 1. Analyze the Feature

Read `.specs/features/[feature]/spec.md` and identify the domain:

| Domain                         | Gray areas to explore                                         |
| ------------------------------ | ------------------------------------------------------------- |
| Something users **SEE**        | Layout, density, interactions, empty states, visual hierarchy |
| Something users **CALL** (API) | Response format, errors, auth, versioning, rate limiting      |
| Something users **RUN** (CLI)  | Output format, flags, modes, error handling, verbosity        |
| Something users **READ**       | Structure, tone, depth, flow, navigation                      |
| Something being **ORGANIZED**  | Grouping criteria, naming, duplicates, exceptions             |
| Something with **backend / state / contract** | Failure & partial-failure states, idempotency/retry/dedup, auth boundaries & rate limits, data lifecycle/expiry, concurrency/ordering - see [implicit-requirement dimensions](specify.md#implicit-requirement-dimensions) |

Generate 3-4 **feature-specific** gray areas. Not generic categories, but concrete decisions for THIS feature.

### 2. Present Gray Areas

Present the feature boundary (from spec.md) and the gray areas to the user. Let them choose which to discuss. Do NOT include a "skip all" option - the user invoked this phase to discuss.

Any gray area the user **declines** to discuss, or that goes undiscussed, is written to the spec's **Assumptions & Open Questions** section (agent's chosen default + rationale) - never silently dropped. This ensures the spec's closure gate can pass: every gray area is either resolved through discussion or recorded as a signed-off assumption.

### 3. Choose discussion pace (once)

Before deep-diving, ask **one** pace question. Recommend **Guided** as the default. If the user skips, says "whatever", or "you choose", use Guided.

| Pace         | When it fits                                      | Cadence                                                                 |
| ------------ | ------------------------------------------------- | ----------------------------------------------------------------------- |
| **Quick**    | User wants speed; trusts defaults                 | Propose defaults per area (rationale included); user accepts / overrides |
| **Guided**   | Default - balances depth and turn count           | Adaptive elicitation (see below)                                        |
| **Detailed** | High ambiguity; user wants Socratic control       | Exactly one decision per turn, dependency order                         |

Honor mid-discussion switches immediately ("go faster", "slow down", "just decide") - change pace without restarting or re-asking settled decisions.

### 4. Deep-Dive Each Area

Shared rules for every pace:

1. Options must be concrete ("Card layout" or "Table layout" - not "Option A" or "how should it look?").
2. Lead with your recommended answer and one line of reasoning. You have read the codebase; the user should be able to accept or override in a word.
3. Offer "You decide" when reasonable - it records agent discretion explicitly.
4. Resolve anything discoverable from the code yourself (Knowledge Verification Chain); only put genuine product decisions to the user.
5. When an area is settled: "More on [area], or move on?" After all areas: "Ready to create context?"

**Quick:** For each selected gray area, present the recommended decisions for that area in one turn (defaults + short rationale). Wait for accept / override. Do not drip-feed single questions unless the user challenges a default and opens a real fork.

**Guided:** Adaptive elicitation - questions are a decision tree to prune, not a checklist to finish.

1. Classify upcoming decisions as **independent** vs **dependent**.
2. Low-stakes / safe-to-default → state the assumption and invite correction (no blocking question).
3. Independent product decisions → ask **at most 2** in the same turn, each with options + recommended default.
4. Dependent decisions → ask **exactly one**, wait, then continue (the earlier answer should prune later questions).
5. Never dump 3+ questions in one turn. Never ask what the code already answers.
6. Stop the area as soon as enough is decided.

**Detailed:** Walk selected gray areas as a strict decision tree - one concrete question per turn, dependency order, wait for each answer before the next. Use when the user wants maximum control or the feature is highly ambiguous.

### 5. Scope Guardrail (CRITICAL)

The feature boundary from spec.md is **fixed**. Discussion clarifies HOW to implement, never WHETHER to add new capabilities.

**Allowed:** "How should posts be displayed?" (clarifying ambiguity)
**Not allowed:** "Should we also add comments?" (new capability)

When user suggests scope creep: "That sounds like a separate feature. I'll note it in Deferred Ideas. Back to [current area]."

### 6. Write context.md

---

## Template: `.specs/features/[feature]/context.md`

```markdown
# [Feature] Context

**Gathered:** [date]
**Spec:** `.specs/features/[feature]/spec.md`
**Status:** Ready for design

---

## Feature Boundary

[Clear statement of what this feature delivers - the scope anchor from spec.md]

---

## Implementation Decisions

### [Area 1 that was discussed]

- [Specific decision made]
- [Another decision if applicable]

### [Area 2 that was discussed]

- [Specific decision made]

### [Area 3 that was discussed]

- [Specific decision made]

### Agent's Discretion

[Areas where user explicitly said "you decide" - agent has flexibility here during design/implementation]

### Declined / Undiscussed Gray Areas → Assumptions

[Gray areas the user declined to discuss or that were not covered. Each entry is written to the spec's Assumptions & Open Questions section with the agent's chosen default and rationale - not left silently unresolved.]

---

## Specific References

[Any "I want it like X" moments, product references, specific behaviors, interaction patterns mentioned during discussion]

[If none: "No specific requirements - open to standard approaches"]

---

## Deferred Ideas

[Ideas that came up during discussion but belong in other features/phases. Captured here so they're not lost, but explicitly out of scope]

[If none: "None - discussion stayed within feature scope"]
```

---

## Tips

- **Pace is a user choice; Guided is the default** - Quick for speed, Guided for balance, Detailed for Socratic depth; honor mid-discussion switches
- **Guided ≠ interrogation and ≠ form dump** - Assume-first when safe, ≤2 independent questions per turn, one-at-a-time only when answers depend on each other
- **Look it up, don't ask** - Resolve anything discoverable from the code yourself; ask only genuine product decisions
- **Decisions, not vision** - "Card-based layout with subtle shadows" is a decision. "Should feel modern" is not.
- **Scope is sacred** - Deferred Ideas captures scope creep without losing ideas
- **User = visionary, Agent = builder** - Ask about how they imagine it, not about technical implementation
- **Don't ask about:** Technical architecture, performance, implementation details - that's Design's job
- **Confirm before Design** - User approves context.md before moving to design phase
