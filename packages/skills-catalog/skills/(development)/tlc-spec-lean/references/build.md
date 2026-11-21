# Build

Deliver what the user asked for, at the quality you would sign. The approved plan is what must be
true; you build it slice by slice, and the rest of the route is yours. No task list, no proof
file, no pictures kept as evidence.

## Build against the source

When the plan marks a source binding, the source is the reference, not the plan's description of
it. Where a criterion disagrees with the source, ask before building that part.

## What is fixed and what is yours

Fixed: the criteria and the `Landing` rows the user approved - changing them is renegotiation with
the user - and building one slice at a time, S1 first.

Yours: how a slice is decomposed, the order of the later slices, where files go, naming, error
shapes, helpers. The repo's conventions answer most of it.

In `plan.md`, `Landing`, `Surface` and the stored shape are additive: a door found mid-build is
decided by you and appended with its literal shape and rejected alternative in the commit that
closes it. The path, its drawing and `Changes underneath` are kept true: take a different path and
change the hop in that commit.

A choice of yours that outlives this feature - a convention, an API pattern, a change to code other
screens or modules share (the app's layout CSS, a shared helper, a route shape) - is an `AD-NNN` in
`.specs/STATE.md`, written when you make it, and `Changes underneath` cites the id
([memory.md](memory.md)). After a compaction the files are all you have: a decision only the chat
held is made again, differently.

## Slice by slice

Build the plan's slices one at a time. A slice goes through every layer its outcome needs - the
route, the rule in the tested layer, its tests, the screen - and is done when its tests are green,
a person can do it in the running app (when it has a screen), and it is committed. Then the next.

S1 comes first and stays thin: the shortest path a user can walk end to end, a tracer bullet. It
puts the contract between the layers - the API's shape against the screen that reads it - in real
use before anything is stacked on it, while a wrong shape is still cheap to change. Widen from
there, one slice per pass.

Do not build one layer for every slice and the next layer after it. A layer nobody has used looks
right until the end, where integration fails late; and a compaction in the middle of it leaves
nothing that works and nothing in git that says how far it got. When a slice the plan drew turns
out to be a layer ("the API", "the screen"), cut it again by outcome before building it.

## Tests

Write each test from a criterion and its concrete value, not from the implementation (rule 2). Each
rule the `Shape` puts in the tested layer has a test that would fail if the rule were wrong:
both sides of a filter, a tie in a sort, a match in the middle of a string. Extra tests are welcome.

Each slice's tests run green before its commit. Before the last commit, run the repo's own test,
build or type check, and lint commands - the ones its scripts, CI or `AGENTS.md` name. A command
already red before any change is not yours to fix: tell the user and say so in the report.

## Screens

Green tests do not show that a person can do what the plan promised, or that the screen looks like
what was asked for. Open the running app in a browser window at each capture's size - its pixel
size over its scale; a wider window lays the page out differently - and do what the plan promises
as the user would: click, type, filter, select - each slice as it lands. Once the slices a captured
state needs are in, put that state beside its capture and fix what differs, except what
`## Differences from the source` lists. Screens that share the state you changed must still work.
Screenshots are for you to compare; none is kept as proof. If you cannot reach the app, hand the
steps to the user.

## How to write the code

Surgical: do not improve adjacent code or formatting, and remove only what your change orphaned.
Outside the plan's scope, do not touch it: surface a bug, note an improvement. Inside it, nothing
is missing: what a control needs to work for real is the work even when no criterion names it.

## Commit

Each slice ends in its own commit before the next one starts, and the message names the slice and
the criteria it closes (`feat(billing): suspend on a failed charge (S2, criteria 3-5)`). After a
compaction, the plan read against `git log` is what tells you how far the build got; work held
only in the tree has to be re-read to be trusted.

Follow the repo's commit convention; where it has none, use
[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/). No Co-Authored-By,
Made-with or other agent trailer unless the repo asks for one. Commit `.specs/` with the code only
when the repo tracks it. When the messages are Conventional Commits, run
`check_commit.py --message "<msg>"` before each commit: a message it fails is rewritten, not
committed.

The build ends with everything committed and a clean tree (rule 4). Browser and test tools write
files while you work - snapshots, traces, reports; `check_commit.py` lists what is untracked. Delete
what a tool left behind, or ignore it the way the repo does; never commit it to get a clean tree.

What the user settles while you build goes on the plan's `**Settled mid-build:**` line in the turn
they say it, in their words.

Then send the review: [review.md](review.md).
