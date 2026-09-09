# Checks

**Goal:** one small, frozen, external obligation set. Every claim carries the proof that
settles it, and every enumerated set is joined member by member, so an omission leaves an empty
cell instead of a confident sentence.

This is the artifact everything downstream refers to by check number: a proof, a review
comment, a question, a fault. It replaces a task breakdown - it says what must be true, never
how to work.

**It is derived, not decided.** [plan.md](plan.md) settled what must be true and what is being
built; this turns both into obligations with proofs.
So the shape - the path, the entities, the interface, the doors - is not written here and not
re-argued here. What *is* this file's job is the derivation, and it is where omissions surface:
every route's statuses in `Surface`, every door in `Landing`, every entity in `Relations` owes a
set row in `Coverage` or a check. A shape section with nothing pointing back at it from here is
either dead or unproven, and both are findings.

## Find the real commands first

Read the package manifest, the task runner and the CI workflows. Prefer a command that already
runs in CI. Where nothing exists for what a check needs, ask - never invent a command, because
a proof that cannot run is worse than none.

A proof must name a **specific test**, not a whole suite. A suite going green settles no
individual claim. Repeat `Proof:` when one test cannot settle the whole claim; every proof
listed must be green.

## What makes a check writable

Four things must be true before you write one:

- someone could **observe** the outcome - if you cannot say what would be seen, it is too vague
- it carries a **concrete value** - a status code, a field, a bound
- **one run settles it** - a single execution either satisfies it or does not
- you can name the **proof** - the test or command whose exit code decides

Missing one is normal and asking is cheap. Proceeding on a guess is not: a vague check becomes a
vague assertion that passes, which is the failure this whole artifact exists to prevent.

## The proof has to reach the claim

Read the code before choosing the proof, then check the claim against the input space behind it.

A claim about nine provider statuses is not proven by a test that exercises two - that gap needs
a second proof, and it is a question about coverage rather than about test style. A claim phrased
as a response at a boundary is not settled by a test that never crosses it. A claim about a
decision table is not settled by one path through it. When the claim and the proof sit at
different levels, either split the claim or name the second proof - never let the level slide to
whichever is cheaper to write.

**Obligations add up rather than substitute.** A test proves the layer where it *asserts*, not
the layers it happens to *pass through*. An end-to-end test that traverses a branch exercises one
path through it and cannot fail when a second branch is wrong. Treating it as proof of the code
it traversed is level substitution, and it is the most common way a green suite ships a broken
branch table.

## Coverage - the join

Every set a proof must cover gets a row, and **every member is written as its own token** beside
the check that proves it.

A set collapsed into a sentence - "dispatches over paused, updated, deleted and trial_will_end" -
has no empty cell, so a member can go missing while the sentence still reads perfectly. That is
how a branch named in your own evidence ships unproven. One proof that is table-driven over the
whole set may stand for it, with the size stated, because there the enumeration lives in the test.

Walk it **from the sets, not from the checks.** Summarising the checks you just wrote can only
find a check with nothing behind it; it cannot find a name with no check, which is the failure
that costs. The rows are not a new inventory - they are the enumerations already named somewhere:
a door in the plan's `Landing`, a decision table in the level evidence, the input space behind
a claim. Anything enumerated in prose owes a row here.

**Every route in the plan's `Surface` owes a row, and its members are the statuses.** That row
is the only thing that turns the signature you reviewed into an obligation; without it a status
listed in the plan can ship with nothing behind it, and the artifact that named it looks like
evidence that it was covered.

Never assert a negative. Write the count and its denominator and let `-` in the `Unproven`
column be earned by the row beside it.

**Startup configuration is a set too, and its members are places.** A test suite assembles the
application itself, so anything this change needs to be true before the first request arrives now
lives in every assembly separately - and a proof can only ever assert the one it built. Each
assembly is a member, including every app that mounts the module. The member is the place, never
the value: the failure is not a wrong value, it is a value present in one assembly and absent from
another. Two resolutions count - a proof at each place, or one shared assembly both paths use.
Prefer the second; a row with two members is already the argument for collapsing them.

## Test policy (`standard`, `ui`)

Only when the repo does not already answer two questions for every layer this change touches:
**which level proves this code**, and **how much of its input space must the proof assert to
count**. Do not judge whether the repo "has testing docs" - it almost always does, and that
impression is what makes this step never fire.

A statement answers neither question when it only says where tests live, how they are named, how
to run them, or how a test is built (which dependencies are real and which are doubled). Watch
for the last one especially: keying the level to whether a test uses real dependencies decides
*how* to write a test, and read as deciding *what deserves* one, every decision table that
touches a real dependency gets routed away from its own layer and is never enumerated.

Classify by the **shape of the code**, never by the name of the layer. Layer names lie.

- **Instrumentation** - the body forwards its arguments to one call, or maps one shape onto
  another with no conditional deciding the result. A test over it re-asserts the framework.
- **Decision** - anything that changes an outcome. A dispatch over a status or event type. A
  boundary or validation check. A state transition. A conditionally assembled payload. A mapping
  table with more than one row. A guard, a precedence rule, an ordering rule.

Count the decision points per file and write the number down: "dispatches over six event types,
eleven branch points" is contestable, "looks like business logic" is not. Then **name the
members**, because those names are what `Coverage` joins against.

Derive from the code, not from the current suite - a module with no tests at a level is evidence
about its history, not that its logic needs none. Judge the house pattern across the whole repo,
not the folder you happen to be changing: search for the closest analogue by code shape - the
other state machine, the other dispatcher - and cite it. A proposal pointing at a sibling proven
at that level is precedent; one that does not is taste.

State the cost. Then ask **one** narrow question: do these rows go into the repo's guidelines?
Building under them is reversible and needs no permission; writing them reaches every future
agent, so approved rows land in their own commit before the build. If the user does not answer,
build under them and leave the files alone.

## Template: `.specs/features/<feature>/checks.md`

````markdown
# <Feature> checks

Profile: light
Plan: `.specs/features/<feature>/plan.md`

## Intent

<Only when there is no plan.md - a change under three files with no one-way door: the problem in
the present tense, then what is different for a user when this ships.>

<N checks in M slices · K one-way doors · Q open, of which B block>

## Checks

Grouped by the spec's slices; numbering runs across the whole feature.

### S1 - <slice> · 4 files · 38 KB · ~10k

**C1** - A failed charge sets status to Suspended, never Cancelled (FEAT-01, AC 1)
Proof: `bin/rails test test/billing/dunning_test.rb -n "/failed_charge_suspends/"`

**C2** - Every provider status maps to exactly one local status (FEAT-01, AC 4)
Proof: `bin/rails test test/billing/status_map_test.rb -n "/every_provider_status/"`

### S2 - <slice> · 9 files · 140 KB · ~35k

**C3** - Retrying the same webhook delivery id changes nothing (FEAT-02, AC 5)
Proof: `bin/rails test test/webhooks/ingest_test.rb -n "/retry_is_idempotent/"`

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| provider status -> local (9) | C2, table-driven over all 9 | - |
| webhook event types (5) | `paused` C12 · `updated` C13 · `deleted` C14 · `trial_will_end` C15 · other C16 | - |
| `trial_days` bound (4 edges) | 0 C5 · 1 C5 · 30 C5 · 31 C5 | - |
| `Suspended` transitions (3) | into it C1 · out to `Active` C6 · out to `Cancelled` C7 | - |
| `POST /webhooks/provider` statuses (3) | 200 C3 · 409 C7 · 422 C16 | - |
| startup config: raw request body (2 assemblies) | app entry point C17 · test harness C3 | - |

- Claims naming a status code, route or response shape: C7, C12, C16 - each has a proof that
  crosses the boundary
- No other check claims more than the single case its proof exercises

## Test policy

<Only at `standard` / `ui`, and only when the repo leaves the two questions open. Omit the
section entirely otherwise.>

| Code | Required proofs | Coverage expectation |
| --- | --- | --- |
| Decides, reached across a boundary | one at the boundary **and** one at its own layer | the contract at the boundary; one asserted case per row of the decision table at its own layer |
| Decides, not reached across a boundary | one at its own layer | one asserted case per row of the decision table |
| Entry point that decides nothing | one at the boundary | accepted input, each rejected input, each error path |
| Instrumentation, pass-throughs | none of its own | covered by its consumer's proof |

Evidence:

- `<file>`: dispatches over <n> cases, <n> branch points -> decides
- `<file>`: forwards a single call, no conditional -> instrumentation
- closest analogue in the repo: `<file>`, same shape, already proven at this level with <n> cases

Cost: <n> proofs at their own layer across <n> files. Without these rows, <n> decision tables are
proven only by a path that happens to traverse them.

## Swept

Where each unwritten requirement landed. All nine, one line each, every time.

- validation: C5
- failure modes: C1
- idempotency: C3
- authorization: existing - <the guard or policy that already covers this>
- concurrency: C7
- data lifecycle: n/a - <why it does not apply>
- dependency failure: C6
- state transitions: C1, C2
- observability: n/a - no logging requirement in this slice

## Out of scope

- <excluded capability> - <why>

## Handoff

Intended split, with the arithmetic, written before any code:

- S1-S3 = 118k, all in Billing; S4 enters Webhooks at 140k -> hand off after S3

<Appended by each builder as it finishes, three lines each:>

- **Boundary:** C1-C7 closed at `<sha>`
- **Settled mid-build:** <every clarification the user gave that did not become a Landing row or an edited check>
- **Abandoned:** <tried, discarded, and why>
````

`Out of scope` is only needed when there is no plan, which already carries it - along with
everything about the requirements and the solution's shape: [plan.md](plan.md).

## Gate before building

```bash
python3 <skill-dir>/scripts/validate_checks.py <feature>
```

It fails a check with no `Proof:`, a duplicate check id, a coverage row whose declared size
exceeds the members actually assigned, a coverage row with an empty member cell, a missing swept
dimension, a swept landing left blank, and a missing `Profile:` line. It warns on a proof that
names no test selector, on a claim carrying a vague word, and - the derivation check - on a route
the plan's `Surface` names that nothing here mentions.

A non-zero exit means fix before writing code. The script checks structure; the judgment - is the
proof the right one, does the level match the claim - stays yours.

## Then keep going

Write the artifact and continue into [build.md](build.md). Waiting for approval by default buys
nothing when the plan was already confirmed and the checks derive from it. Stop only for: scope
the sweep raised that would grow the work, a derivation that contradicts the approved plan -
which sends you back to that file, not around it - anything the writability gate caught that
asking did not resolve, and writing test-policy rows into the repo's guidelines.

What keeps this reviewable is the ordering, not a commit: the artifact is complete before you
touch code, so it reads as what you were building toward rather than a rationalisation of what
you built.
