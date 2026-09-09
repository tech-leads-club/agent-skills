# Verify

**Goal:** an independent answer to "is every check actually proven?", written as evidence
rather than as an opinion.

This is the only mechanism standing between "done" and a self-report, so it is never
prompted, never optional, and never skipped because the author feels confident.

## Author is not verifier

The agent that wrote the code is the author. The Verifier is a **fresh sub-agent** with no
inherited context, mental model or assumptions - an author re-checking their own work
reapplies the thinking that produced the gap. It receives the checklist, every source the
checklist marks binding, the feature's diff range and this file. It runs read-only and fixes
nothing.

**Dispatched by whoever holds the whole feature, never by a builder.** A fresh context is not
independence on its own: the parent writes the brief, so a Verifier spawned by the agent that
just closed the last batch inherits that agent's *scope* even though it inherits none of its
tokens. It gets pointed at the last batch, and a pass over four checks reads exactly like a pass
over forty. The range is `<feature base>..HEAD` and the set is every check in the checklist,
whoever wrote them.

The verdict goes back to the orchestrator and the user, never to a builder. A FAIL returned to
the author is the author deciding what to do about the author's work, and the round that follows
happens inside the session the separation existed to break.

**Read the profile first** - the project declares it in `AGENTS.md`, and `light` is the default.
Step 1 runs under `ui`; the `Coverage` join, the `Test policy` verdicts and fault injection run
under `standard` and `ui`; everything else runs always. The report names the profile, so a step
that did not run is distinguishable from a step that was forgotten.

A step whose input is absent is a line, not an investigation: no binding source, no set row, no
`Test policy` section - say so and move to the next.

## 1. Check the checklist against its binding sources (`ui`)

Every other step measures the code against the checklist, so a checklist that is wrong validates
cleanly and each later step confirms it. No amount of rigour further down catches this, because
both ends of every later comparison were derived from the same mistaken artifact.

Open every source the checklist marks **binding** - the design, a contract, a spec - and compare
it against the checks and the `Landing` rows. A URL sitting in `Sources` is not the same as having
opened it, and the gap between those two is where this fails.

**This is a narrow comparison, not a review of the product.** You are looking for a check that
contradicts a binding source on something that source decides concretely: a state the design draws
as a band on an existing screen that a check turned into a screen of its own, a label the design
fixes that a check spells differently, a status a contract names that a check maps elsewhere. You
are never asking whether the work is worth doing, whether the design is good, or whether a
decision the user already made was right. A contradiction is a finding; a preference is not.

A check that contradicts a binding source is a finding even with a green proof, and it outranks a
failing one: a red test says the code disagrees with the checklist, this says the checklist
disagrees with the decision, and the build ships the second faithfully. Where a source will not
open, say what you tried and what came back, then record every check resting on it as unverified
against its source.

**A check nobody wrote contradicts nothing, so comparing cannot find it.** This step catches a
check that disagrees with the design and is blind to the element the design draws that no check
mentions - blind in the direction that matters, because absence is the ordinary failure and it
leaves no trace to notice. So enumerate instead of comparing: per screen, list what the design decides that a selector
reaches - which controls and indicators are present, which are absent, their order, their count,
what they read, and **how they are arranged**: how many regions the screen has and what sits
inside what - and confirm each has a check. An element with no check is a coverage gap. An
element the code renders that the design does not draw is the same finding facing the other way.

**Arrangement is the one this step keeps missing.** A screen can pass every label, count and
order check and still be a different composition - a ring where the design draws a bar, a block
beside the band it belongs inside, one column where there are two. Those are selector-reachable
and therefore not exempt, so a screen whose checks are all copy and no structure is a finding
even when each of them is green. Where the repo has a design system, hold the design to structure
and hierarchy and the system to the values: a colour that differs from the mock is correct if it
came from a token, and an arrangement that differs is not.

Hold this to what carries function or state: controls, indicators, navigation, the arrangement
that distinguishes this screen from the one it replaces, and the affordances for empty, loading
and error. Not every text node on the comp. One row per screen naming what is uncovered, so this
lands as a short list somebody acts on rather than a re-litigation of the markup.

**An exemption that does not enumerate is a gap, not a limitation.** A checklist may put spacing,
colour and type weight out of reach, named against the screen they belong to. It may not write
"visual fidelity is unproven" and stop - that sentence also covers everything a selector *could*
have reached, and it arrives at you looking like a limitation properly declared, which is how a
real gap gets waved through by the one step that exists to catch it. Treat a blanket clause as a
finding, then enumerate what it was covering.

## 2. Run every proof

Run the proofs yourself at `HEAD`, and never trust a report that the author already ran them.

**One invocation for the whole target, not one per proof and not one per file.** Runners take
many files and many name patterns in a single call - `bin/rails test a_test.rb b_test.rb -n
"/one|two/"`, `pytest f.py g.py -k "one or two"`, `jest --testPathPattern` with one
`--testNamePattern` alternation. Batching per *file* is the mistake that looks like batching:
forty checks across twelve files is twelve process starts, and the process start is the cost.

The guarantee is unchanged as long as each named test appears in the output individually as
having run and passed. What is forbidden is substituting a *verdict* for a result: "the suite is
green" settles no single check. Fall back to one invocation per proof only where the runner
cannot report per test, or to re-run something that failed.

Then confirm each named test **exists and ran**. A filter matching nothing exits zero on
several runners - `passWithNoTests` and its equivalents - which would be a green check with no
test behind it. Show the hit; a name that appears nowhere in the tree is a finding, not a
detail.

Do that lookup with `rg -n` and enough context to carry the test body, rather than by reading
the file. The same hit that proves the test exists also yields the line numbers step 3 has to
cite, so it is one search instead of two, and reading a 400-line spec to quote six lines of it
is where this step's cost actually goes. One pass per file, not per check - checks cluster in a
few files.

Two more things worth a look while you are there. A proof that resolves only to a test the
feature never touched proves nothing about the new behaviour - check the diff. And a proof
that went green at an earlier commit says nothing about the current one.

## 3. Check the assertion, not its presence

For each check, confirm the assertion targets the **checklist-defined** value, not merely
that an assertion exists. Cite `file:line` and reproduce the assertion expression.

**The assertion expression is the whole evidence. Do not go read the test's world.** Fixtures,
`setup`, factories and helpers are not yours to walk: a claim naming `409` is settled by
`assert_response :conflict` sitting next to it, and nothing about the fixture changes that
verdict. This is the per-check cost that makes a 40-check review outlast the build it reviews,
and it buys almost nothing.

Where the expected value is *not* readable at the assertion - `assert_equal expected, actual`
with `expected` built three files away - that is a **finding about the test**, not research you
owe. An assertion whose expected value cannot be read where it is asserted is weak on its face,
however green it runs. Say so and move on.

Cite the one or two assertions that **settle** the claim, not every assertion in the test.
Setup lines earn a citation only when the claim itself names the precondition.

**Evidence or zero.** A check with no located `file:line` counts as not proven - per check,
never one citation standing in for twenty. Search before concluding something is absent, and
show the search.

Judge the checklist's own choices too (`standard`, `ui`). **Recompute the `Coverage` join rather than reading it** -
a join you only read is the author's self-report with a table around it. For each row, take the
members from the code itself, not from the row, and confirm each one has a proof that asserts it;
then sweep the artifact for sets it never gave a row at all - every enumeration named in
`Landing`, in the test-policy evidence or inside a claim. A member with no proof is a **coverage
gap**, and a member named in the artifact's own prose with no proof anywhere is a worse one,
because the author saw it and the table hid it.

**Take the members from whatever holds authority over that set, which is not always the code.** A
provider's statuses come from the provider and a framework's routes from the framework - there the
code is the right place to look, because the code is where the set is discovered. But a set the
code is meant to *satisfy* has its authority outside it: the screens a design draws, the fields a
contract declares. Recomputing those from the code asks the author's own output whether the
author's own output is complete, and it answers yes every time. Open the artifact and count there.

For a startup-configuration row, read each assembly directly - open the file that constructs it
and show the line. A suite that boots its own assembly structurally cannot fail on another one,
so a green proof here is evidence about the test's assembly and nothing else.

Two more, mechanically: a claim about nine cases proven on two is a coverage gap; and a claim
naming a status code, route or response shape whose proofs all sit below that boundary is a
**level gap**, no matter how many assertions it carries.

Judge the *level* against the artifact's own `## Test policy` rows whenever it carries them
(`standard`, `ui`).
Those rows are the bar the author built under, and that section exists precisely because the
repo's conventions were found not to answer - deferring to the conventions instead measures the
build against the weaker ruler, which is the deference test-policy.md warns about.

Give each row a verdict, the way each check gets one: for every file the row classifies, is the
required proof there, and does it assert what the coverage expectation demands? A row nobody met
is a finding even when every check is green, because the rows priced work the checks do not name.

Only where the artifact carries no such section does the project's own convention decide -
`AGENTS.md`, contributing docs, the shape of the existing tests. Either way, a suite thinner than
the standard in force is a finding; one that merely differs from your taste is not.

Where the checklist left a value imprecise, record a **precision gap** rather than passing a
vague assertion - that is a finding about the checklist, and the most useful thing this step
produces.

Read the `Swept` rows that resolve to **existing** against the code: is the constraint they
cite actually there? A cited constraint that is not there is a finding. Rows that say *not in
scope* are policy the user approved - there is nothing in the code for them to be wrong about.

## 4. Inject faults (`standard`, `ui`)

A green suite proves the tests run. Fault injection proves they can catch a regression.

1. **Isolate.** `git worktree add <scratch> HEAD`. Never mutate the real tree, and **never
   use `git stash`** - it records state from *before* the mutation, so popping it does not
   reverse a fault applied afterwards.
2. **Baseline.** Record `git status --porcelain` of the real tree first.
3. **Inject a behaviour-level fault** in the new code: flip a condition, change a returned
   value or status, shift a bound by one, remove a required side effect.
4. **Run the covering proof** in the scratch and confirm it FAILS - the mutant is killed.
5. **Discard** the scratch and confirm the real tree's porcelain matches the baseline.

**One fault per distinct assertion surface, not per risky line.** Three mutations killed by the
same two proofs ran the same experiment three times: the first showed those assertions
discriminate and the rest confirmed it. Choose faults that force *different* proofs to fail,
stop once every proof carrying a check has been made to fail once, and cap it at five however
risky the feature looks - a quota that scales with risk costs most exactly where checks cluster
in risky code. Run only the narrowest proof covering each fault; a second covering proof adds a
run and no information. Use real mutation tooling when the stack has it (Stryker, mutmut,
cargo-mutants, pitest) - it gets many mutants from one run.

**A surviving mutant is a finding, not a footnote.** It means the assertion would pass under
a plausible wrong implementation.

## 5. Report

Write `.checks/<feature>.verified.md`. Lead with the verdict.

```markdown
# <Feature> Verification

**Verdict**: PASS
**Profile**: standard
**Diff range**: <base>..<head>
**Round**: 1 - full
**Verifier**: independent sub-agent (author != verifier)

## Binding sources

| Source | Opened | Contradiction | Uncovered |
|---|---|---|---|
| design `03` overview | yes - artifact URL | none | progress bar, radio indicator; breadcrumb rendered but not drawn |
| design `05` montando | yes | is a band on `03`; C20 renders it as its own screen | - |
| contract `billing.yaml` | yes | none | - |

## Checks

| Check | Claim | Proof run | Evidence | Result |
|---|---|---|---|---|
| C1 | suspends, never cancels | `pytest ...::test_failed_charge_suspends` exit 0 | `test_dunning.py:118` - `assert sub.status == "suspended"` | PASS |
| C3 | retry changes nothing | `npm test -- -t "retry is idempotent"` exit 0 | `webhook.spec.ts:41` - `expect(rows).toHaveLength(1)` | PASS |

## Test policy rows

| Row | Files it classifies | Required proof | Expectation met |
|---|---|---|---|
| Decides, reached across a boundary | `subscription.py` | boundary C1 · own layer C2 | `suspended` yes · `paused` no - C2 never asserts the emit |

## Faults injected

| Mutation | Location | Killed |
|---|---|---|
| returned status `suspended` -> `cancelled` | `subscription.py:88` | yes |
| removed the `subscription.suspended` emit | `subscription.py:104` | no - fix required |

## Gate

<command> - <N> passed, 0 failed
```

Then return a compact verdict in chat: PASS or FAIL, checks proven out of total, fault
result, and a ranked gap list.

A FAIL, a surviving mutant, an unmet test-policy row, a check contradicting a binding source, an
element or an **arrangement** a binding source decides that no check covers, a blanket exemption
in place of an enumerated one, a binding source recorded as opened that nobody actually saw, or
any check without a located `file:line` all mean the work is not done.

**A composition finding fails at the same weight as a wrong label**, and it has to be said
because it does not feel that way: a substring missing from a CTA reads as a defect, while "01 is
a different composition" reads as feedback. The second one is the larger failure and the one that
survives to production, so it carries a FAIL and it survives to the last round rather than
softening into a note somewhere around round two. Route gaps back as fixes and re-verify, bounded to **three** rounds before
escalating to the user.

## Re-verifying after a fix

A later round is scoped by two things: **the fix's diff, and every verdict that was not PASS.**
Anything else carries forward. Re-running a whole review to reconfirm what a fix could not have
touched is the cost the three-round bound multiplies by three.

Two rules make that safe rather than convenient.

**Proofs always re-run in full, at the new `HEAD`.** Green is a property of a commit - the same
reason a proof that went green earlier says nothing about now - and batched by target this is
two invocations, so it is not where the cost was anyway.

**Everything carried forward says where it came from.** Each section marks itself
`verified at <sha>` or `carried from <sha>`, and the header's `Round` reads `2 - scoped`. Silent
inheritance is the self-report problem wearing a table again; marked inheritance is contestable
by anyone reading.

Then scope by the diff, not by the fix's intent - a fix to a shared helper, a fixture or a
config has a wider blast radius than its description:

- **Faults**: re-inject on the surfaces the fix touched, and on any the fix created. A fix that
  *adds* an assertion is the common case, and its new surface has never been made to fail once.
- **`Coverage`**: recompute the rows whose authority the fix touched. A fix that adds a branch
  adds a member, which is exactly what may not pass unnoticed.
- **Citations**: refresh the files the fix touched; line numbers move.
- **`Test policy` rows**: re-judge the rows that were unmet, plus any row classifying a touched
  file.
- **Step 1**: only where the fix touched the interface, and only for those screens. A design
  does not change between rounds, and rule 4 keeps the checks fixed - so a contradiction found
  in round 1 is still a contradiction. The exception is a check the user renegotiated: that one
  goes back through step 1.
