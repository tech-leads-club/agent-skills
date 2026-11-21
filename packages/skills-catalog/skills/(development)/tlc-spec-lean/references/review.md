# Review

One reader who did not build it, once per feature, after the last build commit. It decides itself
how to check; the prompt only says what to check against. There is no checklist to fill, no
script and no second round.

## Send it

Fill the `**Review:**` line with `sent at <HEAD short hash>` - in `plan.md`, or in `request.md`
when the change skipped the plan - then start a fresh sub-agent - never yourself, never one that
wrote the code - with the prompt below. Fill the brackets; paste the user's request verbatim from
`request.md`, captures listed by path. Add nothing of your own: no summary of what you built, no
hint of where to look.

`<spec>` is one of two sentences:

- with a plan: `The approved plan is .specs/features/<feature>/plan.md, and the design captures it
  cites are in .specs/features/<feature>/captures/.`
- without one: `There is no plan: the spec is .specs/features/<feature>/request.md, the request
  and the user's answers to its product decisions.`

```
Someone else implemented a feature in <repository path> (branch <branch>). The user's request is
quoted below. <spec> The work is every commit after <base commit>, plus anything uncommitted.

Check whether everything the request and the spec ask for was implemented, and implemented
correctly. Decide yourself how to check it. At least:
- read the request sentence by sentence against what was built, not only the plan;
- for a screen, open the running app at each capture's size and compare each captured state with
  its capture;
- for each rule the spec names, read its test and say whether it would fail if the rule were wrong.

Do not change the code, do not commit, and do not change the data the running app holds or anything
outside the repository. To reach a state the data does not have, stub the response in the browser
or use a throwaway copy of the database, and say which in the review. Write your verdict and each
problem you find, with its evidence, to .specs/features/<feature>/review.md, and reply with the
same.

Environment
- Stay in this repository; do not change the workspace root.
- <how to start the app, its ports, and any other copy of the app running at the same time>
- No git push.

The user's request:
<verbatim>
```

With no sub-agents, run the prompt in a new session, or hand it to the user, and say so in the
report.

## Fix once

Read `review.md`. Fix what you agree is wrong in one pass, under the same rules as the build. Then
write the `**Fix pass:**` line - `done - <what it changed>`, or `done - no changes needed` - in the
file that holds the `**Review:**` line, and commit. The line, not a later commit, records that the
pass happened, so an empty review closes too; it still ends with the build committed and the tree
clean, including what the reviewer's browser left behind.

A finding where the screen departs from a binding capture is not yours to keep: the capture is the
user's (rule 3). Fix it in this pass, or, when fixing it needs a decision - another layout, a
change to a shared screen - ask the user; never leave it with a reason of your own. Any other
finding that is a product decision goes to the user; one you disagree with stays, with your reason
in the report. There is no second review.

## Report

Lead with the outcome: what was built, the commits, the review's verdict, what the fix changed, and
what it did not change and why. A red command or an unfixed finding is said first, never left for
the reader to find.
