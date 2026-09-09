# Build

**Goal:** satisfy the checks. How is yours.

No task list, no phase plan, no per-task review tables, no `Files to touch` declaration before
each edit. The checks are the bar; the route is your call. If you find yourself writing a plan
for the model to obey, you are rebuilding the thing this skill removed.

## What is fixed and what is not

Fixed: the checks, the `Test policy` rows, and the proofs each check names. Lowering either is
renegotiation with the user, visible in the diff.

Yours: order, decomposition, how many commits, where files go, naming, error shapes, which
helper gets extracted. The repo's conventions answer most of it and the rest is reversible and
reviewed in the diff.

The plan's shape sections have a rule each, and the split matters because it is what keeps one
file both approved and current.

Additive: `Landing`, `Relations`, `Surface`. A door you discover while building gets a row - never
a deletion, and never a rewrite of a row the user approved. `Relations` and `Surface` grow the
same way, because both were reviewed: an entity or a route appearing mid-build is new information,
one that quietly changes shape is a renegotiation.

**Kept true: `Flow` and `Impact`.** They are a map, not an obligation, so changing them is not
renegotiation - but a map that no longer matches the road is worse than none, because the next
reader trusts it. Take a different path and the hop changes, in the commit that takes it. The rule
is the same as `Landing`'s and for the same reason: written afterwards it describes what you
happened to do, which is the failure mode of every architecture document that ever went stale.

A hop you *add* is worth a second look before you write it. Reaching a fifth module in a feature
scoped to two is not a `Flow` edit, it is evidence the boundary was wrong - say so rather than
quietly extending the path.

## Tests come from the checks

Write the test from the check's claim and its concrete value. Never write a test by reading the
implementation and asserting what it currently does: that produces a test that passes under the
bug it was supposed to catch.

**Hard constraints, no exceptions:**

- Do not weaken an assertion to make it pass.
- Do not delete a test, and do not use the framework's skip / disable / pending mechanism to
  bypass a failing one.
- Do not modify a check's test afterwards to make the implementation pass.

A red proof is a stop, not a note. If a check turns out to be wrong or impossible, stop and
renegotiate with the user. The same holds for a `Landing` row the user approved that the build
proves unbuildable - they approved that shape specifically.

Extra tests beyond the proofs are welcome and there is no quota. A guard clause, a log line, a
clear error message at an edge the checks did not name: that is the work, not scope creep.

## Landing rows go in before the code

A door found mid-build did not exist when the design was confirmed, so it lands the same way that
file's rows did. Decide it yourself - stopping to ask on every one defeats the point of getting out
of your way. Then record it in `plan.md`: append the row with its literal shape and the
alternative you rejected **before the code that closes it is written**, and in that code's commit.

The timing is the mechanism. An alternative is only knowable while you are still choosing between
them; written at the end it becomes a justification of what you already wrote, which is the stale
design document `Landing` exists to avoid. Stating what the other option would have done is also
the one thing that can expose a bad decision with nobody else in the loop.

A new door that contradicts nothing already approved never stops the build.

## Commit

One coherent piece per commit, [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/):
`<type>(<scope>): <description>`, types `feat` `fix` `refactor` `docs` `test` `style` `perf`
`build` `ci` `chore`. Imperative mood, lowercase, no trailing period. A `!` marker requires a
`BREAKING CHANGE:` footer.

Validate before committing:

```bash
python3 <skill-dir>/scripts/check_commit.py --message "feat(billing): suspend on failed charge"
```

Optional git-level guard, independent of any agent:

```bash
ln -sf <skill-dir>/scripts/check_commit.py .git/hooks/commit-msg && chmod +x .git/hooks/commit-msg
```

Skip the hook if the project manages hooks its own way. Mark the check complete in `checks.md`
before the commit that satisfies it, and include that update in the same commit - a crash between
those two steps is how a resume redoes finished work.

Never add Co-Authored-By, Made-with, or any agent attribution trailer.

## How to write the code

Behavioural bias, not a checklist:

**Simplicity.** No features beyond what was asked. No abstraction for single-use code. No
"flexibility" nobody requested. No error handling for impossible scenarios. Two hundred lines
that could be fifty: rewrite them.

**Surgical changes.** Do not improve adjacent code, comments or formatting. Do not refactor what
is not broken. Match existing style even where you would do it differently. Remove only the
imports and variables your own change orphaned; pre-existing dead code gets mentioned, not
deleted.

**Push back.** Multiple interpretations exist: present them, do not pick silently. A simpler
approach exists: say so. The user's approach looks wrong: disagree honestly.

After each change, ask whether a senior engineer would call it overcomplicated. If yes, simplify
before proceeding.

## Scope guardrail

You will notice things that could be improved. Do not act on them. A bug gets surfaced to the
user; an improvement gets noted in chat or as a follow-up. The heuristic: is this in a check? If
no, do not touch it.

**Blast radius.** An approved spec authorizes local edits and local commits. `git push`,
force-push, deploy, production DB changes and any other remote or destructive operation need an
explicit go-ahead for that action, even mid-build.

## Running out of context

Two ways through it, and they are not equivalent. Automatic compaction summarises the
*conversation* and chooses for you what to drop. A handoff to a fresh builder carries the
*artifact*, at a boundary you chose. This skill is built for the second - that is why `Landing`
rows are appended before the code that closes them rather than at the end.

**Handing off.** Only on green, with every proof in the batch passing. The next builder reads
`checks.md` and the **diff of what already landed** - never a narrative summary. The diff is the
state, and it carries the hundred reversible choices that sit below the `Landing` bar: naming,
error shape, where the helper went. Those are exactly what drifts between builders and exactly
what no document records.

Then append the three `## Handoff` lines - boundary, what the user settled mid-build, what was
abandoned. They go in the artifact rather than in the next builder's prompt: a briefing written
into a prompt survives exactly one boundary, and the third builder needs the first one's.

**When compaction happens anyway,** re-read `checks.md` and the diff before continuing. You
cannot see the limit approaching, but you can see that a compaction occurred - so build the
recovery on the signal that exists.

## Then stop

When the last check of **your batch** is committed, report and stop: checks closed, commit
hashes, proof results, deviations. Do not dispatch the Verifier - that is the orchestrator's
step, after the last batch of the whole feature, over the full check set. A Verifier briefed by
the builder that just closed the final batch inherits that builder's scope even though it
inherits none of its tokens, and reports a pass over four checks that reads exactly like a pass
over forty. See [verify.md](verify.md).

## What was deliberately removed

If you are used to a per-task cycle, these are gone on purpose:

| Removed | Why |
| --- | --- |
| Granular task breakdown with `Where` / `Tools` / `Depends on` | buys ordering, not correctness, and competes with the checks for attention |
| Per-task test adequacy review with evidence tables | author self-review reproduces the author's own blind spot; the Verifier does it once, better |
| Pre-implementation assumption declaration per task | the assumptions that matter are in the spec, closed by its gate |
| The component catalogue in a design doc - `Purpose` / `Location` / `Interfaces` / `Dependencies` per class | reversible detail that goes stale with the authority of a document; the plan keeps the path, the entities, the signature and the doors, and nothing per-component |
| The `graph TD` architecture diagram, as the default rendering of the path | a picture of five boxes carries less than five lines that each say what enters, what crosses and what is handed on, and it rots silently while `Flow` is kept true through the build; a mermaid `flowchart` stays available for the case a list genuinely cannot express - a fan-out, a fork, an async hand-off |
| The `Code Reuse Analysis` table - `Component` / `Location` / `How to Use` | the inventory is already distributed through `Flow`, where each hop marks whether its module exists; what a table adds beyond that is the catalogue again, so only the decision survives, as the sentence opening `Flow` on what is reused instead of duplicated |
| The pace question (`Quick` / `Guided` / `Detailed`) and a `context.md` of its own | a meta-question spends a turn deciding how to spend turns; the elicitation rules apply always, and their output lands in the plan's `Assumptions` |
| A quota of gray areas to generate per feature | a quota manufactures questions; the surface rubric in `## Observable` is a fixed enumeration with an `n/a` escape instead, which finds items without inventing them |
| An offer to spawn sub-agents | logistics the user cannot decide better than you |
