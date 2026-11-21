---
name: tlc-prd
description: 'Interviews an idea into a PRD file covering situation, problem, success, boundary, and journey states, and stops before any technical design. Use when the user says "write the PRD", "create the PRD", "PRD", "product spec", "product requirements", "tlc-prd", or "what does the product need to decide". Do NOT use for designing a solution, choosing technology, publishing the document, or cutting the PRD into tasks.'
license: CC-BY-4.0
metadata:
  author: Tech Leads Club - github.com/tech-leads-club
  version: 1.0.0
---

# TLC PRD

Find out where this effort actually is. Understand the problem. Decide whether to solve it. Write that down as a PRD file, and stop.

```
SITUATION ────→ PROBLEM ───────→ VERDICT ───────→ FILE
(where this     (no solution     (a stop, or a    (.prd/<slug>.md,
 effort is)      proposed yet)    short record)    nothing else)
```

These are not a script, they are the prerequisite order. Ask whatever is answerable given what is settled, and stop when nothing answerable is left. *Whether* has *where we are* as a prerequisite. Marching the sections as a form is how a PRD asks an effort that never shipped what its problem costs today.

The failure that matters is **converging early**: proposing a solution on turn two, hearing "sure", and manufacturing a decision. Everything below exists to make that harder.

The artifact is one Markdown file a product person can read and hand to someone else without having been in the room. It records the bet. It does not record how to build it.

## Critical rules

1. **No technology is proposed.** Not a library, not a provider, not a pattern, not a schema, not an API. If the problem section argues for one, the framing is already a solution. Knowing what already exists is allowed: a commitment, a substitute people use today, a constraint. Proposing is not.
2. **The verdict is a stop wherever the decision is open.** Present it and wait. Where Situation established that somebody already committed, record who and when, then write the file. Do not manufacture a second gate.
3. **Never present an option you would not ship.** Cheaper paths are considered once, before the verdict. One that is not live earns one sentence naming what would have to be true for it to win.
4. **Name the number that would change the decision before you go and get it.** A missing number is not a finding about the problem. It is usually a finding about what nobody measures. Ask. Never read size out of silence.
5. **A decision without a concrete value is not decided.** A bound, a status, a person, a date. Vague input gets pushed in the same turn.
6. **High impact plus low clarity does not get decided here.** It stays an open question on the PRD. Forcing it produces a decision that reads settled and is not.
7. **The file is the whole output.** Do not publish, upload, file, or sync it anywhere. Where the team keeps documents is the user's job.

## The interview

Ask what is answerable now. A question whose prerequisite is still open is a guess you will then treat as a finding. You are done when nothing answerable is left, not when every heading below has been visited.

Nothing is owed a paragraph merely because it exists. A step with no input costs a line. A section with no content does not appear in the file.

Every question carries your recommended answer and the reason, in a line. A question you have no recommendation for is usually one to look up. Facts you look up. Product opinion, priority, and appetite for risk are the user's.

Keep delivery small. One question when the answers depend on each other, two when they do not. Ten at a time is a form, and people answer forms by agreeing.

Some questions cannot be answered by talking. How it should feel, one page or three, needs something to react to. Route it out: a spike where only building answers it, a design pass where only seeing it does. That routing is a result. Record it under Open questions. Do not grind it into a fake decision.

**Some efforts do not need a PRD.** Where little is at stake, the answer is reversible in an afternoon, and nobody disagrees, give the recommendation in a paragraph and stop. No file. The bar is all three at once. Any one missing and the interview runs.

## Situation

Record four facts, one line each, so a reader later can tell a thin problem section from a thin effort.

- **Where this effort is.** Steady use has a today you can measure. Not shipped has no today. Active construction has a commitment and work already in flight, which is better than a metric.
- **Whether the decision is open.** Ask. Sometimes nobody has decided. Sometimes a roadmap, a quarter, or somebody senior already committed, and the job is to record who and spend the session on the problem and the journey.
- **What is already in flight that this touches.** What this copies as precedent, and what stays out. One sentence each. Leave out how it is built.
- **What is at stake.** How expensive it is to be wrong. Cheap to undo and a one-way change for the people involved are nothing alike. This decides how much of the rest runs.

## Problem

Nothing technical happens here. People arrive holding a solution. Recover the problem it was an answer to.

Decide which kind of problem this is first. The questions differ.

- **Pain.** Something happening now that costs something. Who hurts, named specifically enough that you could go and talk to them. What it costs today, in a unit the business feels: minutes, money, complaints, people leaving. What happens if nothing changes. A problem that costs nothing to ignore is a preference.
- **Absence.** A capability missing from a product that exists. Who cannot do this today. What they do instead: a spreadsheet, a manual process, a ticket, a competitor, or they give up. The substitute is the evidence. What stays impossible if this is never built. Who keeps leaving over it.
- **Construction.** The next piece of something still being built. What this piece was promised to make possible. What stalls without it: what cannot start, what is only a stand-in until this exists, what gets done twice. Why now rather than after the next piece. Sequence is the live decision. "Do not build" is rarely live. "Not now, after X" often is.

Never run one kind's questions over another. "What breaks if we do nothing" answers itself under absence. Under construction the true reply is "the project stalls". Treating either as a finding talks a team out of work that was never in question.

Push every abstraction until it has a number or a name, in the same turn. "Users are frustrated" means which users, doing what, how often.

When there is no end user, only the cast changes. Whoever carries the work hurts, the next piece of work hurts, the team hurts. The journey is the operational sequence. Skipping the questions because the work is internal is how internal work loses to other work.

### Evidence

Before fetching anything, say which number would change the decision. Then go get that one.

Use whatever the environment actually exposes: usage numbers, complaints, a queue, a spreadsheet, a log of what happened. Never build a dependency on one of them being there. Where nothing is connected, ask the room.

When the number is missing, ask. Record what nobody can measure and what they told you instead, each marked as what it is. For a capability that does not exist there is nothing to measure yet.

The number that moved the verdict belongs in Problem, in one line, with where it came from. Evidence is not its own section in the file.

### Journey

Walk the actual sequence and confirm it back. The output is the states that matter and what should happen in each.

A number changes which states are worth the trouble. Where almost all the volume takes one path, that path's empty, expired, and abandoned deserve real questions. The other path deserves a line.

Every real sequence has more states than the happy one. Empty, first time, the retry, the half-finished, the expired, the unauthorised, the one where the user walks away and comes back tomorrow. Put them to the user as concrete questions.

These are product states: what should happen. How it is built is not asked here: concurrency, idempotency, authorization mechanics, and observability stay out. If answering needs a product opinion, ask it. If it needs a look at the build, or a design, it waits, and it does not enter this file.

Confirmed states land in the PRD's Journey table. That table is the product acceptance criteria. A state the user confirmed and the file does not contain is the concrete form of writing too little.

### Bound the round

Say which questions this PRD answers and which it does not, and get agreement before the verdict. Without a boundary, "understand the problem" becomes an audit.

### Cheaper than building it

Widen the solution space once, before the verdict. Ask what would remove the cost you just measured without building the thing that was proposed. Changing a default. Removing the step. Wording that stops the confusion upstream. Doing it by hand for the first ten cases. Solving the half that carries most of the cost. Buying a product that already does this, bounded to whether one exists and roughly what it costs against the time it replaces. Noting a category of product exists is not proposing a design.

Most get discarded in a line. When one survives, say which part of the measured cost it removes and which it leaves. That comparison happens here. After the verdict, nobody reopens *what* to write down while comparing *how* to build it.

## Verdict

Where the decision was already committed, this is a record: one line naming who committed and when. If the problem work contradicts the commitment, say so and stop.

Where it is open, four outcomes, and all four are real: **build**, **build something smaller or different**, **not now**, **do not build**.

Under construction the verdict is about sequence. "Not now, after X" carries what stalls while it waits and what gets written twice if it arrives later.

"Smaller or different" is a new proposal. The problem section has to still hold against it: which part of the measured cost it removes and which it leaves.

"Not now" and "do not build" carry their own case, in the same units as the cost of doing it. What it costs to stay as we are. What would have to become true to change the answer.

State the verdict with the reason. Then **stop**. The user confirms before you write the file. Do not write the file, and do not discuss how to build it, until they confirm.

### What counts as worked

Say what would make this worth having done, in the problem's own unit. "It shipped" is not success.

Three lines. **Worked if** — the outcome, and roughly by when. **Going wrong** — visible in days, what it looks like when the bet is failing. **Review** — a date or a trigger, and who looks.

Where little is at stake, the first line alone.

Where the outcome cannot be measured, name an observable proxy, or name what would have to be measured and whether that is part of this work. Under construction the proxy is structural: the work that was waiting can start, and what was only a stand-in is gone.

Nothing in this section becomes a test of the build. The Journey table is the product acceptance criteria. "Refunds fall by a third" cannot be proven by inspecting the build.

## Write the file

Write the file only after the user confirms the verdict, or immediately when Situation established the decision was already committed and the problem work does not contradict it.

Read `references/document-format.md` at that moment. Do not load it during the interview.

Write `.prd/<slug>.md` in the current project. `<slug>` is the title in kebab-case, in the language of the document. If that file already exists, confirm before replacing it. If the user names a different path, use that path.

The prose follows the language of the conversation. Section headings stay as in the format file. Identifiers are never translated.

A declined verdict (`not now` or `do not build`) writes Status, Situation, Problem, and Boundary. What would have to become true to reopen it goes in Boundary. Do not invent Journey or Success for work you just declined.

After writing, tell the user the path and the status. Do nothing else with the file.

## Examples

### Example 1: Open decision

User says: "I want a PRD so members can save posts."
Actions:
1. Situation: community is in steady use, decision is open, bookmarks are not in flight, wrong here is an afternoon revert.
2. Problem kind is absence. Ask who cannot do this and what they do instead. Recommend the substitute you can observe, and say why.
3. Name the number that would change the verdict before looking it up. If it is untracked, ask.
4. Confirm the journey states that carry the volume, including empty and abandoned.
5. Name cheaper paths in a line each. Stop at a verdict and wait.
6. After confirmation, read `references/document-format.md` and write `.prd/save-posts.md`.
Result: one PRD file. Status names who confirmed and when. No technical design, no publish step.

### Example 2: Already committed

User says: "We already decided members can save posts. Write the PRD."
Actions:
1. Record who committed and when. Do not restage the verdict.
2. Interview only the problem facts and journey states the commitment did not settle.
3. If the problem work contradicts the commitment, say so and stop without a file.
4. Otherwise write `.prd/save-posts.md` with Status recording the commitment.
Result: a PRD a reader can use without the conversation. The verdict line is the commitment, not a fresh gate.

### Example 3: Wrong skill

User says: "Design the bookmarks schema" or "break this PRD into tasks."
Actions: do not run this skill. This skill produces the PRD file and stops.
Result: no `.prd/` file from this request.

### Example 4: Nothing to write

User says: "Change the save button label to Save."
Actions: the change is reversible in an afternoon, the blast radius is one label, and nobody is disagreeing. Recommend the copy in a paragraph and stop.
Result: no file.

## Troubleshooting

### The user wants the solution in the PRD

Cause: they arrived holding "we need a cache" or a screen spec.
Solution: recover the problem. Constraints and substitutes stay. Technology, schema, and API stay out. If they insist on a design, this skill is the wrong one. Write nothing technical into the file.

### The user asks to put the PRD in Notion, a wiki, or a tracker

Cause: the file exists and they want it somewhere else.
Solution: the file is the output. Publishing it is their job. Do not create, upload, or sync a page.

### The problem section is full of adjectives

Cause: "users are frustrated" was written down instead of pushed.
Solution: go back. Which people, doing what, how often, in which unit. A vague answer is not a finding.

### A number you looked for does not exist

Cause: nobody measures it, or the capability does not exist yet.
Solution: ask the room. Write the line that says it is unmeasured and what they told you. Do not treat silence as "small".
