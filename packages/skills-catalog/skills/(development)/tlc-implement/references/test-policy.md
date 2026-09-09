# Test policy

**Goal:** the repo, not this skill, decides which code must be proven at which level and how
deeply - and says so in writing, so the next agent and the next human inherit the decision
instead of re-deriving it.

## The failure this prevents

A test proves the layer where it **asserts**, not the layers it happens to **pass through**. An
end-to-end test that traverses a branch exercises one path through it; it says nothing about the
other paths, and it cannot fail when a second branch is wrong. Treating it as proof of the code
it traversed is **level substitution**, and it is the most common way a green suite ships a
broken branch table.

So obligations **add up rather than substitute**. When code that decides something is reached
across a boundary - a route, a queue, a scheduled job, a CLI entry point - two different claims
are in play and each needs its own asserted proof:

- the **entry point's contract**: it accepts what it should, rejects what it should, returns the
  right shape, persists or emits what it promised. Proven where the boundary really is, with the
  real transport.
- the **decision table inside**: every branch that changes the outcome, asserted case by case,
  isolated from the transport so the cases can be enumerated at all.

The second one is what gets lost. It disappears whenever a requirement is phrased as an
observable outcome, because the observable outcome names the entry point and the decision hides
behind it.

## 1. Does the repo already answer this?

Do not judge whether the repo "has testing docs" - it almost always does, and that impression is
what makes this step never fire. Ask the two questions a policy has to answer, for each layer
this change touches:

1. **Which level proves this code?**
2. **How much of its input space must the proof assert to count?**

If the declaration answers both for every touched layer, follow it and skip the rest of this
file. If either is unanswered for code that decides something, derive the missing rows.

A statement answers neither question when it only says **where** tests live or how they are
named, **how** to run them, **how a test is built** (which dependencies are real and which are
doubled), or **that** testing matters. Those are all useful and none of them allocate: they
describe the tests, while a policy has to describe the code. Watch for the third one especially,
because it is the one that looks like an allocation rule: keying the level to whether a test
uses real dependencies decides *how* to write a test, and if you read it as deciding *what
deserves* one, every decision table that touches a real dependency gets routed away from its own
layer and is never enumerated.

## 2. Classify by the shape of the code, never by the name of the layer

Layer names lie. A file named like a service can be a pass-through, and a handler that looks like
plumbing can hold the densest decision table in the change. Classify each candidate on a signal
you can point at.

**Instrumentation** - the body forwards its arguments to one call, or maps one shape onto another
with no conditional deciding the result. Its correctness is its consumer's problem; a test over
it re-asserts the framework underneath.

**Decision** - anything that changes an outcome. A dispatch over a status, event type or code. A
boundary or validation check. A state transition. A payload assembled conditionally. A mapping
table with more than one row. A guard, a precedence rule, an ordering rule.

Count it and write the number down: decision points added or touched, per file. "Dispatches over
six event types, eleven branch points" is contestable. "Looks like business logic" is not.

Then **name the members, not only the count** - `paused`, `updated`, `deleted`, `trial_will_end`,
other. Those names are what `Coverage` joins each proof against, and a set that only ever exists
as a number cannot be joined at all: the member you left out of the sentence is the one that ends
up with no proof and is never missed.

**The level follows the branch, not the observation.** A requirement phrased as an outcome at the
boundary does not discharge the code behind it. Decide the level from where the branch lives.

## 3. Derive from the code, not from the current suite

The existing tests set style, location and commands - never the bar. A module with no tests at a
level is evidence about its history, not evidence that its logic needs none; deriving the policy
from the suite you found codifies the gap you were asked to look at.

**Judge the house pattern across the whole repo, not the folder you happen to be changing.** That
folder is the smallest and least reliable sample there is, and reading it as the standard is how
a local gap gets promoted to a rule. Search instead for the closest analogue **by code shape** -
the other state machine, the other dispatcher, the other validator - wherever it lives. When you
find one, cite it in the evidence: a proposal that points at a sibling proven at that level is
precedent, and one that does not is taste.

When the existing suite or an existing rule contradicts what you propose, say so in one line.
That contradiction is information for the user, not a reason to lower the proposal.

## 4. Propose

Present it with the checklist - one place, not two. It goes in the artifact as a
`## Test policy` section immediately before `## Checks`, because every proof below depends on the
rows above. Use the repo's own level names, locations and commands; invent none.

```markdown
## Test policy (proposed - the repo does not declare this)

| Code | Required proofs | Coverage expectation |
| --- | --- | --- |
| Decides, and is reached across a boundary | one at the boundary **and** one at its own layer | the contract at the boundary; one asserted case per row of the decision table at its own layer |
| Decides, not reached across a boundary | one at its own layer | one asserted case per row of the decision table |
| Entry point or adapter that decides nothing | one at the boundary | accepted input, each rejected input, each error path |
| Instrumentation, pass-throughs | none of its own | covered by its consumer's proof |

Evidence:
- <file>: dispatches over <n> cases, <n> branch points -> decides
- <file>: forwards a single call, no conditional -> instrumentation
- <existing declaration> decides <what it decides> and leaves the two questions open
- closest analogue in the repo: <file>, same shape, already proven at this level with <n> cases
- the module has <n> proofs at this level today, which the table deliberately does not match

Cost: <n> proofs at their own layer, across <n> files. Without these rows, <n> decision tables
are proven only by a path that happens to traverse them.
```

A floor, never a ceiling, and a target rather than a description of what exists today. State the
cost in the proposal - a row set nobody can price is a governance debate, and a row set with a
number next to it is a five-second decision.

## 5. Ask, then write

**One question, not a menu.** The rows you derived are the default you build under: state them
and keep going. Offering a choice between allocation philosophies hands back the analysis this
step exists to do, and the option that always looks like the conservative one - prove everything
at the boundary, the way the repo already does - is level substitution wearing a hat.

So the only explicit question is the narrow one: **do these rows go into the repo's guidelines?**
Building under them is reversible and needs no permission. Writing them is not: project
guidelines reach every future agent and every human in the repo, a wider blast radius than the
feature you were asked to build, so approved rows go in their own commit, before the build
starts, and never ride along in a feature commit.

Ask it in one line, with both outcomes stated, so silence is not ambiguous. Adapt the names, keep
the shape:

> These rows are the bar I build under - approving the checklist is enough for that. Writing them
> into `<guidelines file>` needs an explicit yes, and it lands as its own commit before the build.
> Without one I build under them and leave the file alone.

Then stop asking. The answer settles it for this feature, and rule 4 keeps the rows fixed from
that point on.

**Fix what misleads, do not just add to it.** If an existing line is being read as an allocation
rule and is not one, leaving it in place means the next run re-derives the same wrong answer and
the Verifier defers to it. Quote the line, say what it actually decides, and propose the edit that
scopes it - as part of the same approval, in the same commit as the new rows.

If the user does not answer, do not write. Carry the proposal inside the checklist as a stated
assumption, build under it, and leave the files alone - a policy nobody agreed to is worse than
no policy, for exactly the reason above.
