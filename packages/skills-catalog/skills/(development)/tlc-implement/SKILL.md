---
name: tlc-implement
description: 'Implement a work already planned: extracts a checklist, builds it, and proves every check with an independent verifier. Use when the user says "extract a checklist", "build this ticket", "implement this spec", or "tlc-implement". Do NOT use when nobody has decided what to build, or to design the work.'
license: CC-BY-4.0
metadata:
  author: Tech Leads Club - github.com/tech-leads-club
  version: 0.1.0
---

# TLC Implement

Extract the checks. Build. Prove each one, independently.

```
EXTRACT ─────────→ BUILD ─────────→ VERIFY
(one checklist)    (your call)      (fresh agent)
```

The thinking already happened somewhere else. Your job is to lose nothing from it, then prove what you built. **How** you build is yours - no phases, no task list, no step-by-step.

## Profile

The project chooses how much of this runs, in its `AGENTS.md` or equivalent:

```markdown
## tlc-implement

profile: standard
handoff: on
```

`profile` is one of `light`, `standard`, `ui`; `handoff` is `on` or `off`, and absent it is `on`. A batch packs whole slices up to **150k tokens** of estimated reading; a project on a smaller window overrides that with `handoff: on, budget 90k`. Which slices land in which batch is not configured - that is decided per feature, from the slices in front of you, and written down before any code.

| Profile | Adds | Cannot catch |
|---|---|---|
| `light` (default) | proofs batched at `HEAD`, each named test shown to exist and run, one located assertion per check, level and sampling gaps, `Swept existing` re-read | a set member with no proof; a test that would pass under a wrong implementation |
| `standard` | the `Coverage` join, `Test policy` rows with a verdict each, one fault per assertion surface | a check that contradicts the design; a screen nobody built |
| `ui` | binding sources opened and compared, per-screen enumeration of copy **and arrangement**, the designed-screens row - [screens.md](references/screens.md) | **only** spacing, colour and type weight, enumerated per screen - never layout, which a selector reaches and which is checked like anything else |

Each step adds a **class of failure detected**, so read the right column before choosing: the cheap profile is not a discount on the same product. Absent a declaration, `light` - a review nobody runs because it outlasts the build protects nothing, so the default is the one that gets run rather than the one that catches most.

Under `standard` or `ui`, read `references/test-policy.md` when writing Coverage and Test policy rows. Under `light` skip that file.

**A step whose input is empty costs a line, not a pass.** The `Coverage` join has nothing to recompute where the checklist declares no set; the `Test policy` verdicts need that section to exist; step 1 needs a source marked binding. Say "no set rows" and move on - working through an empty step is how a small feature ends up paying a large feature's review.

`ui` costs nothing on work with no interface, because every screen step is conditional on a source marked binding; a product repo can set it once and stop thinking about it.

**The profile is a floor and it is not a secret.** The verification report names it, or "no faults injected" reads the same as forgetting. Where the profile looks too thin for the feature in hand, say so in one line and let the user raise it - doing more than the profile in silence costs the predictability that made it worth declaring.

`handoff: on` is the default and governs the build alone: `off` keeps the whole build in one agent, and what that changes is in *When one agent is not enough*. It does not reach the Verifier, which is a separate agent because the author cannot check their own work rather than because the build ran long.

## Critical rules

1. Every check names its **proof**: the test or command whose exit code settles it. No proof, no check.
2. Tests assert what the checklist says, never what the code happens to do. Never write a test by reading the implementation.
3. Never weaken an assertion, delete a test, or skip one to make a suite pass. If a test is genuinely wrong, stop and ask.
4. The checks and the test-policy rows do not change while you build: once written they are the bar you build under, not a position to argue against, and lowering either is renegotiation with the user, visible in the diff. `Landing` is the exception, and it is additive - a door you discover while building gets a row, never a deletion.
5. The **Verifier is a fresh sub-agent**, never the author, never optional, never waiting to be asked. It is dispatched by whoever holds the whole feature, after the **last batch** has landed - never by a build agent, and never as a child of one. A build agent never spawns another agent at all. This is what keeps "done" from being a self-report.
6. **Blast radius:** an approved checklist authorises local edits and local commits. `git push`, deploy and production data changes need an explicit go-ahead.

## Extract

Read the source completely first - ticket, PRD, RFC, thread. Then walk the codebase around what it touches, so the checks land on real paths and reuse what exists.

**Refuse rather than guess.** Three things must be true before you write the checklist:

- every claim has a **nameable proof** - if you cannot say which test would settle it, it is too vague to write down
- every claim has a **concrete value** - a status code, a field, a bound; never "gracefully", "properly" or "fast"
- the boundary is stated - you can say what is explicitly out

Under `profile: ui` a screen carries a fourth requirement - the design is a **binding** source and its concrete values belong in the checks - and the whole of it lives in [screens.md](references/screens.md). Under `light` or `standard` skip that file entirely.

Missing one is normal and asking is cheap. Proceeding on a guess is not: if it is still unclear after asking, name what is missing and stop there. A vague check becomes a vague assertion that passes, which is the one failure this whole thing exists to prevent.

**Sweep for what the source does not mention.** These are the requirements nobody writes down, so go through them explicitly and say where each one landed: validation, failure modes, idempotency and retry, authorization, concurrency and ordering, data lifecycle, external-dependency failure, state transitions, observability.

Raising one is always free. Growing scope is the user's call - most resolve to something that already exists, or to "not in scope because X", and both are complete answers. What is not allowed is passing over one in silence.

### Format

Read `references/checklist-format.md` when you write the `.checks/<feature>.md` artifact — after the source is read, the refuse gate is passed, and the sweep is walked. Do not load it during the first pass of Extract.

## Build

You decide how. Write the tests from the checklist, implement, run each proof, commit in coherent pieces with Conventional Commits.

Two boundaries, and they are about scope rather than care. New capability nobody asked for and unrelated refactors are not yours to add - surface them and move on. Everything else inside the work at hand is the work: a guard clause, a log line, a clear error message, a test beyond the proofs when you can say what *should* happen at an edge the checklist did not name. Extra tests are welcome and there is no quota.

Doors get discovered while building, and deciding them is yours - stopping to ask on every one defeats the point of getting out of your way. Decide, then record: append the row to `Landing` with its literal shape and the alternative you rejected, **before the code that closes it is written**, and in that code's commit where the project tracks the artifact. The timing is the mechanism, not the commit. An alternative is only knowable while you are still choosing between them; written at the end of the build it becomes a justification of what you already wrote, which is the stale design document `Landing` exists to avoid. Stating what the other option would have done is also the one thing that can expose a bad decision with nobody else in the loop.

A red proof is a stop, not a note. If a check turns out to be wrong or impossible, stop and renegotiate with the user rather than quietly adjusting it. The same goes for a `Landing` row the user approved that the build proves unbuildable - they approved that shape specifically. A new door that contradicts nothing already approved never stops: it gets its row and you keep going.

### When one agent is not enough

A long build runs out of context, and the two ways through it are not equivalent. Automatic compaction summarises the **conversation** and chooses for you what to drop, at whatever token boundary it happens to hit. A handoff to a fresh agent carries the **artifact**, at a boundary you chose. This skill is built for the second: the checklist plus the diff is a better briefing than a machine summary of a chat, which is the whole reason `Landing` rows are appended before the code that closes them rather than at the end.

**The batch is whole slices, and you decide how many while writing the checklist.** Slices come from the upstream task, one observable outcome each, and their checks are countable before any code exists - so the split is knowable in advance, which is the only reason it can be declared and argued with. Never split a slice: mid-slice is green but incomplete, and the next agent inherits half an outcome, which is the horizontal cut the whole pipeline exists to avoid.

**Weigh the slices, do not count them.** Slice size varies by a factor of three or more inside one task - the one holding all the doors is rarely the one with three trivial criteria - so a fixed number of slices per batch inherits all of that variance. Pack by the size on each slice heading: **accumulate whole slices while the running total stays under 150k tokens**, and hand off at the last slice that fits. Where two packings both fit, prefer the boundary at which the **surface changes** - where the next slice reads different code - because there the next agent had to read it anyway and nothing is paid twice.

A slice that alone exceeds the budget is a slice the upstream task cut too coarsely. Say so rather than splitting it here: cutting mid-outcome is the horizontal cut this whole pipeline exists to avoid, and the task is the place that can re-cut it vertically.

**Why a token budget works where a check budget did not.** What a check costs is a property of the repo - fourteen checks inside one service share their reading, fourteen across fourteen modules pay it in full - so a count travels badly between projects. A token does not: it means the same thing everywhere, and it is measurable from the files themselves. 150k is the default because it leaves the rest of a large window for the part no arithmetic reaches - failing tests, retries, a runner dumping two thousand lines. Where a project runs a different window, it says so: `handoff: on, budget 90k`. Do not fix the number of agents up front, though; that is still a boundary you would honour after it stopped making sense.

Write the intended split into the checklist while you are still writing it, under a `## Handoff` heading, with the arithmetic that produced it - "S1-S3 = 118k, all in Warehouse; S4 enters Quantities at 140k, so hand off after S3". It costs a line, it is contestable before any code exists, and it is the only moment when anyone can say the batching is wrong cheaply. A number with its reason beside it can be argued with; a bare "hand off after slice 3" can only be trusted.

**Handing off.** Only on green, with every proof in the batch passing. The next agent reads the checklist and the **diff of what has already landed** - never a narrative summary of it. The diff is the state, and it carries the hundred reversible choices that sit below the `Landing` bar: naming, error shape, where the helper went. Those are exactly what drifts between agents, and they are exactly what no document records.

Then append three lines to `## Handoff`. They go in the checklist rather than in the next agent's prompt: a briefing written into a prompt survives exactly one boundary, and the third agent needs the first one's.

- **Where the boundary fell** - the checks now closed and the commit that closed them. Scope then comes from the artifact instead of being reconstructed from a diff, which is the one inference the next agent would otherwise have to make before writing a line.
- **What the user settled mid-build** - every clarification and renegotiation that did not already become a `Landing` row or an edited check. This is the class that hurts most, because it exists only in a conversation the next agent cannot read, and re-deriving it means asking the user the same question twice or guessing, which every other part of this skill forbids.
- **What was abandoned** - tried, discarded, and why. The one thing neither the code nor the checklist preserves.

**When compaction happens anyway**, re-read the checklist and the diff before continuing. You cannot see the limit approaching - no reliable measure of your own context exists - but you can see that a compaction occurred, so build the recovery on the signal that exists rather than on predicting the one that does not.

That paragraph is the whole strategy under `handoff: off`, which a project sets when its harness has no sub-agent mechanism, or when one continuous session is simply easier to review. Off means one agent, compaction, and re-reading - so the checklist earns its keep more rather than less. Say at the start of a long build that handoff is off, and where the work is plainly too large for one context say that too, then let the user turn it back on for this feature.

Where the source is a ticket or a thread rather than a task with slices, there are no inherited boundaries, so cut on the surface you found yourself - the module the next checks move into. Say when that happens: a boundary you drew is weaker than one the upstream task drew, and the next agent should know that is what it inherited.

## Verify

When the last commit lands, dispatch the Verifier automatically. See [verify.md](references/verify.md). The work is not done at the last commit; it is done when the Verifier's report accounts for every check.

**"After the last commit" means the last one of the feature, not of your batch.** With handoff on there are two different lasts, and collapsing them is the shortcut that looks like saving a hop: the agent closing the final batch tells its own sub-agent to verify on the way out. Even with a clean context that sub-agent is briefed by someone who only saw the final batch, so it verifies that slice's range and reports a pass that reads as if it covered the feature. And the verdict goes back to the author, who is then the one deciding what to do about it.

So a build agent finishes, reports, and stops. Verification is the orchestrator's step: it waits for the last batch, then dispatches one agent over `<feature base>..HEAD` with **every** check. If you find yourself writing "when you commit, dispatch the verifier" into a builder's prompt, that is the mistake with a friendly face.

## Knowledge chain

In strict order: existing code and conventions, project docs, library documentation, web search, then flag as uncertain. Never invent an API, a flag or a behaviour. "I could not find documentation for this" always beats a plausible fabrication.

## Output

Produce the artifact; do not narrate the phase. Lead with the verdict. State decisions definitively. Cut filler and hedging.

## Examples

### Example 1: Decided work, one feature

User says: "Implement this spec."
Actions:
1. Read the source completely, then walk the code it touches.
2. Refuse vague claims. Sweep the nine unwritten requirements.
3. Read `references/checklist-format.md` and write `.checks/<feature>.md`.
4. Build from the checklist. Run each proof. Commit in coherent pieces.
5. After the last commit of the feature, dispatch a fresh Verifier with `references/verify.md`.
Result: a checklist with named proofs, green proofs, and a Verifier report that accounts for every check.

### Example 2: Nobody decided

User says: "Build a cache for the dashboard."
Actions: Do not run this skill. There is no prior artifact to extract from.
Result: hand off; no `.checks/` file from this skill.

### Example 3: Wrong skill

User says: "Should we add billing?"
Actions: Do not run this skill. Nobody has decided what to build.
Result: hand off; no checklist and no code from this skill.

## Common failures

### A proof that names a suite
Cause: `Proof: npm test` was treated as settling one claim.
Solution: name a specific test. A suite going green says nothing about this claim.

### The author verified their own work
Cause: the builder dispatched a child agent, or re-checked the diff themselves.
Solution: a build agent finishes, reports, and stops. The orchestrator dispatches a fresh Verifier over the whole feature after the last batch.

### A test written from the implementation
Cause: the assertion mirrors what the code happens to do.
Solution: tests assert what the checklist says. If a check is wrong or impossible, stop and renegotiate rather than quietly adjusting it.
