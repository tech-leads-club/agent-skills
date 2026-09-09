# Verify

**Goal:** an independent answer to "is every check actually proven?", written as evidence rather
than as an opinion.

This is the only mechanism standing between "done" and a self-report, so it is never prompted,
never optional, and never skipped because the author feels confident.

## Author is not verifier

The agent that wrote the code is the author. The Verifier is a **fresh sub-agent** with no
inherited context, mental model or assumptions - an author re-checking their own work reapplies
the thinking that produced the gap, and a self-check can only test what the author still
remembers.

**Dispatched by whoever holds the whole feature, never by a builder.** A fresh context is not
independence on its own: the parent writes the brief, so a Verifier spawned by the agent that
just closed the last batch inherits that agent's *scope*. It gets pointed at the last batch, and
a pass over four checks reads exactly like a pass over forty. The range is
`<feature base>..HEAD` and the set is **every** check in `checks.md`, whoever wrote them.

The verdict goes back to the orchestrator and the user, never to a builder. A FAIL returned to
the author is the author deciding what to do about the author's own work.

**It receives:** `plan.md`, `checks.md`, every source the plan marks binding, the diff range, and
this file. It runs read-only over the real tree and fixes nothing. The plan is an input because
half the enumerations it sweeps for - a route's statuses, an entity's constraints - are named
there and only *owe* a row in the checks.

**No sub-agent mechanism available?** Then run this file as a fresh-eyes pass in a new session -
re-read the plan, the checks and the diff from scratch - and write `Verifier: self-verified
(degraded - no sub-agent)` in the report. The script flags it, which is the point: a degraded
gate that is visible is worth more than one that pretends.

## Read the profile first

`checks.md` carries a `Profile:` line, and `light` is the default. Step 1 runs under `ui`. The
`Coverage` recompute, the `Test policy` verdicts and fault injection run under `standard` and
`ui`. Everything else runs always: the proofs at `HEAD`, each named test shown to exist and have
run, one located assertion per check, the level and sampling judgment, and the `Swept existing`
re-read.

**The report's profile must be the one `checks.md` was approved under, and the gate compares
them.** A report declaring a cheaper profile than the feature was approved under makes a whole
step disappear with nothing to see, which is worse than a FAIL: a mismatch is an error, not a
preference. Under `standard` the report owes a `## Faults injected` section and a `## Coverage`
section; under `ui` it also owes `## Binding sources`; where `checks.md` carries `Test policy`
rows, it owes a verdict on them. A step that produced no section did not run, and requiring the
section is what makes "skipped" distinguishable from "forgotten".

A step whose input is absent is a line, not an investigation: no binding source, no set row, no
`Test policy` section - say so in the section and move on.

## 1. Check the checks against their binding sources (`ui`)

Every other step measures the code against the checks, so a check that is wrong validates cleanly
and each later step confirms it. No rigour further down catches this, because both ends of every
later comparison were derived from the same mistaken artifact.

Open every source the plan marks **binding** and compare it against the checks and against the
plan's `Surface`, `Relations` and `Landing`. A URL sitting in `Sources` is not the same as having
opened it. The plan gives this step something concrete to compare - a route with its statuses, an
entity with its constraints - instead of only the claims derived from it.

**This is a narrow comparison, not a review of the product.** You are looking for a check that
contradicts a binding source on something that source decides concretely: a state the design
draws as a band on an existing screen that a check turned into a screen of its own, a label the
design fixes that a check spells differently, a status a contract names that a check maps
elsewhere. You are never asking whether the work is worth doing. A contradiction is a finding; a
preference is not.

A check that contradicts a binding source is a finding even with a green proof, and it outranks a
failing one: a red test says the code disagrees with the checks, this says the checks disagree
with the decision, and the build ships the second faithfully.

**A check nobody wrote contradicts nothing, so comparing cannot find it.** Enumerate instead: per
screen, list what the design decides that a selector reaches - which controls and indicators are
present, which absent, their order, their count, what they read, and **how they are arranged**:
how many regions the screen has and what sits inside what. Confirm each has a check. An element
with no check is a coverage gap; an element the code renders that the design does not draw is the
same finding facing the other way.

**Arrangement is the one this step keeps missing.** A screen can pass every label, count and
order check and still be a different composition - a ring where the design draws a bar, one column
where there are two. Those are selector-reachable and not exempt, so a screen whose checks are all
copy and no structure is a finding even when each is green. Where the repo has a design system,
hold the design to structure and hierarchy and the system to the values: a colour that differs
from the mock is correct if it came from a token.

**An exemption that does not enumerate is a gap, not a limitation.** The checks may put spacing,
colour and type weight out of reach, named against the screen they belong to. They may not say
"visual fidelity is unproven" and stop - that sentence also covers everything a selector could
have reached. Treat a blanket clause as a finding, then enumerate what it was covering.

## 2. Run every proof

Run them yourself at `HEAD`. Never trust a report that the author already ran them.

**One invocation for the whole target, not one per proof and not one per file.** Runners take many
files and many name patterns in a single call - `bin/rails test a_test.rb b_test.rb -n
"/one|two/"`, `pytest f.py g.py -k "one or two"`, `jest --testPathPattern` with one
`--testNamePattern` alternation. Batching per *file* is the mistake that looks like batching: forty
checks across twelve files is twelve process starts, and the process start is the cost.

The guarantee is unchanged as long as **each named test appears in the output individually** as
having run and passed. What is forbidden is substituting a verdict for a result: "the suite is
green" settles no single check.

Then confirm each named test **exists and ran**. A filter matching nothing exits zero on several
runners - `passWithNoTests` and its equivalents - which would be a green check with no test behind
it. Show the hit; a name that appears nowhere in the tree is a finding.

Do that lookup with `rg -n` and enough context to carry the test body rather than by reading the
file. The same hit that proves the test exists yields the line numbers step 3 has to cite, so it is
one search instead of two. One pass per file, not per check.

Two more things while you are there. A proof that resolves only to a test the feature never touched
proves nothing about the new behaviour - check the diff. And a proof that went green at an earlier
commit says nothing about the current one.

## 3. Check the assertion, not its presence

For each check, confirm the assertion targets the **check-defined** value, not merely that an
assertion exists. Cite `file:line` and reproduce the assertion expression.

**The assertion expression is the whole evidence. Do not go read the test's world.** Fixtures,
setup, factories and helpers are not yours to walk: a claim naming `409` is settled by
`assert_response :conflict` sitting next to it. This is the per-check cost that makes a 40-check
review outlast the build it reviews, and it buys almost nothing.

Where the expected value is *not* readable at the assertion - `assert_equal expected, actual` with
`expected` built three files away - that is a **finding about the test**, not research you owe. Say
so and move on.

Cite the one or two assertions that **settle** the claim, not every assertion in the test. Setup
lines earn a citation only when the claim names the precondition.

**Evidence or zero.** A check with no located `file:line` counts as not proven - per check, never
one citation standing in for twenty. Search before concluding something is absent, and show the
search.

**Recompute the `Coverage` join rather than reading it** (`standard`, `ui`). A join you only read
is the author's self-report with a table around it, which is precisely what `light` gives up. For each row, take the members from the code itself and confirm
each has a proof that asserts it; then sweep both artifacts for sets they never gave a row at all -
every enumeration named in the plan's `Landing`, `Relations` or `Surface`, in the level evidence,
or inside a claim. A route in `Surface` whose statuses got no row is the common one. A member with no
proof is a coverage gap, and a member named in the artifact's own prose with no proof anywhere is a
worse one, because the author saw it and the table hid it.

**Take the members from whatever holds authority over that set, which is not always the code.** A
provider's statuses come from the provider and a framework's routes from the framework - there the
code is where the set is discovered. But a set the code is meant to *satisfy* has its authority
outside it: the screens a design draws, the fields a contract declares. Recomputing those from the
code asks the author's own output whether the author's own output is complete, and it answers yes
every time.

For a startup-configuration row, read each assembly directly - open the file that constructs it and
show the line. A suite that boots its own assembly structurally cannot fail on another one, so a
green proof there is evidence about the test's assembly and nothing else.

Two more, mechanically: a claim about nine cases proven on two is a coverage gap; and a claim naming
a status code, route or response shape whose proofs all sit below that boundary is a **level gap**,
no matter how many assertions it carries.

**Judge the level against the `Test policy` rows whenever the artifact carries them** (`standard`,
`ui`). Those rows are the bar the author built under, and that section exists precisely because the
repo's conventions were found not to answer - deferring to the conventions instead measures the
build against the weaker ruler. Give each row a verdict: for every file it classifies, is the
required proof there, and does it assert what the coverage expectation demands? A row nobody met is
a finding even when every check is green. Only where the artifact carries no such section does the
repo's own convention decide.

Where the checks left a value imprecise, record a **precision gap** rather than passing a vague
assertion - that is a finding about the checks, and the most useful thing this step produces.

Read the `Swept` rows that resolve to **existing** against the code: is the constraint they cite
actually there? A cited constraint that is not there is a finding. Rows that say `n/a` are policy
the user approved; there is nothing in the code for them to be wrong about.

## 4. Inject faults (`standard`, `ui`)

A green suite proves the tests run. Fault injection proves they can catch a regression - it is
the only step that produces that information, and under `light` it does not run, which is what
that row of the profile table means by "a test that would pass under a wrong implementation".

1. **Isolate.** `git worktree add <scratch> HEAD`. Never mutate the real tree, and **never use
   `git stash`**: it records state from *before* the mutation, so popping it does not reverse a
   fault applied afterwards, and on a clean tree it creates no entry at all.
2. **Baseline.** Record `git status --porcelain` of the real tree first.
3. **Inject a behaviour-level fault** in the new code: flip a condition, change a returned value or
   status, shift a bound by one, remove a required side effect.
4. **Run the narrowest covering proof** in the scratch and confirm it FAILS - the mutant is killed.
5. **Discard** the scratch and confirm the real tree's porcelain matches the baseline. If it
   differs, STOP, restore the tree, and treat the run as invalid.

**One fault per distinct assertion surface, not per risky line.** Three mutations killed by the same
two proofs ran the same experiment three times. Choose faults that force *different* proofs to fail,
stop once every proof carrying a check has been made to fail once, and cap it at five however risky
the feature looks - a quota that scales with risk costs most exactly where checks cluster in risky
code. A second covering proof per fault adds a run and no information. Use real mutation tooling
where the stack has it (Stryker, mutmut, cargo-mutants, pitest): it gets many mutants from one run.

**A surviving mutant is a finding, not a footnote.** It means the assertion would pass under a
plausible wrong implementation.

## 5. Walk the flow with the user (user-facing only)

Only where human judgment decides the outcome - a UI flow, an interaction pattern. Backend and
infrastructure work is settled by the checks. Present one test at a time, expected outcome stated,
and log anything that is not a clear pass verbatim. Infer severity from the words, never ask for it:
crash / error / exception → blocker; doesn't work / wrong / missing → major; slow / weird / off →
minor; colour / font / spacing → cosmetic; unclear → major.

## 6. Report

Write `.specs/features/<feature>/verification.md`. Lead with the verdict.

```markdown
# <Feature> verification

**Verdict**: PASS
**Profile**: standard
**Diff range**: <base>..<head>
**Round**: 1 - full
**Verifier**: independent sub-agent (author != verifier)

## Binding sources

| Source | Opened | Contradiction | Uncovered |
| --- | --- | --- | --- |
| design `03` overview | yes - artifact URL | none | - |

## Checks

| Check | Claim | Proof run | Evidence | Result |
| --- | --- | --- | --- | --- |
| C1 | suspends, never cancels | `bin/rails test ... -n "/failed_charge_suspends/"` exit 0 | `test/billing/dunning_test.rb:118` - `assert_equal "suspended", sub.status` | PASS |

## Coverage

| Set (size) | Recomputed from | Member -> proof | Unproven |
| --- | --- | --- | --- |
| provider status -> local (9) | provider docs | C2, table-driven over all 9 | - |

## Test policy rows

| Row | Files it classifies | Required proof | Expectation met |
| --- | --- | --- | --- |
| Decides, reached across a boundary | `subscription.rb` | boundary C1 · own layer C2 | yes |

## Faults injected

| Mutation | Location | Killed |
| --- | --- | --- |
| returned status `suspended` -> `cancelled` | `subscription.rb:88` | yes |

## Gate

`<command>` - <N> passed, 0 failed
```

A non-empty `Contradiction` or `Uncovered` cell, a `Killed` cell reading `no`, a non-empty
`Unproven` cell, a check whose `Result` is not PASS, or an unmet `Test policy` row all mean the
verdict is FAIL. The gate script reads those columns and refuses a PASS its own rows contradict,
so do not soften a row to fit a verdict - change the verdict.

Then run the completion gate and return a compact verdict in chat:

```bash
python3 <skill-dir>/scripts/validate_verification.py <feature>

`0` is a report that was read and held up. `1` is a report its own rows contradict. `2` is
**gated nothing** - the feature or the report could not be resolved - and it is not a pass:
name the feature explicitly rather than letting it search.
```

```markdown
## Verification: <feature> - PASS

**Checks**: 12/12 proven with located evidence
**Coverage**: 5 sets recomputed, 0 members unproven
**Faults**: 4 injected, 4 killed
**Gate**: 138 passed, 0 failed
**Report**: `.specs/features/<feature>/verification.md`

**Ranked gaps** (if FAIL):
1. <gap> - <check id> - <file:line or "no evidence">
```

## What fails the feature

A FAIL, a surviving mutant, an unmet `Test policy` row, a check contradicting a binding source, an
element or an **arrangement** a binding source decides that no check covers, a blanket exemption in
place of an enumerated one, a binding source recorded as opened that nobody actually saw, an
unproven coverage member, or any check without a located `file:line`.

**A composition finding fails at the same weight as a wrong label**, and that has to be said because
it does not feel that way: a missing substring in a CTA reads as a defect while "this screen is a
different composition" reads as feedback. The second is the larger failure and the one that survives
to production, so it carries a FAIL to the last round rather than softening into a note.

Route gaps back to an implementer as fix work and re-verify, bounded to **three** rounds before
escalating to the user.

## Re-verifying after a fix

A later round is scoped by two things: **the fix's diff, and every verdict that was not PASS.**
Anything else carries forward. Re-running the whole review to reconfirm what a fix could not have
touched is the cost the three-round bound multiplies by three.

Two rules make that safe. **Proofs always re-run in full, at the new `HEAD`** - green is a property
of a commit, and batched by target that is two invocations. And **everything carried forward says
where it came from**: each section marks itself `verified at <sha>` or `carried from <sha>`, and the
header reads `Round: 2 - scoped`. Silent inheritance is the self-report problem wearing a table
again.

Then scope by the diff, not by the fix's intent - a fix to a shared helper, a fixture or a config
has a wider blast radius than its description:

- **Faults** (`standard`, `ui`)**:** re-inject on the surfaces the fix touched, and on any it
  created. A fix that *adds* an assertion is the common case, and its new surface has never been
  made to fail once.
- **Coverage** (`standard`, `ui`)**:** recompute the rows whose authority the fix touched. A fix
  that adds a branch adds a member.
- **Citations:** refresh the files the fix touched; line numbers move.
- **`Test policy` rows:** re-judge the unmet ones, plus any row classifying a touched file.
- **Step 1:** only where the fix touched the interface, and only for those screens.

## 7. Distill lessons

The closing action, immediately after the report is written. Turn each grounded failure - a
surviving mutant, a precision gap, a failed check, an unproven member - into one reusable
project-local lesson via `scripts/lessons.py`. A clean PASS records nothing, and that is correct
rather than a miss. Commands and phrasing rules: [memory.md](memory.md).
