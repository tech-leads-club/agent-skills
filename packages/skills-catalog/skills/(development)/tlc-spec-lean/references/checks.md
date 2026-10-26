# Checks

One small, frozen obligation set. Every claim carries the proof that settles it, and every
enumerated set is joined member by member, so an omission leaves an empty cell instead of a
confident sentence. Everything downstream refers to a check by number.

This file is derived from [plan.md](plan.md), not decided here. Every route's statuses in
`Surface`, every door in `Landing` and every entity in the stored shape owes a `Coverage` row or a
check. A plan section nothing points back at is dead or unproven.

## Find the real commands first

Prefer a command CI already runs. Where nothing exists for what a check needs, ask. A proof names
a specific test, not a whole suite.
Repeat `Proof:` when one test cannot settle the whole claim.

Under `Mutations:`, a `Build:` line names the repo's own build, type check and lint commands - the
ones CI or the package manifest runs over the code this feature touches - separated by `;`.
`check_proofs.py` runs them at `HEAD`: a green test suite does not show that the code compiles.
`Build: none - <why>` when the repo has none.

## What makes a check writable

- someone could observe the outcome
- it carries a concrete value - a status code, a field, a bound
- one run settles it
- you can name the proof - the test or command whose exit code decides

Missing one, ask. A vague check becomes a vague assertion that passes.

## The proof has to reach the claim

A claim about nine provider statuses is not proven by a
test that exercises two. A claim about a response at a boundary is not settled by a test that never
crosses it. When claim and proof sit at different levels, split the claim or name a second proof.

A gesture is proven by performing it: the proof opens, clicks, chooses the file, submits, and reads
the page. A label in the markup, or a request that posts the finished document, does not prove the
control.

Obligations add up. A test proves the layer where it asserts, not the layers it passes through; an
end-to-end test exercises one path through a branch table and cannot fail when another branch is
wrong.

## Coverage - the join

Every set a proof must cover gets a row, and every member is written as its own token beside the
check that proves it. A set collapsed into a sentence has no empty cell, so a member can go missing
unseen. One table-driven proof over the whole set may stand for it, with the size stated.

Walk it from the sets, not from the checks: the doors in `Landing`, the decision tables in the code,
the input space behind a claim, anything enumerated in prose.

- **Every route in `Surface` owes a row**, and its members are the statuses.
- **A binding source's controls are a set.** Its members are the controls each capture draws,
  minus what `## Differences from the source` removes, each beside a check whose proof performs the
  gesture. The capture says how it looks; the proof says it works.
- **A backend rule is one check, and its examples are the members**, the plan's strong case
  included.
- **Startup configuration is a set of places.** Each assembly that boots the app - the entry
  point, the test harness, every app that mounts the module - is a member. Prefer one shared
  assembly both paths use.

Write the count and its denominator; `-` in `Unproven` is earned by the row beside it.

**A screen criterion's check cites the same capture files**, never a list of the screen's labels.
Its proof is the comparison, not a test:

```markdown
**C40** - The Administrator view matches `.specs/features/<f>/captures/admin.png` (AC 49)
Proof: browser - reach the state, save `captures/admin.running.png`
```

Checks that end in the same captured state name the same file. A state no capture draws gets no
picture: its proof is a test, or `walk` when only a visit shows it. So does an existing screen the
feature does not change, reached through the nav: the author's `**Walked:**` line names the visit.
[SKILL.md](../SKILL.md) rule 9.

```markdown
**C41** - The nav still opens Items (AC 2)
Proof: walk - open Items from the nav
```

## Swept - the nine dimensions

The plan covers what somebody thought of; this list covers what nobody writes down. Each dimension
lands on a check, on `existing - <the guard that already covers it>`, or on `n/a - <reason>`. A
dimension that needs a product answer is a question, never a check you invented.

| Dimension | What to cover |
| --- | --- |
| validation | limits, formats, sanitization; a URL the server fetches for a user. A limit that only disables a control also needs the request that skips it |
| failure modes | timeouts, partial saves, rollbacks |
| idempotency | safe retries, dedup keys |
| authorization | who can call what, throttling; a lookup that reveals people |
| concurrency | races, ordering guarantees |
| data lifecycle | TTL, deletion, backfill; what a user entered comes back unchanged after save, reopen, save |
| dependency failure | fallbacks when an external call fails |
| state transitions | valid transitions, guards |
| observability | logging, metrics, tracing |

Concurrency and observability hide best; neither is visible until it fails. A landing must
observe that dimension: a duplicate rejected because a row exists says nothing about two requests
arriving at once.

## The level of each proof

Prove each rule at the level the repo's `AGENTS.md` or test docs name for that layer. Where they name
none, a rule that changes an outcome - a dispatch over a status, a boundary, a state transition, a
mapping with more than one row, a guard, an order - gets a test at its own layer, and code that only
forwards its arguments gets none of its own: a test over it re-asserts the framework.

## The mutation count

The first line under the title is `Mutations: N`, 0 to 5, copied from the project's `AGENTS.md`
(`mutations:`), `3` when it declares none. Screens take no mutation. What the count does and does
not change: [SKILL.md](../SKILL.md) rule 6.

## Template: `.specs/features/<feature>/checks.md`

````markdown
# <Feature> checks

Mutations: 3
Build: `<build command>`; `<lint command>`
Plan: `.specs/features/<feature>/plan.md`

## Intent

<Only when there is no plan.md: the problem in the present tense, then what is different for a
user when this ships.>

<N checks in M slices · K one-way doors · Q open, of which B block>

## Checks

### S1 - <slice>

**C1** - A failed charge sets status to Suspended, never Cancelled (AC 1)
Proof: `bin/rails test test/billing/dunning_test.rb -n "/failed_charge_suspends/"`

**C2** - Every provider status maps to exactly one local status (AC 4)
Proof: `bin/rails test test/billing/status_map_test.rb -n "/every_provider_status/"`

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| provider status -> local (9) | C2, table-driven over all 9 | - |
| webhook event types (5) | `paused` C12 · `updated` C13 · `deleted` C14 · `trial_will_end` C15 · other C16 | - |
| grace period rule, AC 3 (3 examples) | day 6 C8 · day 7 C8 · day 8 C8 | - |
| source controls: `<screen>` (<n>) | `<control>` C<n> · `<control>` C<n> | - |
| `POST /webhooks/provider` statuses (3) | 200 C3 · 409 C7 · 422 C16 | - |
| startup config: raw request body (2 assemblies) | app entry point C17 · test harness C3 | - |

## Swept

- validation: C5
- failure modes: C1
- idempotency: C3
- authorization: existing - <the guard that already covers this>
- concurrency: C7
- data lifecycle: n/a - <why it does not apply>
- dependency failure: C6
- state transitions: C1, C2
- observability: n/a - no logging requirement in this slice

## Handoff

<The run's live state. A compaction gives no warning, so each line is written as it happens:>

- **Settled mid-build:** <each answer the user gave while building, in their words, the turn it came - or none>
- **Dispatched:** <each sub-agent before it is sent: Verifier, screens round 1 or 2 - at which `HEAD`, and `returned` when it is back>
- **Boundary:** C1-C7 closed at `<sha>`
- **Abandoned:** <tried, discarded, and why>
- **Walked:** <only with a screen: what you did, what the page showed, how the user reaches each state, and each visit a `walk` check names>
````

With no plan.md, add `## Out of scope` with the excluded capabilities and why.

## Gate, then keep going

Run `python3 <skill-dir>/scripts/validate_checks.py <feature>`; it checks structure, and whether
each proof is the right one stays yours. Then continue into [build.md](build.md) without waiting.
Stop only for scope the sweep raised, a derivation that contradicts the approved plan, or a
writability gap asking did not resolve.
