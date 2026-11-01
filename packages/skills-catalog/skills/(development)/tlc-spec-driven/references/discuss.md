# Specify: Discuss Gray Areas

**Goal:** Capture HOW the user pictures the feature where the spec has gray areas. This is not a phase of its own. It runs inside Specify.

**When it runs.** It runs when user-facing behaviour could go more than one way and the user has not said which. It also runs on request: "discuss feature", "how should this work?", "capture context".

**When it does not run.** It skips a trivial feature, such as a pure read endpoint or a config tweak. It runs whenever any [implicit-requirement dimension](specify.md#implicit-requirement-dimensions) is present. That means persistence or state, external calls, auth, payments, concurrency or state transitions.

## Why It Exists

The spec captures WHAT to build, and the design captures the architecture. Neither captures what the user pictured for the gray areas. That includes layout, interaction, error handling style and tone. Without this step the agent guesses.

Its output, `context.md`, feeds Design and Tasks. Design reads which decisions are locked. Tasks reads the behaviours each task must hold.

## Process

### 1. Find the Gray Areas

Read `.specs/features/[feature]/spec.md` and name its domain:

| Domain | Gray areas to explore |
| --- | --- |
| Something users **SEE** | Layout, density, interactions, empty states, visual hierarchy |
| Something users **CALL** (API) | Response format, errors, auth, versioning, rate limits |
| Something users **RUN** (CLI) | Output format, flags, modes, error handling, verbosity |
| Something users **READ** | Structure, tone, depth, flow, navigation |
| Something being **ORGANIZED** | Grouping, naming, duplicates, exceptions |
| Backend, state or a contract | Failure states, retries and duplicates, auth, data lifecycle, ordering ([specify.md](specify.md#implicit-requirement-dimensions)) |

Name 3 or 4 gray areas specific to THIS feature, never generic categories.

### 2. Ask Them, Once

Put every gray area that is the user's in one message, before the spec is presented. Give concrete options, your recommendation first, with one line of why. The user can then accept or override in a word.

- Resolve what the code answers yourself.
- A low-stakes default that is not a product decision is an assumption for the user to correct. Never ask it.
- "You decide" is an answer. Record the default with `user delegated`.
- A declined area goes to the spec's Assumptions with your default, the rationale and `user declined`. It is never dropped.
- When nobody is there to answer, end your turn with the questions. An assumption never makes a product decision.

### 3. Hold the Scope

The feature boundary from spec.md is fixed. Discussion settles HOW to build, never WHETHER to add a capability.

- **Allowed:** "How should posts be displayed?" It settles a gray area.
- **Not allowed:** "Should we also add comments?" It adds a capability.

When the user suggests more scope, say: "That sounds like a separate feature. I'll note it in Deferred Ideas." Then go back to the current area.

### 4. Write context.md

Write it in the turn the answers arrive, with the user's words for each decision. An answer left in the chat is lost to a compaction.

---

## Template: `.specs/features/[feature]/context.md`

```markdown
# [Feature] Context

**Gathered:** [date]
**Spec:** `.specs/features/[feature]/spec.md`

## Feature Boundary

[What this feature delivers - the scope anchor from spec.md]

## Implementation Decisions

### [Area 1]

- [Decision, with the user's words]

### Agent's Discretion

[Areas where the user said "you decide"]

### Declined Gray Areas → Assumptions

[Each declined area, also written to the spec's Assumptions with the default and rationale]

## Specific References

[Each "I want it like X" moment, or "none - open to standard approaches"]

## Deferred Ideas

[Ideas that belong to other features, or "none"]
```

## Tips

- **Look it up, never ask it.** Resolve what the code answers. Ask only product decisions.
- **Decisions, not vision.** "Cards with a subtle shadow" is a decision. "Should feel modern" is not.
- **The user pictures, the author builds.** Ask how they picture it, never about architecture. That is Design's job.
