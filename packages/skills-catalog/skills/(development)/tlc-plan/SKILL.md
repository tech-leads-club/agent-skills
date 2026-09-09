---
name: tlc-plan
description: 'Turns decided work into tasks with observable criteria for tlc-implement. Use when the user says "write the task", "cut this PRD into tasks", "turn this design doc into work", or "tlc-plan". Do NOT use when nobody has decided what to build, or to implement.'
license: CC-BY-4.0
metadata:
  author: Tech Leads Club - github.com/tech-leads-club
  version: 0.1.1
---

# TLC Plan

Cut the source. Ground it in the code. Write the task.

```
CUT ──────────→ GROUND ──────────→ WRITE
(slices, then   (the repository     (one task,
 how many        it lands in)        unless a seam
 tasks)                              is forced)
```

Someone already decided what to build. This turns that decision into work a builder can pick up without guessing, and stops at the first thing nobody decided. It has no opinion about product: it does not explore the problem, generate options, or grow scope. This skill feeds tlc-implement.

## Critical rules

1. Every criterion is an **observable outcome with a concrete value**. "The columns exist" is not a criterion, and that is the point - a horizontal slice has nothing observable to write, so the format cannot express one.
2. **Refuse rather than guess.** A gap in the source comes back as a question. A plausible criterion nobody decided is the expensive failure: it reads well, gets approved, and ships.
3. `Decided` carries only what is hard to reverse, in its literal shape. Everything reversible is decided while building and reviewed in the diff.
4. Raising a concern is free; growing scope is the user's call. Ask about anything you find; add capability nobody asked for, never.
5. When the source contradicts the code, **amend the source**. Quietly building the right thing leaves the document that five other people read still wrong.
6. The task is the record of decision. Linked documents keep the reasoning and stay editable; if one diverges later, ask before building.

## Cut

Read every source completely first - PRD, design doc, RFC, thread. Then enumerate the slices it contains, and only after that decide how many tasks they become. Those are two questions, and collapsing them is where sizing goes wrong.

**A slice is one observable outcome, never a layer.** "Schema first, then the endpoints" produces pieces nobody can verify alone, and their criteria degenerate into structure - the table exists, the route responds - which proves nothing about behaviour. A slice is right when someone can watch it work.

Vertical is the shape of a slice, not the size of a task. A task holding every slice in the source is still vertical, because every criterion is still an outcome someone can watch. Only the layer cut is unwritable here.

Preparation that proves nothing - a nullable column, a client with no caller - is real work and belongs in a commit or a pull request, but it is not a task, because it has no criterion.

**Default to one task for the whole source.** Splitting is the exception and needs a reason you can defend from evidence, which narrows it to three: a piece cannot land before another without breaking production, a piece waits on an answer only someone else can give, or a piece belongs to another team. Past those it is preference about how this team likes to work, and preference is not yours to impose - a cut you cannot defend makes the user undo your work before they start theirs.

The default buys something real, too. Every one-way door in the source gets reviewed **together**, once, where the interactions between them are visible. Split six ways, the same doors arrive in six batches and the abstraction they share grows by accretion, each task adding the minimum its own criteria needed and nobody ever seeing the whole.

**Say when it is big.** The cost of a large task is not a large pull request - those are independent, and one task routinely becomes several. The cost is how much work gets thrown away when an irreversible decision turns out wrong, because you find out later. So weigh what makes that expensive: how many one-way doors there are, whether a schema migration is among them, and how many slices - in that order. Six slices with no doors is safe whole; three slices with four doors and a migration is not.

When it is big, show the seams that exist instead of a number you made up. Order constraints first, marked as the kind that cannot be collapsed, then the thematic groupings, each with the reason it is a seam. Let the user pick where to cut. A round number the skill suggests is an opinion dressed as arithmetic.

**Sizing evidence, in order.** What the project declares wins: a contributing rule, a team convention doc. Then the issue tracker, if it is reachable - task size is a tracker property, and git history only ever reveals pull request size, which is a different question. Then ask. Say which of the three you used, so an inference about pull requests is never mistaken for one about tasks.

## Ground

Now open the repository. Everything above was written without the code in front of anyone, so it is wrong in places nobody can see from the document alone.

Three things only the code answers, and each has a home in the task:

- **What the change disturbs.** Which existing term changes meaning, and who depends on it today. A status that starts meaning something new breaks every caller branching on it, and none of them appear in the diff of the feature.
- **Which decisions are actually one-way.** A choice is precedent-setting only relative to what exists. You cannot tell a new pattern from an ordinary one without reading the conventions it will sit beside.
- **Where the source is simply wrong.** Names the system does not use, APIs that do not exist, a field the document invented. This is the most valuable thing the phase produces, and it goes back to the source, not only into the task.

What you do **not** settle here is placement. Which folder, which service, how many classes: the repository's own conventions answer most of it and the rest is reversible, so writing it down produces exactly the design document that goes stale and then misleads. Placement is recorded downstream, against the code, by **tlc-implement**. The exception is a choice that creates a pattern the codebase does not have - that is a one-way door and belongs in `Decided` like any other.

## Sweep

The source covers what somebody thought of. This is the list of what nobody writes down, and it is fixed so that a blank cannot look like nothing to answer: validation, failure modes, idempotency and retry, authorization, concurrency and ordering, data lifecycle, external-dependency failure, state transitions, observability.

Walk all nine, every time, and write where each one landed: a criterion you already wrote, something the code already handles, `n/a` with the reason, or - when it needs a product answer - `Unresolved`. Recording the landing is the whole mechanism. A sweep you only think through leaves nothing a reviewer can check, so it decays into a step that gets skipped on the busy day.

Concurrency and observability hide better than the other seven, because neither is visible to a user until it fails. Those two are the reason this list exists.

A landing must be a criterion that observes **that** dimension. Reaching for a number already used on another line is the tell that the dimension is uncovered: a duplicate rejected because a row already exists says nothing about two requests arriving at once, and a webhook deduplicated by event id says nothing about two webhooks arriving out of order. When you catch yourself borrowing, the honest landings are `n/a` with the reason, or a question. Both survive being read; a borrowed number does not.

The `n/a` escape is what stops the list from manufacturing requirements. A dimension that does not apply is a complete answer, and inventing a criterion to fill a row is the failure this would otherwise cause. Growing scope stays the user's call: a dimension that resolves to real new behaviour is a question you ask, never a criterion you add.

**tlc-implement** reads this instead of sweeping again - a dimension that lands on a criterion here is a check with a proof there.

## Refuse rather than guess

Five things must be true of every criterion before you write it:

- someone could **observe** the outcome - if you cannot say what would be seen, it is too vague
- it carries a **concrete value** - a status code, a field, a limit; never "gracefully", "properly" or "fast"
- **one run settles it** - a single execution either satisfies it or does not
- when it claims something will **not** happen, you can name what prevents it
- the **boundary** is stated - you can say what is explicitly out

**One run has to settle it.** This is where a target sneaks past the concrete-value check wearing a number: "status propagates within 5 minutes at p95" has a figure in it, and no single execution can satisfy or fail it, because a percentile is a property of a distribution. Percentiles, averages, uptime and error rates are service targets. Split the line - the behaviour is the criterion, that the status matches once the event is processed, and the target goes where it is actually measured, which is the observability dimension of the sweep. Fused, the provable half hides behind the unprovable one and a test that never touched the number marks the whole line green.

**A guarantee that something will not happen needs a mechanism.** Nothing prevents a duplicate, a double charge or a second write by default, so "a retry does not create a second subscription" is a claim about machinery: point at the code that enforces it or at the `Decided` row that introduces it, or you wrote a hope. Walk the failure that would produce the thing you are forbidding - the remote call succeeded and the local write did not - and check the mechanism still holds on that path, because that is the one nobody pictures. Where none exists, it is a `Decided` row or a question, never a criterion standing on its own.

Missing one is normal, and the response is to **ask** - not to note it and move on. Put the question to the user with the options you can actually see and what each one would change, so answering is a choice rather than an essay. Most close in one line.

**Facts you look up; decisions you ask.** Anything the environment already answers - a convention, an existing field, how the current endpoint behaves, what the schema allows - you resolve yourself through the knowledge chain. A question you could have answered by reading the code spends the user's turn and their patience, and enough of them turn this into an interview. Ask only what is genuinely theirs: scope, priority, product behaviour, which trade-off they want.

What survives the asking is what only Product or a tech lead can settle, and that goes to `Unresolved`, never into a criterion that sounds right. **Mark the ones that block.** A question that stops a criterion from ever being satisfiable is different in kind from one that leaves an error payload undecided, and a prefix in a list still hides the difference: the blocking one reads like a note while it is the reason the task cannot be handed on. `Kind` is a column so a blank cannot look like `open`. Where you wrote something anyway to keep the rest coherent, that goes in `Until answered`, so the review knows what to check.

A third kind blocks neither. The work ships, every proof is green, and the feature still cannot be turned on for real users - a catalog nobody populated, a credential nobody issued, an account nobody approved. It hides precisely because everything upstream passes, so it surfaces on launch day, and it gets its own `Kind` (`blocks go-live`) for that reason.

A source can also decide something wrongly and clearly - stated with a concrete value, just bad. That passes this gate and should: the place to catch it is the review of the task, and the task being explicit is what makes the review possible.

## Format

Read `references/document-format.md` when you write the `.tasks/<name>.md` artifact — after the cut, the grounding, and the sweep. Do not load it during Cut. Section headings in that template are literals: the next skill refers to them by name.

## Tasks are not pull requests

A task is a unit of verification and must prove something. A pull request is a unit of review and only has to be reviewable. They coincide often, and when they do not, the task is not what bends: preparation can be its own pull request while never being its own task.

So when a task is large enough to need splitting for review, propose the pull requests separately from the task, and calibrate rather than assert. What the repository declares comes first - a `CONTRIBUTING` rule, a pull request template. Where nothing is declared, read what the team actually does: median files and lines per merge, whether migrations travel alone or beside behaviour. Practice beats a number somebody wrote once.

Carry the same distinction as in the cut: order constraints are not negotiable, review preference is. A team that collapses a boundary thinking it is taste, when it was there to avoid a broken intermediate state, breaks a deploy.

## Knowledge chain

In strict order: existing code and conventions, project docs, library documentation, web search, then flag as uncertain. Never invent an API, a flag or a behaviour. "I could not find documentation for this" always beats a plausible fabrication.

## Output

Produce the artifact; do not narrate the phase. Present the cut, then the tasks, then the open questions with the blocking ones first. Lead with the verdict. State decisions definitively. Cut filler and hedging.

## Examples

### Example 1: One source, one task

User says: "Turn this design doc into work."
Actions:
1. Read the source completely. Enumerate slices, then decide how many tasks — default one.
2. Open the repository. Ground names, one-way doors, and contradictions. Amend the source if it is wrong.
3. Sweep the nine unwritten requirements. Ask rather than guess.
4. Read `references/document-format.md` and write `.tasks/<name>.md`.
Result: one task file. Criteria are observable outcomes with concrete values. Swept has all nine landings. Unresolved is a table, or `None`.

### Example 2: Source has no decision

User says: "Write the tasks for this idea."
Actions: Do not run this skill. Nobody has decided what to build. There is no source to cut.
Result: hand off; no `.tasks/` file from this skill.

### Example 3: Wrong skill

User says: "Implement the billing task."
Actions: Do not run this skill. That is tlc-implement.
Result: hand off; no new task file.

## Common failures

### A plausible criterion nobody decided
Cause: a gap in the source was filled with a criterion that reads well.
Solution: ask. Put the options you can see and what each one would change. What only Product can settle goes to `Unresolved`, never into Criteria.

### Horizontal slices
Cause: "schema first, then the endpoints" was treated as two tasks.
Solution: a slice is one observable outcome someone can watch. Default to one task. Split only for an order constraint, an answer only someone else can give, or another team.

### Borrowed sweep landing
Cause: concurrency landed on a uniqueness criterion already used for validation.
Solution: a landing must observe that dimension. If it does not apply, `n/a` with the reason. If it needs a product answer, `Unresolved`.
