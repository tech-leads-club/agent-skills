---
name: tlc-discover
description: 'Thinks through new or large projects: turns a vague idea into a design doc with a clear product problem and the technical solution. Use when exploring a new project, planning or designing a big project or system, or asked for a "design doc". Do NOT use for clear features or projects (use tlc-spec-lean or tlc-spec-driven).'
license: CC-BY-4.0
metadata:
  author: Tech Leads Club - github.com/tech-leads-club
  version: 0.10.0
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

The artifact is a design document that anyone - a person, a team, a planning tool - can plan from without having been in the conversation that produced it. It has to show the design, not only record that one was made: the decisions that are hard to reverse, the flow of the critical path, the states and who moves them, the schema as it will exist, the contracts callers will hold. Where relationship or order is the content, that is a diagram; a table of thirty literals is a spec wearing a design's clothes. And it is organised by vertical slice, so a reader who wants one piece of the work reads one section and finds its diff, its flow, its schema, its contract, its decisions and its open questions there. If the Summary cannot tell a reader what the bet is, a slice cannot show them how its piece moves, or the Slices index which slices are clear, it failed even with every decision recorded.

**The document exists first for people to align on a project, and complete is not the same as readable.** A team reads it in one sitting and has to come out agreeing on what is being built, why, the main rules, the flows, what is hard to reverse and what is still open. Whoever then specifies a feature - a person or an agent - starts from a slice and is expected to read the code, work out the detail and ask questions; the document is the high-level design of a project that will be cut into one or many features, not the spec of any of them. A document that holds every fact and makes a person assemble them - from labels in the skill's own vocabulary, decision numbers they have to look up, and paragraphs carrying five facts each - lost the person. A document that answers every question an implementer could have - every column, every status code, every method touched - lost them too, by being too long to align on, and it will have drifted from the code by the time the feature is specified.

## Critical rules

1. **No technology is *proposed* before the verdict.** Not a library, not a provider, not a pattern. If the problem section argues for one, the framing is already a solution. This bans proposing, never knowing: what the project already runs, already committed to and already has half-written is a constraint, and meeting it late is how a discovery reopens what the team closed last month.
2. **The verdict is a stop wherever the decision is open.** Present it and wait. Where Situation established that somebody already committed, it is a line on the record instead of a gate - manufacturing a gate whose answer you know is the approval theatre that teaches everyone to click through the one that mattered.
3. **Never present an option you would not ship.** Two shapes are considered every time; the second earns a section only when it is live. When it is not, it earns one sentence naming what would have to be true for it to win - which is the disqualifying property whoever plans this needs anyway.
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

Record them where the reader meets them, so a reader six weeks out can tell the problem section is thin because nothing had shipped rather than because nobody thought of it: where the project is opens Context and problem, who committed is the header's Status, what is at stake is the Summary's last line. What is in flight is one sentence for what this reuses as precedent and one for what stays out - it is where commit hashes and method names leak into the document first, and neither belongs.

**Some work does not need a discovery at all, and saying so is part of the job.** Where little is at stake, the answer is reversible in an afternoon and nobody in the room disagrees, give the recommendation in a paragraph and stop: no document, no verdict, no sections. A discovery that cannot decline the *feature* is a rubber stamp, and one that cannot decline *itself* is paperwork people learn to route around - which is how it stops being run on the decision that needed it. The bar is all three at once: cheap to reverse, small blast radius, nobody disagreeing. Any one of them missing and the session runs.

## Problem

Nothing technical happens in this phase. People arrive holding a solution - "we need a cache", "we should switch providers" - and the first job is to recover the problem it was an answer to, because the solution they arrived with is usually the first one they thought of, not the one they compared.

**Start by deciding which kind of problem this is**, because the questions differ and running the wrong set is how a discovery arrives at a confident wrong answer. A problem of **pain** is something happening now that costs something - it has a today you can measure. A problem of **absence** is a capability missing from a product that exists: nobody is hurt by it, because nobody is doing it. A problem of **construction** is the next piece of something still being built - no today, no substitute and nobody to ask, because the product has not met anyone yet.

Most new features are the second kind, and read through the first kind's questions every one of them looks like a preference. Run either of the first two over the third and every question comes back empty, which then reads as a weak case for work that was never in question.

For **pain**: **who hurts**, named specifically enough that you could go and talk to them; **what it costs today**, in whatever unit the business actually feels - minutes, tickets, churn, refunds, on-call pages; **what happens if nothing changes**, which separates a real problem from a preference, because a problem that costs nothing to ignore is a preference with better vocabulary.

For **absence**: **who cannot do this today**, and then the question that carries the whole phase - **what do they do instead**. Nobody sits and waits for software. They use a spreadsheet, a manual process, a support ticket, a competitor, or they give up quietly and you never hear about it. **The substitute is the evidence**: it is observable, it exists before the feature does, and it is the honest analogue of "what it costs today". Then **what stays impossible** if this is never built, and **who keeps leaving** over it.

For **construction**: the anchor is the commitment rather than a user. **What was this piece promised to make possible** - in the roadmap, the pitch, the earlier design document. **What stalls without it** - not for a customer, for the thing being built: which blocks cannot start, what gets stubbed, what is written twice. Then the question keeping this kind honest, **why now rather than after the next piece**, because in construction nearly everything is worth building eventually and sequence is the only live decision.

Never run one kind's questions over another. "What breaks if we do nothing" answers itself under absence - nothing breaks, that is what absence means - and under construction the true reply, "the project stalls", sounds like special pleading and happens to be correct. Treating either as a finding is how this skill talks a team out of everything new it could build.

Be incisive. A vague answer is not something you write down, it is the thing you push on: "users are frustrated" means which users, doing what, how often. Challenge every abstraction until it has a number or a name in it, in the same turn rather than collecting vagueness to reconcile later.

**When there is no end user** - a refactor, infrastructure, platform work - only the cast changes. Whoever is on call hurts, the next feature hurts, the team hurts, and the journey becomes the operational sequence: what someone does today to deploy, debug, recover. Skipping the questions because "it is internal" is how internal work loses to feature work forever.

### Evidence

Before fetching anything, say which number would change the decision. Then go get that one. The instinct to gather broadly is the wrong one: a dashboard nobody asked a question of is context spent for nothing, and it makes the document longer without making the decision better.

What is available differs per project, so probe rather than assume. Product analytics, error tracking, logs, the issue tracker, support volume - use whatever the environment actually exposes, and never build a dependency on one of them being there. The floor is the repository itself, which is always present.

**A missing number is not evidence of anything.** Two opposite cases hide behind it: *we measured and it is small* is a finding about the problem, *nobody ever instrumented this* is a finding about the instrumentation. Something untracked happens exactly as often as it happens, and collapsing the two is how an untracked problem gets read as a small one.

So when the number is missing, **ask - never infer**. The people in the room know from support, from sales, from their own week, and that beats a silent assumption in either direction. Record what nobody can measure and what they told you instead, each marked as what it is. Making it measurable is sometimes the right first move and never the automatic one - and for a capability that does not exist there is nothing there to instrument.

**Evidence is interview work, not a section of the document.** It exists to settle the verdict, and once the verdict is settled the number that moved it belongs in Problem, in the one line where a human reading the problem needs it. A separate list of numbers and non-numbers is the decision's working, and the document records decisions, not workings. The exception is narrow: when a reader needs more than one number to trust the problem, or needs to know what the code does today to follow the design, Context and problem carries an Evidence subsection - usage numbers in a table with the reading of each, the current behaviour as a labelled list. Where measuring the problem needs an event that does not exist, that is a slice.

### Journey

Walk the actual sequence someone goes through, and confirm it back. Not as a diagram and not as a persona - the output here is not a map, it is the **states that matter and what should happen in each**, which is what whoever plans this needs and would otherwise invent.

It follows the evidence because a number changes which states are worth the trouble: where almost all the volume takes one path, that path's empty and expired and abandoned deserve real questions and the other path's deserve a line. Walking every branch at equal depth turns the journey into a map nobody reads.

Every real sequence has more states than the happy one anybody describes. Empty, first time, the retry, the half-finished, the expired, the unauthorised, the one where the user walks away and comes back tomorrow. Go and find them, put them to the user as concrete questions, and record what they decide.

These are **product** edge cases: what *should* happen. The engineering cross-cutting concerns - concurrency, idempotency, authorization, observability - are not asked here; they are decided later, against the code, and only the ones that are hard to reverse - those become Key decisions; the rest are the plan's. The line is clean: if answering it needs a product opinion, it is asked here; if it needs the repository, it waits.

**The journey has no section of its own in the document.** It is asked here, as product, before the verdict - and each confirmed state then lands in the slice that answers it, in that slice's behaviour table, next to what the caller sees. A journey kept whole at the top of the document and a contract kept whole inside each slice are the same facts in two voices, and a planner reconciles them by hand. What the top of the document does carry, when the work is a user-visible sequence, is the journey as orientation: one flow diagram in How it works and the steps one line each, so a person sees the path before meeting its states. A state no slice touches is one line under the Slices index naming the existing code that handles it.

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

**The verdict is a gate in the conversation and one line in the document.** The header's Status carries it - `confirmed by <who>, <date>`, or `declined` with the reason - and nothing else does. The reasoning, the cheaper paths considered and the four outcomes weighed are the decision's working; they live in the conversation, and a reader who needs them has the person who confirmed. A Verdict section restating what the header already says is the ceremony that makes the document long without making it more decided.

### What counts as worked

A verdict is a bet, and a bet nobody settles is an opinion with a date on it. So before anything technical, say what would make this worth having done - in the **problem's own unit**, the one Evidence established. If the cost was refunds, success is in refunds; if it was minutes of manual work, success is in minutes. Changing units here is how a bet quietly becomes unlosable.

**"It shipped" is not success, it is the thing you already agreed to do.** That swap is the most common failure in the discipline, comfortable precisely because it is guaranteed: a feature being live is an output, true whether or not anybody's problem went away. So is any number that only goes up.

Three lines settle it. **Worked if** - the outcome, and roughly by when. **Early signal** - visible in days rather than quarters, plus what it looks like when the bet is going wrong, the point being to act while acting is cheap. **Review** - a date or a trigger, and who looks; without it nobody ever checks, and the review is the only moment anybody learns from having decided.

Where little is at stake it is the first line alone. A review date on a change nobody would revisit is the ceremony that teaches people to skip this section on the change that needed it.

**The section is never missing from a document whose verdict is build, and every target sits beside how it is measured.** A target with no measurement is a wish: say "not measurable yet" in the cell and carry it to Open, where somebody decides how to measure it or the instrumentation becomes a slice. And when nobody in the room would say what worked means, do not write one for them and do not drop the heading - the section says it is undefined, and Open carries the row with who has to decide. A missing section reads as "nobody thought of it"; an explicit gap gets closed.

Where the outcome cannot be measured, answer in the voice Evidence uses - untracked is not the same as small - then take one of two honest exits. Name the observable proxy that is not a metric: the spreadsheet stops being updated, the support thread stops recurring, the manual step leaves the runbook. Or name what would have to be instrumented and whether that is part of this work. Under **construction** the proxy is structural and checkable - the waiting block can start, and what was stubbed is not.

**Where measuring it needs an event that does not exist, that is build work and belongs in the plan**, and it is the only part of this section a planner turns into a task. Nothing else here becomes an acceptance criterion: "refunds fall by a third" cannot be proven by a test at merge, and pushing it downstream either blocks a correct implementation or gets weakened into something that passes.

If the verdict is **not now** or **do not build**, the document is Status `declined` with the reason, Summary, Context and problem and Scope - what would have to become true to reopen it goes in Scope. Do not invent a design or slices for work you just declined.

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

**Skip the whole section wherever little rides on being wrong.** A shape everyone in the room can already picture does not get a literature review, and running one anyway turns this into the padding it exists to prevent. Web access is guaranteed nowhere either; where it is missing, say so rather than reasoning from memory about what some product does today, which is exactly the fabricated constraint the knowledge chain forbids. Cite what you did read in References - and References holds only the documents the research stood on: the roadmap, the decision records, earlier design documents, the external references. Code paths are cited inline, next to the fact they settle, and are not repeated there.

### Two shapes

Propose the overall shape, not each decision separately. Eight decisions with two options each is sixteen options and an exhausted reader; the shape is the thing with a real fork, and the smaller decisions fall out of it, a line apiece.

**The first shape is the obvious one**: what the context already suggests, the best ratio of value to effort, what a sensible team ships. **The second is the one that survives**: more robust over time, more expensive now. The axis is always the same - pay now or pay later - and naming it is what makes the comparison honest, stopping the second option from being a flavour and forcing it to be a different bet.

Give each one the condition under which it wins. That is what lets someone disagree productively: not "I prefer the other one" but "your condition is wrong, we do change that area monthly".

**The lighter shape holds the recommendation and the heavier one has to take it from it** - and taking it is an ordinary outcome, not an upset. The default exists because the condition justifying the heavier shape is a claim about the future, and an unchecked claim about the future is how a team pays today for a scale that never arrives. So put the condition in the present tense and check it: not "we might need a second region" but "we run in one and nothing on the roadmap adds another".

**Where the condition holds, say so and flip.** Situation already collected the evidence for this - a roadmap commitment, a block in flight that needs this, a second consumer that exists today - so "credibly close" means a fact in that list and never a feeling. Where the list holds one, shipping the lighter shape now means building the thing twice.

**Building too little argues for itself as well, and it costs differently.** Overbuilding wastes money you can see; underbuilding buys a rewrite plus whatever broke on the way to it, and neither lands in the estimate. So when you recommend the lighter shape, name **what it will not survive** and what would force the rewrite. Unable to name either, you have not compared two shapes - you have described one and defaulted to it.

**Options beyond the two are perspective and are labelled as that** (rule 7). Where three approaches exist in the wild and two are out, naming all three with the line that removes each beats arriving quietly with the survivor: it turns "here is my answer" into "here is the field, and here is where it narrows". A line each, never in Decisions, never padded to make the recommendation look inevitable - that padding is the straw man rule 3 stops.

When the second shape is not genuinely live, do not build it a section. One sentence - "the heavier version only pays off if we expect N, and we do not" - carries the whole comparison and hands the planner the rejected alternative with the property that killed it.

### What the document holds

The document holds the **fundamental decisions - product, contracts, data model, direction - with the main rules and flows, and nothing the spec of a feature can derive from them.** Five rules keep it that size and keep it readable. They are applied while writing, not after.

1. **Each fact has one home.** Key decisions is the home of everything hard to reverse; a slice cites a decision by code and name - "D2 (one Payment per Invoice)" - and moves on. The record or constraint that carries a rule is named once, in the Data of the slice that creates it. A consequence that requires work names the slice that does it, and that slice shows the obligation in its own Behaviour - a spec is written from the slice, and what is only in the decision is not seen there. A consequence with no owner is done by nobody or by two. Three indexes may point at a fact that lives elsewhere, and only these three: the Summary, the Key decisions index table and the Open table. An index names the fact and links to its home; the moment it explains, it is a second home. A design that states ten decisions eighty times reads as bloated even when every section, alone, looks justified.
2. **A fact earns its place by passing one of two questions.** Could two people on the team disagree about it, or be surprised by it? If it changed after release, would somebody outside the team have to be told, or data migrated? A fact that fails both - one any competent implementer would arrive at alone and a single pull request could change later - is the spec's, however true it is.
3. **Identifier ceiling: route, table, column, class, glossary term.** Nothing the spec would name - a new method, a container token, a file path, a CSS selector - appears. Existing code is named only where the design has something to say about it: the precedent a decision warns against copying, the route that stays as it is and so opens a gap, the public interface another module calls. The document says what will exist, never what will be done; a list of files to add or methods to touch is a task list wearing a design's headings.
4. **Nothing is referenced that the reader cannot resolve on the page.** The document has no "I": it is the team's, and a sentence in the first person has no author a reader can find. A person is named with their role the first time. An external identifier - a ticket, a numbered question from a requirements document, a screen number, a persona's name - is explained where it is cited, or it does not appear: each one, not only its scheme, because knowing that "Q-nn" is a numbered question does not tell a reader what Q-03 asks. One code means one thing; where the input uses one prefix for two things, a priority and a screen, the document renames one. Every reference a reader has to leave the page to resolve is a place where a person stops reading and an agent guesses.
5. **One fact per sentence, and the picture before the decisions.** A paragraph that packs four facts with dashes and parentheses is a list or a table that has not been formatted yet; a paragraph that answers a question gets a bold lead-in naming the question. The order is fixed - what and why, how we will know, what is in and out, how it works, the decisions, what is open, the slices - because a decision about how two writers are ordered means nothing to someone who has not yet seen that there are two writers.

**Size is a number, not a feeling.** The part a team reads together, Summary through Open, is about 2,000 words; the whole document about 4,000, plus about 250 for each slice beyond eight; code blocks do not count. "Readable in one sitting" is a test every draft passes. Over budget means something is stated twice or belongs to the spec - cut that, never a rule, a flow or a decision.

**Rule 2 applied to the two places a design most easily turns into a spec:**

- **Data model.** In: the records, how they relate and in what cardinality, the role of each, what is new and what changes; the constraint that carries a business rule ("one Payment per Invoice" as a unique constraint); the field whose meaning is a decision (a nullable reference whose null means "not confirmed yet"); and, where two kinds of row share a table, what tells them apart. Out: the type, nullability and index of every column, and the fields any table has.
- **Contracts.** In: the surface - method and route, the essential of the request and the response, who consumes it - and the responses a client has to program against because they encode a product decision (a conflict that returns the existing record, an error that means "retry is safe"). Out: input validation and the errors every API has. A contract is anything that crosses a team boundary, not only HTTP: the provider events an endpoint subscribes to, a record another team will read later, the public interface another module calls.

What the repository reveals that changes a decision or a release - an old route that bypasses the new rule - is alignment material and becomes a row in Open. What it reveals that only changes how the code is written is the spec's.

### The top of the document

**The Summary carries the shape** as three or four numbered ideas plus the one line saying what is expensive to get wrong. **How it works shows it**: one overview diagram of the whole, the lifecycle of the record and the entity diagram whenever more than one slice touches them, the few terms the document coins, and the other shape with its condition and what this design does not survive. A global diagram buried in the slice that happened to be written first is found by nobody who starts at the top. Neither section says which layers the design follows - the repository's rules already do; a sentence is earned only where the design departs from them.

**Key decisions** sit above the slices, five to eight; more than eight means the shape has not been found. Each has a code and a short name, a row in an index table a reader can scan, and a section with only the labelled lines it has content for: the rule, the consequence, and where they exist, what to be careful of and the alternative. Most are two lines. Each is an invariant or a placement, never a mechanism: "one Payment per Invoice, and a lost race leaves no orphan Payment" is a decision; the conditional update that achieves it is one of several mechanisms, and naming it forecloses the others. Where the obvious precedent in the code would break the invariant, say so - "Refund writes its status and its ledger entry separately; do not copy it here" is the line a spec cannot derive and would otherwise get wrong.

**Open holds only what needs somebody.** One table above the slices with a row for each thing someone has to decide or do before this can ship: every RFC, spike and design handoff, every answer pending from outside the room, every target nobody can measure yet, every fact not verified. Each row names its owner, everything it blocks and the slice with the detail - and whether it blocks a slice's spec or only its release. An item that decides how a slice is built blocks the spec; one that only decides whether it may ship - a legal answer, a client update, a threshold to agree - blocks go-live, and that slice stays clear with the go-live block in its header. Calling both "blocked" stops work that could start. Defaults taken are not in it: they need nobody unless somebody disagrees, so they stay in their slice, and the slice's status counts them. Mixed in, they turn five things to chase into seventeen.

### Slices

The design is organised by **vertical slice**, never by kind of view. A slice is a staffable vertical - the record, the operation that moves it, the screen - and a reader who wants to understand one operation reads one section. A document that puts every flow under Flows and every table under Schema has organised itself for the writer.

**Cut the slices first, then fill them.** Five to eight is typical and about ten is the ceiling; past it the work is usually two designs that share a decision, and the shared decision is the first document. One slice is one section and no index. "Pay Invoice" is a slice; "write the service" is a task. A slice is named by a domain term or a code identifier, never a prose verb, and the prose calls each record what the glossary calls it, every time. The index is a table - slice, what exists when it is done, status - and the status column shows all the fog at once: `clear`, `clear` with defaults taken, `blocked by` a slice or an open item, `rfc`, `spike`, `design`.

**The order is asked, never inferred, and it has to hold.** Each slice says what it depends on, and everything it uses - a table, a route, an event - is created in it or in a slice before it. A slice that writes to a table a later slice creates is an ordering defect that stays invisible until somebody specifies it: move the table to where it is first written, or move the slice. A slice with an undecided item that blocks its spec is `blocked by` it, never `clear`, and the header does not call the document ready on its behalf. The same holds for what is shared: a mapping or a table that more than one slice applies lives in How it works, not in the slice that happens to describe it best, or the first slice to need it has to go and find it in a later one. And where the product is inconsistent between one slice shipping and another - an old route still treating the new record the old way - one line under the order says so, and whether that state may be released.

**A slice stands on its own for its decisions, not for its implementation.** It opens with what it delivers, its status, the decisions that apply with their names, what it depends on, and its screens when it has interface. Then the same labelled parts in the same order, each only where it has content:

- **Behaviour** - the states of the journey this slice answers, what should happen, what the caller sees. Only the rows that earn a place: the product decision, the race, the failure that must leave nothing behind. Usually four to six. Every state the user confirmed has a row in some slice or a line under the index naming the existing code that handles it; a confirmed state missing from every slice is building too little, caught by reading instead of by shipping. A row whose outcome a later slice delivers says which one.
- **Contract** - one line per endpoint added or changed, and any contract that is not HTTP.
- **Data** - the records created or altered and only the fields and constraints that carry a decision, each with what it means. A record lives in the slice that creates it.
- **Events** - what the slice emits and what it carries, when someone else will read it.
- **Flow** - only where the slice holds a one-way door: a sequence diagram whose participants are layers and whose steps are the refusal, the read that can fail, the transaction and the race that must lose cleanly. It tells the same story as the behaviour table - same branches, same outcomes.
- **Alternatives considered** - reversible options a reader might raise, each with the condition under which it wins. Costly ones are in Key decisions.
- **Open** - the defaults taken here, and in full the RFC, spike or design question the status names.

Whoever specifies the feature will still read the code and still have questions, and that is the design working: a question about a method name or an error message is the spec's to settle, while a question about something hard to reverse means the design left a decision out.

**A slice with interface names its screens**, by the number or name the design handoff uses, and every screen in the handoff is claimed by a slice. A screen nobody claims is the same defect as a state with no row.

**Derivable conventions are named once, under the index** - "all as Invoice does them", with the record that holds the convention - and only after opening that record: a precedent cited from memory sends the spec to the wrong file. New records and routes follow the repository's naming rule; a table name is a one-way door.

**Migration and rollout** appears only where the product is in use: existing rows, backfill, deploy order, what an old client sees before it updates. In steady use it is where the technical risk lives. Each step is written in the mechanism the repository actually uses to change data - its schema-migration tool, a one-off script, a background job - after reading how that mechanism runs: whether it runs once or can run again, whether it may carry data and not only schema, and what the project's rules forbid. A step the mechanism cannot do - "run the backfill again after deploy" through a tool that runs each migration once - is a release that fails on the day; what the rules do not allow is a row in Open, not a step.

**Every diagram is read back against the repository and against its own document before it lands.** An entity diagram's cardinality has to match the optional references the tables describe; a state diagram shows an undecided transition as undecided; a sequence diagram ends a branch where the table says the request ends. A sequence that calls something that does not exist, an entity diagram with the wrong cardinality, a state the code cannot reach - each is a fabricated constraint wearing a picture, and pictures are believed faster than prose. Mermaid is the default because it diffs and renders where the document lives; a drawn screen is linked, never redrawn. Code appears almost nowhere: the only literals in a design are the ones that are the decision - an enum value, a path, a response shape.

### When to stop deciding

Two axes settle every remaining question, and the grid is the stopping rule - you are done when every question sits in one of the four, not when you run out of energy.

| | Clear | Unclear |
|---|---|---|
| **High impact** | Decide it. Record the shape, the alternative, and what would flip it. | **Do not decide.** It needs an RFC, or a spike when only building answers it. |
| **Low impact** | One line. | Take a sensible default, note it, and decide while building. |

The top-right cell is the one that gets violated, because deciding feels like progress. A consequential choice nobody can see clearly is exactly the one not to settle in a conversation, and sending it to an RFC is the discovery working rather than failing.

**Spike over RFC** when the missing thing is knowledge only building produces: whether the provider behaves that way, whether the approach performs at this size. Write the question it answers, what each answer changes, and when it stops - a spike with no stopping condition becomes the implementation.

**Needs design** is the third handoff and the one that otherwise gets lost. Behind an API, discovery decides and planning follows directly; on a screen, somebody has to draw it in between, and the plan assumes that happened - it links the visual rather than inventing it. So where a screen cannot be planned until it is designed, say so and say what the design must resolve: which screens, and which journey states it answers for. The drawings then land in **this** document - a link or path in References, cited from the slice's behaviour table - never a sidecar brief or a PDF nobody planning from this will open.

Then every cell of the grid lands somewhere a reader will find it: the costly decisions in Key decisions, the reversible ones as a slice's alternatives, the defaults and the RFC, spike and design ones as the slice's status and its open question - and all of the unsettled ones again as rows of the Open table. The Slices index shows the grid as one status column. If a reader cannot see the work and what is still fog from that column and that table alone, the document failed.

Record each decision as it is made, not at the end. Decisions written up afterwards get re-derived, and re-derivation is where the reason quietly turns into a rationalisation.

## Format

Read `references/document-format.md` when you write the `.design/<name>.md` artifact — after the verdict is confirmed, or after recording a committed decision. Do not load it during the interview. The set and order of sections in that template are fixed; the heading words follow the language of the document, and the template carries the translated set. Identifiers and slice names are never translated.

## Before you hand it over

A checklist in prose gets read and skipped, so the checks are split by who can do them.

**1. Run the validator.** `python3 <skill-dir>/scripts/validate_design.py .design/<name>.md`, where `<skill-dir>` is the directory containing this `SKILL.md`. On Windows, where `python3` may be the Microsoft Store alias, run `python` or `py -3`. It checks what a script can: required sections, anchors, decisions and slices agreeing between their index tables, the header and the sections, each slice citing its decisions by name, the order respecting dependencies, nothing blocked being called clear, a measurement beside every target, every cited code defined on the page, the slice count and the word budget. Fix every error; a warning is either fixed or is a choice you can defend in one line.

**2. Give it to a reader who was not in the room.** Where the environment can start a subagent or a fresh session, hand it only the document and the repository and ask it for defects, not for a plan: statements that contradict each other, a diagram that disagrees with its table, a reference it cannot resolve, a claim the repository does not bear out, a name used before it is explained. Require it to quote the two lines that conflict - document against document, or document against a file and line in the repository - so that what comes back is checkable rather than opinion. Check each finding before accepting it, fix what holds and run the validator again. The author of a document cannot see its contradictions; every draft this was tried on had some. Where no fresh reader is available, say so in the handover rather than skipping silently.

**3. Answer what only judgment can.**

- Can a person stop after the Summary and say what is being built and what is expensive to get wrong?
- Does every behaviour row, data field and contract line pass one of the two questions of rule 2?
- Do two behaviour rows describe situations the code cannot tell apart - a retry and a second simultaneous request - with different outcomes? Then the design has to say how they are told apart.
- Was every precedent cited actually opened, and every provider behaviour a decision relies on read in the provider's documentation in this session?
- Was every claim the input made about the current system - a number from a dashboard, "the field already exists", "the code does not check this" - checked against the repository before it was repeated?
- Is every person named with a role, and is each thing called by one name throughout? A second word for the same record, or one word for two different things, reads as two things.
- Does any diagram draw as settled something Open or a spike says is undecided?
- Does any target or signal measure a state that another rule says can never be recorded?

**For a design with an expensive door, or one that changes more than one module, a dry run of the next step is worth its cost**: it is the only check that finds what is missing rather than what contradicts, such as a consequence whose owner no slice names. Have a fresh agent write the spec of the first slice from the document alone, recording every question it would have asked. Questions about detail are the spec working. A question about something hard to reverse, or a contradiction it had to resolve by guessing, is a defect in the design.

**Know when to stop.** A fresh reader always finds something, and a different one each time, so "no findings" is not a stopping rule - it is never reached. Stop when a run raises no question about something hard to reverse that Open does not already list. What remains then is detail for the spec and wording. And every fix is a new edit: after applying findings, run the validator and re-read the rows you touched, because a correction made in one place is the commonest source of the next contradiction.

## Knowledge chain

In strict order: existing code and conventions, project docs, library documentation, web search, then flag as uncertain. Never invent an API, a limit or a behaviour.

**What an external provider does is read, not remembered.** Every provider behaviour a Key decision relies on is read in the provider's own documentation during this session and the page goes in References. While there, look for the notice that the path is deprecated, legacy, or not recommended for new integrations: that turns a detail into a decision to put to the user. What the documentation does not say is a spike or a row in Open - never an assumption written as a fact. "I could not find documentation for this" beats a plausible fabrication - and here a fabricated constraint does not cause a bug, it eliminates an option that was available.

**What an input document says about the system is checked, not transcribed.** A requirements document, a ticket or a pitch is the best source for what people want and the worst for what the code does today. Every claim it makes about the current system - a number it says a report produced, a field it says exists, a gap it says the code leaves - is checked against the repository before the design repeats it. Where the repository cannot produce the number the input quotes, say so and mark it as the input's, with its source; where the code contradicts the claim, the design follows the code and says so, because the problem it then solves is usually smaller or different. The same holds for the document's own evidence: a conclusion about what the code does is drawn after reading the code path, including the checks upstream that may already prevent it.

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
6. After confirmation, read the repository, then two shapes, then cut the slices and fill each with its diff, flow, schema, contract and decisions. Write `.design/<name>.md` from `references/document-format.md`.
Result: a design document with the status header, Summary, Context and problem, How we will know it worked, Scope, How it works, Key decisions, Open, and Slices — an index of slices with status, then one section per slice, each with its behaviour table — or a `declined` document that stops after Scope.

### Example 2: Already committed

User says: "We already decided to build invoicing. Help me figure out the shape."
Actions:
1. Record the committed decision - who and when - for the header's Status. Do not restage the verdict.
2. Interview journey states and evidence that still affect shape.
3. Open the repository before proposing. Two shapes, costed here. Design with the critical-path flow, the state machine and the schema. Write `.design/<name>.md`.
Result: the header's Status names who committed and when. How it works, Key decisions and every slice are filled. Anyone can plan from it without the conversation.

### Example 3: Wrong skill

User says: "Cut this design doc into tasks."
Actions: Do not run this skill. Planning starts from the document; this skill produces the document.
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

### A spec wearing a design's clothes
Cause: one Decisions table grew to thirty rows of error copy, trimming and sort order, and the transaction that actually decides the design is one cell among them. No flow, no state machine, the schema in one line.
Solution: pull the hard-to-reverse decisions into Key decisions as prose, draw the critical path inside the slice that owns it, name the records and the fields that carry a decision. Drop the derivable literals - a planner gets them from the convention the repository already holds, and cite that convention once under the index.

### Organised by view instead of by slice
Cause: every flow under Flows, every table under Schema, every endpoint under Contract, every choice in one Decisions table, every open question at the end. Each section is tidy and the reader who wants to understand one piece of the work visits five of them.
Solution: cut the slices first. Each one carries its own behaviour table, flow, schema, contract and open questions. The only things above the slices are what belongs to the whole design - the summary, how it works, the key decisions, the open table - and an index with one status per slice.

### Ten decisions said eighty times
Cause: the transaction appears in Situation, Prior art, Shape twice, two Key decisions, the slice's Delivers, its behaviour table, its diagram, a paragraph after the diagram, a cross-cutting line, a decisions row and a schema note. Every section was "earned by having content", and the transaction has content everywhere.
Solution: each decision has one home. Key decisions holds it; the slice cites it by code and name; the diagram shows it; the Summary and the index tables point at it without explaining it; nothing else mentions it. Then remove the per-slice decisions table, the cross-cutting line and the Adds/Changes list - they were the repetition's vehicles.

### Complete, and nobody can read it
Cause: the document opens with an instruction to the planning tool and four bullets in the skill's own vocabulary. Each paragraph packs five facts with dashes and parentheses. Slices say "Key decision 3" and cite a ticket number, and the reader leaves the page to find out what those are. The lifecycle diagram is inside the second slice. What blocks the release is spread over the boundary, three slices and the bibliography.
Solution: a status header and a Summary a person can stop after. One fact per sentence, lists and tables where the content is a list or a table. Decisions cited with their names. Global diagrams in How it works. One Open table. The document gets longer and reads faster.

### The order does not hold
Cause: one slice writes a record inside its transaction, and the table for that record is created by the last slice in the order. Each slice reads fine alone.
Solution: for every slice, check that what it uses exists by the time it runs. Move the table to the slice that first writes it, or reorder.

### A gap left as silence
Cause: nobody said what success means, so the section was dropped. A target says "zero mismatches" and nothing in scope measures a mismatch. A name appears with no role. A screen in the handoff is cited by no slice.
Solution: the section stays and says what is undefined; the gap becomes a row in Open with who decides. Silence reads as "handled"; a row gets closed.

### The spec written inside the design
Cause: slices were written so an agent could implement from them without asking anything. Fifteen-row column tables with type and nullability, a behaviour row for every validation error, a field-by-field mapping, a list of the existing methods each slice touches. Every line is true and the document is twice its budget; nobody reads it in the meeting it was written for.
Solution: ask of each line whether two people could disagree about it and whether changing it later reaches outside the team. Keep the records and what relates them, the fields and responses that carry a decision, the flows of the doors. Leave the rest to the spec of the feature, which reads the code of the day and is allowed to ask.

### A check that was written down and not run
Cause: the document was reviewed against a list of questions by the person who wrote it. The header called it ready while a row in Open blocked the first slice; a slice applied a decision the index did not list for it; the flow diagram and the behaviour table of the same slice gave different answers.
Solution: run the validator, then give the document to a reader who was not in the room. Mechanical consistency is a script's job, and contradictions are invisible to their author.

### A provider fact from memory
Cause: a decision was built on how an external service behaves, written from what the author remembered. The documentation had since marked that path as legacy, and a second behaviour the design asserted was not documented at all.
Solution: read the provider's page for every behaviour a decision relies on, cite it, and look for the deprecation notice. What the page does not say becomes a spike.

### The input transcribed
Cause: a rich requirements document went in and came out reworded. Its usage figure was repeated as evidence although the data it cites does not record that dimension; its screen and question codes appeared with no definition; the design concluded a gap existed in code that an upstream check already closes.
Solution: what the input wants is taken as given; what it says about the system is checked in the repository first. Every code it uses is defined on the page or left out.

### The plan written inside the design
Cause: each slice lists files to touch, container tokens, method names, the order of `DELETE FROM` in the test suite, the union type on the screen.
Solution: identifier ceiling - route, table, column, class, glossary term. Below that is the plan's. The design says what will exist; the plan says what will be done.

### A diagram nobody checked
Cause: the entity diagram says every ledger entry has an Invoice; the code says Refund and Adjustment entries have none.
Solution: every diagram is read back against the repository before it lands. A picture is believed faster than prose, which is exactly why a wrong one costs more.

