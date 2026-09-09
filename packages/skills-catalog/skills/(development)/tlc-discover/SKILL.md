---
name: tlc-discover
description: 'Interviews an unshaped idea into a verdict and a design document with literal decisions for tlc-plan. Use when the user says "research this", "help me understand this problem", "should we build this", "discovery", "explore this problem", or "tlc-discover". Do NOT use when the shape is already decided (tlc-plan), or to implement.'
license: CC-BY-4.0
metadata:
  author: Tech Leads Club - github.com/tech-leads-club
  version: 0.8.0
---

# TLC Discover

Find out where this project actually is. Understand the problem. Decide whether to solve it. Then, and only then, decide how.

```
SITUATION ────→ PROBLEM ───────→ VERDICT ───────→ DECIDE
(where this     (no solution     (a stop, or a    (two shapes, costed
 project is)     proposed yet)    record)          against this repo)
```

**These are not a script, they are the prerequisite order.** What you run is an interview: ask whatever is answerable given what is settled, and stop when nothing answerable is left. The order falls out on its own, because *how* has *whether* as a prerequisite and *whether* has *where we are*. Marching them as four acts is how a discovery asks a project that never shipped what its problem costs today.

The failure that matters here is not inventing a fact, it is **converging early**: proposing a solution on turn two, hearing "sure", and manufacturing a decision that has all the authority of one and none of the examination. Everything below exists to make that harder.

The artifact is a design document humans read, not only the next skill. If Shape cannot tell a reader what will exist in the repository, or Roadmap which blocks are clear, it failed even with Decisions complete. This skill feeds tlc-plan.

## Critical rules

1. **No technology is *proposed* before the verdict.** Not a library, not a provider, not a pattern. If the problem section argues for one, the framing is already a solution. This bans proposing, never knowing: what the project already runs, already committed to and already has half-written is a constraint, and meeting it late is how a discovery reopens what the team closed last month.
2. **The verdict is a stop wherever the decision is open.** Present it and wait. Where Situation established that somebody already committed, it is a line on the record instead of a gate - manufacturing a gate whose answer you know is the approval theatre that teaches everyone to click through the one that mattered.
3. **Never present an option you would not ship.** Two shapes are considered every time; the second earns a section only when it is live. When it is not, it earns one sentence naming what would have to be true for it to win - which is the disqualifying property the next skill needs anyway.
4. **Name the number that would change the decision before you go and get it.** Data with no question attached is noise that costs context. And a **missing number is not a finding about the problem** - it is usually a finding about the instrumentation. Ask; never read size out of silence.
5. **A decision without a concrete value is not decided.** A shape, a bound, a status, a field. Everything downstream refuses vague input; catching it here is where it is cheap.
6. **High impact plus low clarity does not get decided here.** It becomes an RFC or a spike. Forcing it produces the most expensive artifact there is: a decision that reads settled and is not.
7. **Solve for this context, not for the reference architecture.** The recommendation is the smallest shape that answers the problem as measured, and anything heavier has to be bought with a condition that is true now or credibly close. Options that exist only to widen the reader's view are welcome and are marked as exactly that - a line each, never dressed as candidates.

## The interview

Ask what is answerable now. Every question whose prerequisites are settled is fair; one whose prerequisite is still open is not, because the answer to it is a guess you will then treat as a finding. **You are done when nothing answerable is left**, not when the sections below have all been visited, and a question that matters in a section you have not reached still has to be asked.

**Nothing here is owed a paragraph merely because it exists.** A step with no input costs a line, and a section with no content does not appear at all - certainly not as a heading with "N/A" under it, the same ceremony wearing an apology. This governs the questions and the document equally, and it is what lets one skill serve a two-hour change and a quarter of work.

**Every question carries your recommended answer and the reason, in a line.** Agreeing then costs a word and disagreeing costs a sentence, where a blank question hands the user the work they came here to have done. A question you have no recommendation for is usually one to look up instead.

**Facts you look up; decisions you ask.** Anything the repository, the tracker or the docs can settle, go and settle - spending someone's attention on a fact you could have read is how a session earns the reputation of being a form. Product opinion, priority and appetite for risk are theirs alone.

Keep the delivery small even though the frontier is wide: one question when the answers depend on each other, two when they do not. The frontier decides **what is askable and when you are finished**, never how many arrive at once. Ten at a time is a form dump, and people answer form dumps by agreeing.

**Some questions cannot be answered by talking at all.** How it should feel, one page or three - these need something to react to, and grinding on them doubles a session's length and converges on nothing. Catch it in the moment and route it out: to a spike where only building answers it, to a designer where only seeing it does. That routing is a result, not a failed extraction.

## Situation

Three facts decide which questions below are worth asking at all, and getting them wrong is what makes a discovery feel like it is interviewing somebody else's project.

**Where this project is.** A product in steady use has a today you can measure. One that has not shipped has no today at all - not a small one, none - and the cost-of-today questions return nothing four times, which then reads as a weak case. A project in active construction has something better than metrics anyway: a roadmap somebody wrote and code somebody is halfway through.

**Whether the decision is open.** Sometimes nobody has decided, and that is the whole reason this exists. Sometimes the roadmap, the quarter or somebody senior already committed, and the honest job is to record who and spend the session on shape. Ask rather than assume the first: the two barely share a question.

**What is already in flight that this touches.** Probe what is cheap and present - active branches, the open cycle in the issue tracker, the connected knowledge base, the design documents this skill already produced - and **ask for the rest**, because whoever is in the room knows what the team started last week and that beats every probe. Depend on none of them existing: a project with no tracker and no wiki is ordinary, and the repository plus the person answering is always enough.

**What is at stake.** Not how long the work takes - how expensive it is to be wrong about it. A change one person reverts in an afternoon and a change that migrates everybody's data are the same size on a roadmap and nothing alike here. This is the fact that decides how much of the rest runs.

Work in flight changes the answer and not merely the background. A capability half-built elsewhere turns this into an extension of it. A decision closed in an earlier design document is settled input, so reopening it is churn wearing the costume of thoroughness. And a file somebody is actively rewriting is a conflict you can still avoid while choosing a seam is free.

Record them in a line each, so a reader six weeks out can tell the problem section is thin because nothing had shipped rather than because nobody thought of it.

**Some work does not need a discovery at all, and saying so is part of the job.** Where little is at stake, the answer is reversible in an afternoon and nobody in the room disagrees, give the recommendation in a paragraph and stop: no document, no verdict, no sections. A discovery that cannot decline the *feature* is a rubber stamp, and one that cannot decline *itself* is paperwork people learn to route around - which is how it stops being run on the decision that needed it. The bar is all three at once: cheap to reverse, small blast radius, nobody disagreeing. Any one of them missing and the session runs.

## Problem

Nothing technical happens in this phase. People arrive holding a solution - "we need a cache", "we should add Stripe" - and the first job is to recover the problem it was an answer to, because the solution they arrived with is usually the first one they thought of, not the one they compared.

**Start by deciding which kind of problem this is**, because the questions differ and running the wrong set is how a discovery arrives at a confident wrong answer. A problem of **pain** is something happening now that costs something - it has a today you can measure. A problem of **absence** is a capability missing from a product that exists: nobody is hurt by it, because nobody is doing it. A problem of **construction** is the next piece of something still being built - no today, no substitute and nobody to ask, because the product has not met anyone yet.

Most new features are the second kind, and read through the first kind's questions every one of them looks like a preference. Run either of the first two over the third and every question comes back empty, which then reads as a weak case for work that was never in question.

For **pain**: **who hurts**, named specifically enough that you could go and talk to them; **what it costs today**, in whatever unit the business actually feels - minutes, tickets, churn, refunds, on-call pages; **what happens if nothing changes**, which separates a real problem from a preference, because a problem that costs nothing to ignore is a preference with better vocabulary.

For **absence**: **who cannot do this today**, and then the question that carries the whole phase - **what do they do instead**. Nobody sits and waits for software. They use a spreadsheet, a manual process, a support ticket, a competitor, or they give up quietly and you never hear about it. **The substitute is the evidence**: it is observable, it exists before the feature does, and it is the honest analogue of "what it costs today". Then **what stays impossible** if this is never built, and **who keeps leaving** over it.

For **construction**: the anchor is the commitment rather than a user. **What was this piece promised to make possible** - in the roadmap, the pitch, the earlier design document. **What is already built that it has to fit**, where the Situation probe is the evidence, standing where metrics stand for a live product. **What stalls without it** - not for a customer, for the thing being built: which blocks cannot start, what gets stubbed, what is written twice. Then the question keeping this kind honest, **why now rather than after the next piece**, because in construction nearly everything is worth building eventually and sequence is the only live decision.

Never run one kind's questions over another. "What breaks if we do nothing" answers itself under absence - nothing breaks, that is what absence means - and under construction the true reply, "the project stalls", sounds like special pleading and happens to be correct. Treating either as a finding is how this skill talks a team out of everything new it could build.

Be incisive. A vague answer is not something you write down, it is the thing you push on: "users are frustrated" means which users, doing what, how often. Challenge every abstraction until it has a number or a name in it, in the same turn rather than collecting vagueness to reconcile later.

**When there is no end user** - a refactor, infrastructure, platform work - only the cast changes. Whoever is on call hurts, the next feature hurts, the team hurts, and the journey becomes the operational sequence: what someone does today to deploy, debug, recover. Skipping the questions because "it is internal" is how internal work loses to feature work forever.

### Evidence

Before fetching anything, say which number would change the decision. Then go get that one. The instinct to gather broadly is the wrong one: a dashboard nobody asked a question of is context spent for nothing, and it makes the document longer without making the decision better.

What is available differs per project, so probe rather than assume. Product analytics, error tracking, logs, the issue tracker, support volume - use whatever the environment actually exposes, and never build a dependency on one of them being there. The floor is the repository itself, which is always present.

**A missing number is not evidence of anything.** Two opposite cases hide behind it: *we measured and it is small* is a finding about the problem, *nobody ever instrumented this* is a finding about the instrumentation. Something untracked happens exactly as often as it happens, and collapsing the two is how an untracked problem gets read as a small one.

So when the number is missing, **ask - never infer**. The people in the room know from support, from sales, from their own week, and that beats a silent assumption in either direction. Record what nobody can measure and what they told you instead, each marked as what it is. Making it measurable is sometimes the right first move and never the automatic one - and for a capability that does not exist there is nothing there to instrument.

### Journey

Walk the actual sequence someone goes through, and confirm it back. Not as a diagram and not as a persona - the output here is not a map, it is the **states that matter and what should happen in each**, which is exactly what the next skill needs and today has to invent.

It follows the evidence because a number changes which states are worth the trouble: where almost all the volume takes one path, that path's empty and expired and abandoned deserve real questions and the other path's deserve a line. Walking every branch at equal depth turns the journey into a map nobody reads.

Every real sequence has more states than the happy one anybody describes. Empty, first time, the retry, the half-finished, the expired, the unauthorised, the one where the user walks away and comes back tomorrow. Go and find them, put them to the user as concrete questions, and record what they decide.

These are **product** edge cases: what *should* happen. Concurrency, observability, idempotency and the rest of the engineering cross-cutting concerns are swept by **tlc-plan**, against the code, and duplicating them here produces two lists that drift. The line is clean: if answering it needs a product opinion, it belongs here; if it needs the repository, it belongs there.

### Bound the round

Say which questions this discovery answers and which it does not, and get agreement before exploring. Research has no natural end, and the phase after this reads code for every option, which is the slow part. Without a boundary agreed up front, "understand the problem" becomes a full audit of the repository.

### Cheaper than building it

Widen the solution space once, here, before the verdict. The phase above recovered the problem from the solution somebody arrived holding, and it is then easy to hand that same solution to the technical phase, which will dutifully produce two shapes of it. Two shapes of the wrong solution is still the wrong solution - the failure this skill is least equipped to notice, because every step of it looks like progress.

So ask what would remove the cost you just measured without building the thing that was proposed. Changing a default. Removing the step instead of supporting it. Wording that stops the confusion upstream. Doing it by hand for the first ten cases, which is usually how you find out what to build. Solving the half that carries most of the cost and leaving the rest. Buying it.

**Buying is the one needing a look outside**, and a bounded one: whether a product for this exists at all, and roughly what it costs against the weeks it replaces. Not a vendor survey, and not a breach of rule 1 - noting a category of product exists is not proposing a pattern. How anyone *shapes* this waits for Prior art.

Most get discarded in a line, and that is the point - considered where the user can see them, so the expensive path becomes a choice instead of a default. When one survives it is the highest-return moment in the discovery. And it happens here or nowhere: after the verdict the work is committed to shape and cost, and nobody reopens *what* to build while comparing *how*.

## Verdict

**Where the decision was already committed**, this is a record and not a gate: one line naming who committed and when, then straight on to shape. The exception is narrow and real - if the problem work contradicts the commitment, say so plainly and stop, because that is the finding worth interrupting a settled plan for. Short of that, do not stage a decision you already have.

Where it is open, four outcomes, and all four are real: **build**, **build something smaller or different**, **not now**, **do not build**. Being able to say the last three is most of what makes the first one worth anything.

Under **construction** the verdict is about sequence rather than existence. "Do not build" is rarely live for a piece the project was designed around; "not now, after X" often is, carrying the same burden - what stalls while it waits, what gets written twice if it arrives later.

The second carries a trap. "Smaller or different" is a new proposal, so the problem section has to still hold against it: say which part of the measured cost it removes and which it leaves. Skip that and a cheaper answer to a slightly different problem gets approved for being cheaper.

**Declining is also a bet, and it argues for itself like any other.** The burden tilts on its own: building has to earn evidence, while not building arrives by default from nobody having measured anything. That is a thumb on the scale, not neutrality. So "not now" and "do not build" carry their own case - what it costs to stay as we are, and what would have to become true to change the answer - and it goes in the **same units** as the cost of doing it. Where one side is engineering weeks and the other is adjectives, the adjectives lose every time, and the adjectives are usually the customer.

State it with the reason, in the terms the problem phase established - the cost of doing nothing against the cost of doing something. Then **stop**. The user confirms before a single technical option is discussed. This is the gate; everything before it is worthless if you walk through it yourself.

### What counts as worked

A verdict is a bet, and a bet nobody settles is an opinion with a date on it. So before anything technical, say what would make this worth having done - in the **problem's own unit**, the one Evidence established. If the cost was refunds, success is in refunds; if it was minutes of manual work, success is in minutes. Changing units here is how a bet quietly becomes unlosable.

**"It shipped" is not success, it is the thing you already agreed to do.** That swap is the most common failure in the discipline, comfortable precisely because it is guaranteed: a feature being live is an output, true whether or not anybody's problem went away. So is any number that only goes up.

Three lines settle it. **Worked if** - the outcome, and roughly by when. **Early signal** - visible in days rather than quarters, plus what it looks like when the bet is going wrong, the point being to act while acting is cheap. **Review** - a date or a trigger, and who looks; without it nobody ever checks, and the review is the only moment anybody learns from having decided.

Where little is at stake it is the first line alone. A review date on a change nobody would revisit is the ceremony that teaches people to skip this section on the change that needed it.

Where the outcome cannot be measured, answer in the voice Evidence uses - untracked is not the same as small - then take one of two honest exits. Name the observable proxy that is not a metric: the spreadsheet stops being updated, the support thread stops recurring, the manual step leaves the runbook. Or name what would have to be instrumented and whether that is part of this work. Under **construction** the proxy is structural and checkable - the waiting block can start, and what was stubbed is not.

**Where measuring it needs an event that does not exist, that is build work and belongs in the task**, and it is the only part of this section the next skill acts on. Nothing else here becomes an acceptance criterion: "refunds fall by a third" cannot be proven by a test at merge, and pushing it downstream either blocks a correct implementation or gets weakened into something that passes.

If the verdict is **not now** or **do not build**, stop after Boundary. Do not invent a Shape or a Roadmap for work you just declined.

## Decide

Now open the repository, and open it **before** proposing anything and before reading anything outside. An option is not a design, it is a design plus what it costs *here*, and the same choice is obvious in one codebase and absurd in another. Proposing first and checking later means defending a position instead of forming one; reading a benchmark first means reading your own codebase through somebody else's lens.

### What the repository tells you

**Churn does not say which option is right. It says how much it costs to be wrong.** That is the calibrator for the robustness axis, and the most useful signal available because git is always there. A one-way door in a file touched twice a year is cheap to get wrong; the same door in a file touched every week is a bill arriving weekly. Where the answer is already "very little", read it in one command and move on - and a project three months old has no history to read.

Churn is ambiguous in both directions, so never read it alone. Low churn is stable, abandoned, or so painful everyone routes around it; high churn is the hot path of the business, or a part never factored properly. Two cheap signals disambiguate: **how many distinct authors** touch it, because many authors make changing it a coordination cost rather than an edit, and **how recent** it is, because an area still moving six months in has not found its shape and does not deserve an abstraction today.

Read the conventions too, and read them as **precedence rather than as a cost to weigh**. Where this codebase has already answered the question in front of you, its answer stands unless you can name what is wrong with it - not what is nicer about the alternative. An outside idea that merely ties with an established one loses, because a tie gets decided by which is more interesting to write about, and that is how a product line drifts one reasonable improvement at a time.

### Prior art

Somebody has solved a version of this before, and reading how is cheap next to discovering it in production. The discipline the numbers get applies here too: **name what a benchmark would change before you go and look**, or "how do others do this" returns three paragraphs about a company you are not.

Three things are worth carrying back. **The shape that repeats** across independent teams, because convergence is evidence - the same seam everywhere is usually load-bearing rather than fashionable. **The failure everybody reports**, the cheapest item in this skill: an edge case avoided by reading instead of by shipping. And **what turned out to be unnecessary**, which you only get from teams describing what they removed.

**What never transfers is scale, and that is how this section does harm.** A design published by a company with a thousand times your traffic describes *their* constraints faithfully, and adopting it imports a bill for a problem you do not have. Where a benchmark argues for something heavier, say which of their conditions you share; sharing none, it is interesting and irrelevant, and saying so is the finding. Read the constraint behind the design, never the design.

Where nothing comparable exists, that is a result too: the problem is unusual, or the framing is off and nobody names it that way. The second is worth going back for.

**Skip the whole section wherever little rides on being wrong.** A shape everyone in the room can already picture does not get a literature review, and running one anyway turns this into the padding it exists to prevent. Web access is guaranteed nowhere either; where it is missing, say so rather than reasoning from memory about what some product does today, which is exactly the fabricated constraint the knowledge chain forbids. Cite what you did read in Sources.

### Two shapes

Propose the overall shape, not each decision separately. Eight decisions with two options each is sixteen options and an exhausted reader; the shape is the thing with a real fork, and the smaller decisions fall out of it, a line apiece.

**The first shape is the obvious one**: what the context already suggests, the best ratio of value to effort, what a sensible team ships. **The second is the one that survives**: more robust over time, more expensive now. The axis is always the same - pay now or pay later - and naming it is what makes the comparison honest, stopping the second option from being a flavour and forcing it to be a different bet.

Give each one the condition under which it wins. That is what lets someone disagree productively: not "I prefer the other one" but "your condition is wrong, we do change that area monthly".

**The lighter shape holds the recommendation and the heavier one has to take it from it** - and taking it is an ordinary outcome, not an upset. The default exists because the condition justifying the heavier shape is a claim about the future, and an unchecked claim about the future is how a team pays today for a scale that never arrives. So put the condition in the present tense and check it: not "we might need a second region" but "we run in one and nothing on the roadmap adds another".

**Where the condition holds, say so and flip.** Situation already collected the evidence for this - a roadmap commitment, a block in flight that needs this, a second consumer that exists today - so "credibly close" means a fact in that list and never a feeling. Where the list holds one, shipping the lighter shape now means building the thing twice.

**Building too little argues for itself as well, and it costs differently.** Overbuilding wastes money you can see; underbuilding buys a rewrite plus whatever broke on the way to it, and neither lands in the estimate. So when you recommend the lighter shape, name **what it will not survive** and what would force the rewrite. Unable to name either, you have not compared two shapes - you have described one and defaulted to it.

**Options beyond the two are perspective and are labelled as that** (rule 7). Where three approaches exist in the wild and two are out, naming all three with the line that removes each beats arriving quietly with the survivor: it turns "here is my answer" into "here is the field, and here is where it narrows". A line each, never in Decisions, never padded to make the recommendation look inevitable - that padding is the straw man rule 3 stops.

When the second shape is not genuinely live, do not build it a section. One sentence - "the heavier version only pays off if we expect N, and we do not" - carries the whole comparison and hands the next skill the rejected alternative with the property that killed it.

Write the chosen shape as the **diff of the project**, not a paragraph restating the bet: Adds, Changes, Leaves, in identifiers a reader could search for. The bet still earns two or three sentences above that list, and the heavier alternative stays a condition rather than a second diff unless it is live.

**Then check that diff against the journey states, not only against the repository.** Every state the user confirmed - empty, retry, expired, unauthorised, abandoned - needs something in Adds or Changes that answers it, or one line saying what already handles it. A state confirmed in the interview and missing from the diff is the concrete form of building too little, and the only form of it you can catch by reading instead of by shipping.

### When to stop deciding

Two axes settle every remaining question, and the grid is the stopping rule - you are done when every question sits in one of the four, not when you run out of energy.

| | Clear | Unclear |
|---|---|---|
| **High impact** | Decide it. Record the shape, the alternative, and what would flip it. | **Do not decide.** It needs an RFC, or a spike when only building answers it. |
| **Low impact** | One line. | Take a sensible default, note it, and decide while building. |

The top-right cell is the one that gets violated, because deciding feels like progress. A consequential choice nobody can see clearly is exactly the one not to settle in a conversation, and sending it to an RFC is the discovery working rather than failing.

**Spike over RFC** when the missing thing is knowledge only building produces: whether the provider behaves that way, whether the approach performs at this size. Write the question it answers, what each answer changes, and when it stops - a spike with no stopping condition becomes the implementation.

**Needs design** is the third handoff and the one the pipeline otherwise loses. Behind an API, discovery decides and the task follows directly; on a screen, somebody has to draw it in between, and the next skill assumes that happened - it links the visual rather than inventing it. So where a screen cannot be planned until it is designed, say so and say what the design must resolve: which screens, and which journey states it answers for. The drawings then land in **this** document - a link or path in Sources, cited from Journey - never a sidecar brief or a PDF the next skill will not open.

Then index the grid as a **Roadmap** of blocks a person could staff, each carrying its clarity from the grid. If a reader cannot see the work and what is still fog, the Roadmap failed.

Record each decision as it is made, not at the end. Decisions written up afterwards get re-derived, and re-derivation is where the reason quietly turns into a rationalisation.

## Format

Read `references/document-format.md` when you write the `.design/<name>.md` artifact — after the verdict is confirmed, or after recording a committed decision. Do not load it during the interview. Section headings in that template are literals: the next skill refers to them by name.

## Knowledge chain

In strict order: existing code and conventions, project docs, library documentation, web search, then flag as uncertain. Never invent an API, a limit or a behaviour. "I could not find documentation for this" beats a plausible fabrication - and here a fabricated constraint does not cause a bug, it eliminates an option that was available.

## Output

Produce the artifact - unless Situation concluded there is nothing here to discover, in which case produce the paragraph. Never narrate the phase. The interview's rules govern the asking; here, state conclusions definitively and cut filler and hedging.

## Examples

### Example 1: Open decision

User says: "Should we add a cache for the dashboard?"
Actions:
1. Look up situation (shipped product, what is in flight). Ask only what the repo cannot settle.
2. Recover the problem from "we need a cache" — who hurts, what it costs today, what happens if nothing changes.
3. Name the number that would change the decision, then fetch that one.
4. Walk the journey states that matter. Present cheaper-than-building paths.
5. Stop at a verdict and wait.
6. After confirmation, read the repository, then two shapes, then write `.design/<name>.md` from `references/document-format.md`.
Result: a design document with Situation, Problem, Evidence, Verdict, Shape (Adds/Changes/Leaves), Roadmap, and literal Decisions — or a confirmed "do not build" that stops after Boundary.

### Example 2: Already committed

User says: "We already decided to build billing. Help me figure out the shape."
Actions:
1. Record the committed decision in Situation. Do not restage the verdict.
2. Interview journey states and evidence that still affect shape.
3. Open the repository before proposing. Two shapes, costed here. Write `.design/<name>.md`.
Result: Verdict line is "already committed — see Situation". Shape and Decisions are filled. tlc-plan can copy the literals.

### Example 3: Wrong skill

User says: "Cut this design doc into tasks."
Actions: Do not run this skill. That is tlc-plan.
Result: hand off; no `.design/` file from this skill.

## Common failures

### Converging on turn two
Cause: a solution was proposed before the verdict, the user said "sure", and that was treated as a decision.
Solution: stop. Recover the problem. If the decision was already committed, record it and skip the gate — do not manufacture a second one.

### Empty case for a new capability
Cause: pain questions ("what breaks if we do nothing") were run on an absence or construction problem.
Solution: switch kinds. Absence: what they do instead. Construction: what stalls, and why now rather than after the next piece. A missing number is not evidence the problem is small.

### Description or template placeholders leaking into the artifact
Cause: the Format template was copied with the angle-bracket hints still in it.
Solution: replace every placeholder with a concrete value, or omit the section. A heading with "N/A" under it does not appear.

