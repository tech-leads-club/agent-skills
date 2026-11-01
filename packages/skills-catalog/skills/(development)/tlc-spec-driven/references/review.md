# Design: Read the Plan Cold

One fresh sub-agent reads the plan before Tasks is written. It never saw the conversation. The author holds the chat, so what the chat settled reads as written even when the files never say it. A reader without the chat finds that gap. It also finds the path that is not there and the decision nobody made.

A review in the author's context reapplies the thinking that made the gap. It is not this review.

**When:** the feature has a `design.md`, the design is complete, and Tasks has not started. Small and Medium skip it.

## The Round

1. Run `python3 <skill-dir>/scripts/validate_design.py <feature>`. It settles what a script can, so the reviewer spends its time on judgement. Fix every error first.
2. Write `**Reviewed**: dispatched` in design.md. Then dispatch one fresh sub-agent with the brief below. After a compaction, an orchestrator that finds `dispatched` waits for `review.md`. It never sends a second reviewer.
3. Resolve every finding in one pass, in the main context. The resolution rules are below.
4. Write `**Reviewed**: review.md` in design.md. Escalated findings reach the user together, once, before Tasks.
5. Tasks reads design.md and review.md. `validate_tasks.py` refuses the tasks while a finding is open.

There is one round and no second reviewer. The user sees what the fixes changed at the tasks approval. A Blocker whose fix replaces the chosen approach goes back to the user as an approach choice.

**No sub-agent, or the reviewer fails.** Retry once. Then write `**Reviewed**: not run - <what failed>` and continue, and the gate warns. Reading the plan again in the author's context is never recorded as this review.

## What the Reviewer Receives

- `spec.md`, `context.md` when it exists, and `design.md`.
- The `## Decisions` section of `.specs/STATE.md`.
- The output of `python3 <skill-dir>/scripts/lessons.py list --status confirmed`.
- Read-only access to the repository.
- The brief below, word for word.

It never receives the conversation, the author's research notes or the Handoff. The dispatch names the feature and its files, and nothing about what to accept.

## The Brief

```
You review a plan before anyone builds it. You did not see the conversation behind it.
That is the point: read only the files you were given and the repository. Fix nothing.
Your only write is .specs/features/<feature>/review.md, in the shape below.

1. Paraphrase first, in your own words, 2 to 5 sentences each:
   "What this builds" and "How the system works today, per these files".
   A section you cannot paraphrase is a Blocker.
   Do not smooth over a gap. The author compares your words with what they meant.

2. Then look for these, in this order:
   a. The plan contradicts the code. Or it cites a file, symbol, signature or behaviour
      as existing, and it is not there. Open every one it cites. Blocker.
   b. A term of this project with no definition or link. A prerequisite the reader must
      already know. A mechanism stated without how ("handled automatically").
      General engineering terms are not findings. Major.
   c. It builds what the code already has, or what no criterion needs.
      Search the code before you report. Major.
   d. A failure it opens and nothing handles. For each dimension the design touches, a
      criterion or an Error Handling row covers it: input bounds, partial failure,
      retries and duplicates, auth, concurrency and ordering, data lifecycle,
      observability, a failing external dependency, state transitions.
      Major. Blocker when it loses data or money.
   e. A decision left to whoever writes the tasks or the code: a schema, a signature,
      an error strategy, a library. Major.
   f. It contradicts an approved criterion, an active AD-NNN or a confirmed lesson. Blocker.
   g. The assumption under "Breaks if" is false or unchecked in the code. Blocker when false.

3. Report Blocker and Major only. No nits, no style, no praise, no questions.
   Every finding names where it is, its evidence and the smallest change that closes it.
   Where starts with the plan file that must change: spec.md, context.md or design.md.
   Then it names the heading. Name the earliest file: a gap in the spec is never a design fix.
   Evidence is file:line in the repository, or the plan's file and heading.
   A finding you cannot evidence is not reported. Leave Resolution empty.

Write review.md:

# <Feature> Plan Review

**Reviewer**: independent sub-agent (author != reviewer)

## What this builds
<paraphrase>

## How the system works today, per these files
<paraphrase>

## Findings

| ID | Severity | Where | Finding | Evidence | Smallest fix | Resolution |
| --- | --- | --- | --- | --- | --- | --- |
| R1 | Blocker or Major | <spec.md, context.md or design.md, then the heading> | <the gap> | <file:line> | <change> | |

With no finding, write `None - <one line on what you probed>` under ## Findings.
Then reply with one line: the path and the count of Blockers and Majors.
```

## Resolution

Each finding gets one resolution, written in its row:

| Resolution | When | Form |
| --- | --- | --- |
| fixed | The finding holds. | `fixed - <what changed, where>` |
| contested | The finding is wrong, and a file the reviewer could read shows it. | `contested - <file:line, or a file and its heading>` |
| escalated | Only the user can settle it: scope, product behaviour, a binding source, or a choice that cannot be undone. | `escalated - user: "<their words>"` |

- You wrote the plan. Wanting to contest is not evidence. "Intentional" is not evidence either. With no file to cite, fix it or escalate it.
- A comprehension gap is never contested. If a reader without the chat could not follow it, the plan lacks it.
- A fact the user gave in the chat and the files lack is a fix. Write it in `context.md` or the spec, in their words. Never add text that only a sub-agent needs.
- Fix by deleting before adding. A fix that adds a component, a flag, a dependency or an abstraction is escalated. The cure for a critique is where over-engineering enters a plan.
- What is not the user's to decide, you decide, and the row records it as `fixed`.
- Escalations go out together, once, each with your recommendation first. When nobody is there to answer, end the turn with them. Write each answer in its row in the turn it arrives.
- A severity is never lowered. A Blocker you think is minor is contested with evidence, or fixed.
- A finding whose Where is `spec.md` changes what the user approved. Its fix goes to the user with the escalations. When they approve it, stamp the spec again with `approve.py`. The gates refuse the tasks until then, because the spec's hash no longer matches.

**Turn fixed findings into lessons.** For each `fixed` Blocker, record a lesson with `--signal plan_gap` and the finding's evidence as `--source` ([lessons.md](lessons.md)). The next plan then avoids the same gap.

The Resolution column is also this step's measure. When a run of features never ends with a `fixed` finding, the review costs more than it finds.
