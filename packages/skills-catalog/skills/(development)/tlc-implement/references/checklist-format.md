# Checklist format

Load this file only when writing `.checks/<feature>.md` — after the source is read, the refuse gate is passed, and the sweep is walked. Do not load it during the first pass of Extract.

Replace every placeholder with a concrete value, or omit the section. A heading with "N/A" under it does not appear.

## Template

Write `.checks/<feature>.md`:

```markdown
# <Feature>

Sources:

- <ticket URL, document path, or "conversation"> - <what it settles>
- <design / screens> - **binding for the interface**: screens <ids>

## Out of scope

- <excluded capability> - <why>

## Landing

<Two or three lines: which modules this touches and what it reuses instead of duplicating.>

| One-way door | Literal shape | Alternative rejected |
| --- | --- | --- |
| `subscription.status` gains `Suspended` | enum value, not null, existing rows backfilled to `Active` | a boolean `is_suspended` - cannot express the next state |
| Provider status mapping becomes a module-level table | `map(providerStatus) -> localStatus`, total over the provider's 9 values | an inline switch per call site, the convention today - it drifts silently when the provider adds a status |

- Nothing else in this change is hard to reverse

## Checks

### S1 - Suspension on a failed charge · 4 files · 38 KB · ~10k

**C1** - A failed charge sets status to Suspended, never Cancelled
Proof: `pytest tests/billing/test_dunning.py::test_failed_charge_suspends`

**C2** - Every provider status maps to exactly one local status
Proof: `pytest tests/billing/test_status_map.py::test_every_provider_status_maps`

### S2 - Webhook ingest · 9 files · 140 KB · ~35k

**C3** - Retrying the same webhook delivery id changes nothing
Proof: `npm test -- -t "retry is idempotent"`

## Swept

- validation: C5
- failure modes: C1
- idempotency: C3
- authorization: existing auth guard already covers this route
- concurrency: C7 - second concurrent start returns 409
- data lifecycle: not in scope - nothing is retained
- dependency failure: C6
- state transitions: C1, C2
- observability: not in scope - no log requirement in V1

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| provider status -> local (9) | C2, table-driven over all 9 | - |
| webhook event types (5) | `paused` C12 · `updated` C13 · `deleted` C14 · `trial_will_end` C15 · other C16 | - |
| `trialDays` bound (4 edges) | 0, 1, 30, 31 all in C5 | - |
| `Suspended` transitions (3) | into it C1 · out to `Active` C6 · out to `Cancelled` C7 | - |
| startup config: raw request body (2 assemblies) | app entry point C17 · test harness C3 | - |

- Claims naming a status code, route or response shape: C7, C12, C16 - each has a proof
  that crosses the boundary
- No other check claims more than the single case its proof exercises
```

**Sources** is a list because what feeds this is a list. A task normalises several documents - a ticket, a PRD, a design, a branch - and a single-line field quietly keeps the ones that look like documents. Carry every source the upstream artifact names, each with what it settles, and mark the design as binding for the interface. Losing one here is a failure of Extract rather than a formatting preference: what does not cross into this file stops existing for whoever builds, and the design is the usual casualty, because it is the only source that is not prose.

`Landing` carries the doors this change closes and nothing else. A door is one-way when reversing it costs more than a refactor: a persisted schema, a contract someone else consumes, a new dependency, a data backfill - and a pattern the codebase does not have yet, because precedent stops being reversible once the next features have copied it. Each row shows the **literal shape** the next person will copy and what you rejected, named with the property that disqualified it: "cleaner" cannot be argued with, "cannot express the next state" can. Where the choice was forced rather than compared, name the constraint that forced it; where two options were live, give each one a row. For a pattern the rejected option is the convention already in the code. Decomposition inside a convention that already exists is not a door: it is reversible at the cost of a refactor, and writing it down produces exactly the design document that goes stale and then misleads. `None - <why nothing here is one-way>` is a complete answer, and the closing line is what makes the omission contestable.

That deferral is what keeps this skill from emitting a design document, and it presupposes something to defer to. Where there is no convention to read, both halves are empty at once - nothing written down and nothing to inherit - and the work belongs in a flow that does design before this one starts.

Where the repo already keeps a decision log or ADRs, append the rows that outlive this feature there once the checklist is approved - the checklist stops being read after the merge, and a choice with its rejected alternative keeps its value long after the code has moved. Do not start a log for this skill.

**Checks group under the slices they came from.** The upstream task already cuts the work into slices of one observable outcome each; flattening them into `C1..Cn` loses a structure the source had and that `## Handoff` later refers to by name. Keep the slice, keep its name, number the checks straight through.

Each slice heading carries its **size**, and the arithmetic is `wc -c` on the files that slice touches - the ones its checks land in, which `Landing` and your own walk already named - divided by four. That is a floor: it counts what you will read, not the iteration on top, which is the larger and less predictable half. It is still worth writing, because ranking slices by weight is the decision, and a floor ranks correctly even when it under-counts.

A check is **one** observable claim. If you need "and", split it. The proof must name a specific test, not a whole suite - a suite going green says nothing about *this* claim. Repeat `Proof:` when one test cannot settle the whole claim, and every proof listed must be green.

Read the code before choosing the proof, then check the claim against the input space behind it. A claim about nine provider statuses is not proven by a proof that exercises two - that gap needs a second proof, and it is a question about coverage rather than about test style.

The proof also has to be able to **reach the claim's subject**. A claim phrased as a response at a boundary is not settled by a test that never crosses it, and a claim about a decision table is not settled by one path through it. When the claim and the proof sit at different levels, either split the claim or name the second proof - never let the level slide to whichever one is cheaper to write.

**The level is the project's call, not this skill's** - but a proof settles the layer it asserts at, never the layers it passes through, so a claim proven at the boundary leaves the decision table behind it unproven. Follow what the repo declares - `AGENTS.md`, contributing docs, testing guidelines - and where its declaration does not say which code must be proven at which level and how deeply, derive that from the shape of the code, propose it with the checklist, and write the approved rows into the repo's own guidelines so the next run inherits them - under `standard` or `ui`, following [test-policy.md](references/test-policy.md); under `light` follow the repo and leave the gap unclosed, which is one of the things that profile buys you. Never impose a pyramid the codebase does not have, and never read a thin existing suite as the bar for logic it does not cover.

`Coverage` answers the sampling question in writing, while it is still cheap to act on. It is a **join, not a summary**: every set a proof must cover gets a row, and every member of that set is written as its own token beside the check that proves it. A set collapsed into a sentence - "dispatches over paused, updated, deleted and trial_will_end" - has no empty cell, so a member can go missing while the sentence still reads perfectly. That is how a branch named in your own evidence ships unproven. One proof that is table-driven over the whole set may stand for it, with the size stated, because there the enumeration lives in the test.

The rows are not a new inventory - they are the enumerations this artifact has already named somewhere: a door in `Landing`, a decision table in the test-policy evidence, the input space behind a claim. Anything you enumerated in prose owes a row here, which is the point: the two places have to agree, and only one of them can hide a member.

Walk it **from the sets, not from the checks**. Summarising the checks you just wrote can only find a check with nothing behind it; it cannot find a name with no check, which is the failure that costs. And state the gap as members rather than as an absence: `deleted` sitting in the `Unproven` column is contestable by anyone reading, while "nothing is missing" can only be checked by redoing the entire allocation, so nobody does. Never assert a negative here - write the count and its denominator, and let `-` be earned by the row beside it.

**Startup configuration is a set too, and its members are places.** A test suite assembles the application itself, so anything this change needs to be true before the first request arrives now lives in every assembly separately - and a proof can only ever assert the one it built. Each assembly is a member, including every app that mounts the module, so the size of the row is the number of assemblies rather than always two. The member is the place and never the value: the failure is not a wrong value, it is a value present in one assembly and absent from another, and a row whose member is the setting collapses into a single cell that cannot be empty.

Two resolutions count - a proof at each place, or one shared assembly both paths use. Prefer the second: it deletes the seam instead of testing it twice, and a row with two members is already the argument for collapsing them. When the setting already lives in exactly one place both paths share, no row is owed, and that is the better state rather than a loophole. A proof that passes only because the test assembles the system differently from production is **assembly substitution** - the same family as the level substitution in [test-policy.md](references/test-policy.md), and invisible to every coverage policy there is, because the branch *is* covered and only the assembly differs.

Under `profile: ui` the designed screens are a set too, with a row of their own - [screens.md](references/screens.md) has its shape.

The last two lines close the level gap the same way. List every check whose claim names a status code, a route or a response shape; each of them needs a proof that crosses the boundary. Writing the ids down is the whole mechanism: a check claiming a `400` while all its proofs sit below the boundary has to appear in that list, and the line is then false on its face.

Find the real commands first: read the package manifest, the task runner and the CI workflows. Prefer a command that already runs in CI. When nothing exists for what a check needs, ask - never invent a command, because a proof that cannot run is worse than none.

Then write the checklist and keep going into Build. Waiting for approval by default buys nothing when someone already decided the source and the checklist mostly restates it.

**What keeps it reviewable is the ordering, not a commit.** The artifact is complete before you touch code, so it reads as what you were building toward rather than a rationalisation of what you built. Where the project tracks `.checks/`, that ordering is worth a commit of its own before any code; where the project ignores it - which is common, and correct for a working artifact the skill says stops being read after the merge - the ordering still holds and nothing about it depends on git.

Stop only for what the user alone can settle: a `Landing` door with a live alternative - a forced choice needs no permission, a chosen one does; scope the sweep raised that would grow the work; anything the refuse-rather-than-guess door caught that asking did not resolve; and writing test-policy rows into the repo's guidelines, which you build under either way. Stop at the artifact when the request asked for the checklist alone.
