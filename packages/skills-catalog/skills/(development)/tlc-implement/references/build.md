# Build

Deliver what the user asked for, at the quality you would sign. The checks are the floor and the
evidence, not the target; the route is yours. No task list and no per-task review tables. The bar
is [SKILL.md](../SKILL.md) rules 2, 3 and 6.

## Build against the source

When the plan marks a source binding, the source is the reference, not the plan's description of
it. Where a check or a criterion disagrees with the source, ask before building that part.

## What is fixed and what is yours

Fixed: the checks and the proofs each check names. Changing them is renegotiation with the user.

Yours: order, decomposition, commits, where files go, naming, error shapes, helpers. The repo's
conventions answer most of it.

In `plan.md`, `Landing`, `Surface` and the stored shape are additive: a door found mid-build gets a
row, and a row the user approved is not rewritten. The path and `Changes underneath` in `Shape` are
kept true: take a different path and change the hop in that commit. A fifth module in a feature
scoped to two means the boundary was wrong; say so.

## Tests come from the checks

Write each test from the check's claim and its concrete value, not from the implementation. A red
proof is a stop. If a check or an approved `Landing` row turns out wrong or unbuildable, renegotiate
with the user. Extra tests are welcome.

## A door found mid-build

Decide it yourself, then append the row to `Landing` with its literal shape and the rejected
alternative before the code that closes it, in that code's commit. Written afterwards, it becomes a
justification. A new door that contradicts nothing approved does not stop the build.

## Commit

Follow the repo's commit convention. Where it has none, use
[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) and validate each
message:

```bash
python3 <skill-dir>/scripts/check_commit.py --message "feat(billing): suspend on failed charge"
```

When a slice's proofs are green, mark its checks complete in `checks.md`, and commit `.specs/` with
the slice when the repo tracks it. No Co-Authored-By, Made-with or other agent trailer unless the
repo asks for one.

## How to write the code

Surgical: do not improve adjacent code or formatting, and remove only what your change orphaned.

## Scope

Outside the plan's scope, do not touch it: surface a bug, note an improvement. Inside it, nothing
is missing: what a control needs to work for real is the work even when no check names it. Pushes
and deploys: [SKILL.md](../SKILL.md) rule 8.

## Before you stop (features with a screen)

Green proofs do not show that a person can do what the plan promised, or that the screen looks like
what was asked for. Open the running app and do what the plan promises as the user would, screens
that share the state you changed included. If you cannot reach the app, hand the
steps to the user.

Save each state a capture draws beside it as `<capture>.running.png`, taken in a browser window at
the capture's size - its pixel size over its scale - so the page lays out as the capture does; an
image resized afterwards does not. Name the file in the proof. It matches the capture except for
what `## Differences from the source` lists. A state no capture draws gets no picture; a `walk`
check is a visit you name in the `**Walked:**` line, which also says how the user reaches each
state.

Something broken that a check covers is a red proof you missed: fix it. Something broken that no
check covers is a missing obligation: append a check with its proof, say so, then fix it. A
difference from a capture is fixed, not turned into a check.

## Then stop

What the user settles while you build goes on the `**Settled mid-build:**` line in the turn they
say it, in their words - a compaction drops the chat, not the file. When you stop, append to
`## Handoff` in `checks.md`: boundary, what was abandoned, the walk. Report checks closed, commit
hashes, proof results and deviations.

Run `python3 <skill-dir>/scripts/check_proofs.py <feature>`; a red row goes back to the build. Then,
if you hold the whole feature, dispatch in this turn and in parallel the screens sub-agent when a
criterion cites a capture ([verify-screens.md](verify-screens.md)) and the Verifier
([verify.md](verify.md)), each written on the `**Dispatched:**` line with the `HEAD` before it is
sent and marked `returned` when it is back. When both have returned, fix everything they name in
one pass, rerun `check_proofs.py`, and when the fix changed code,
re-save every picture at the new `HEAD` and resume the round-1 screens sub-agent for round 2 (a
fresh one only when it cannot be resumed) - it is the last. Write each finding's closing commit, then run the gate. A commit that changes code after
round 2 leaves a screen nobody judged: the gate says so, and it goes to the user. Close only when
every sub-agent you dispatched has returned, and open the report with the gate's last line.
