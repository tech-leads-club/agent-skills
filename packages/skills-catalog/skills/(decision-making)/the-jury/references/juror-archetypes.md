# Juror Archetypes

Read this during Phase 1 to assemble the panel. The goal is a set of jurors whose blind spots differ, because uncorrelated errors are the whole reason a panel beats a single agent. Same-viewpoint panels behave like one juror wearing five hats.

## Table of contents

1. Panel size
2. The three mandatory roles
3. Orthogonality: how to pick a decorrelated panel
4. Persona library by domain
5. Breaking identical inputs

## 1. Panel size

- **3 jurors**: default for most decisions. Proponent, Devil's advocate, Integrator.
- **5 jurors**: high-stakes, multi-dimensional, contested, or when a panel of 3 splits and you re-run. Add two domain personas.
- **Odd is better**: 3 or 5 avoids clean ties.
- **Hard cap 5**: beyond 5, jurors mostly repeat each other. Real independence plateaus fast (a large panel can behave like two effective voters because of correlated errors), so more jurors buys cost and noise, not accuracy.

## 2. The three mandatory roles

Every panel, regardless of domain, has these three. They are roles, layered on top of a persona and a lens.

- **Proponent**: argues the strongest case FOR the leading option or the claim under review. Not a cheerleader; it must ground the case in evidence.
- **Devil's advocate**: argues the strongest case AGAINST, or for the best alternative. Mandatory and non-negotiable. A designated dissenter reduces conformity even when its argument is imperfect, because the mere presence of dissent stops the group from collapsing onto the first confident answer. This is the single cheapest defense against groupthink.
- **Integrator**: owns the rubric. Weighs both sides against the criteria, refuses to converge early, and is the juror most responsible for surfacing unresolved tradeoffs rather than papering over them.

For a panel of 5, keep these three and add two domain personas below.

## 3. Orthogonality: how to pick a decorrelated panel

The active ingredient is difference, not headcount. When choosing the two extra personas for a panel of 5, pick lenses that fail differently:

- One that optimizes for the upside (opportunity, speed, ceiling).
- One that optimizes for the downside (risk, failure modes, blast radius).
- Avoid two personas that would flag the same problems. If two personas would write nearly the same Round 1 block, replace one.
- Prefer specific practitioner personas over generic "smart reviewer". Narrow practitioner personas individually score a bit worse but their errors are less correlated, which yields a larger net gain when the panel aggregates.
- If your runtime can use different underlying models per juror, do it. Cross-model panels decorrelate more than same-model panels, and a same-model panel tends to favor its own reasoning style.

## 4. Persona library by domain

Pick a persona per juror. Pair each persona with one lens from `deliberation-craft.md`. These are starting points; adapt names and concerns to the actual question.

### Engineering and architecture

- **Pragmatic builder**: ships the simplest thing that works; suspicious of speculative generality. Lens: assumption-surfacing.
- **Reliability and ops engineer**: on-call at 3am; cares about failure modes, rollback, blast radius, observability. Lens: pre-mortem.
- **Security and adversary**: assumes hostile input and misuse. Lens: red-team.
- **Cost and FinOps**: total cost of ownership, spend at scale, waste. Lens: evidence-audit.
- **Maintainer**: inherits this in two years; cares about complexity, coupling, cognitive load. Lens: second-order consequences.
- **Performance and scale**: cares about latency, throughput, and behavior at 10x volume. Lens: evidence-audit.

### Data, ML, and analytics

- **Statistician / methodologist**: sample size, confounders, leakage, significance vs noise. Lens: evidence-audit.
- **Domain expert**: knows what the numbers mean in the real process; catches nonsense metrics. Lens: assumption-surfacing.
- **Data-quality skeptic**: distrusts the pipeline, the labels, and the freshness. Lens: red-team.
- **Decision owner**: cares whether the analysis actually changes an action, not whether it is elegant. Lens: second-order consequences.
- **Reproducibility auditor**: can someone rerun this and get the same answer. Lens: pre-mortem.

### Product and design

- **User advocate**: the person who has to live with this; cares about the actual job to be done. Lens: assumption-surfacing.
- **Growth / metrics**: activation, retention, and the number that is supposed to move. Lens: evidence-audit.
- **Support and edge cases**: the 5 percent who break things and file tickets. Lens: red-team.
- **Roadmap strategist**: opportunity cost against everything else not being built. Lens: second-order consequences.

### Strategy, business, vendor, build-vs-buy

- **Operator / pragmatist**: what actually gets executed with the team and time on hand. Lens: pre-mortem.
- **Finance**: unit economics, 3-year cost, switching cost, lock-in. Lens: evidence-audit.
- **Contrarian strategist**: what if the market or assumption inverts. Lens: red-team.
- **Customer / stakeholder**: whose problem this really solves and who pays. Lens: assumption-surfacing.
- **Second-order thinker**: what this decision makes true 18 months out. Lens: second-order consequences.

### Hiring and people decisions

- **Bar raiser**: consistency against the standard, not against the other candidates in the batch. Lens: evidence-audit.
- **Team-fit realist**: how this changes the actual team dynamics and load. Lens: second-order consequences.
- **Skeptic**: what the interview did NOT test; where the signal is thin. Lens: assumption-surfacing.
- **Risk**: worst plausible outcome of a wrong yes and a wrong no. Lens: pre-mortem.

### Research and experiment design

- **Methodologist**: internal and external validity, the actual claim being tested. Lens: evidence-audit.
- **Falsifier**: what result would prove this wrong, and is the design able to produce it. Lens: red-team.
- **Prior-art / novelty**: is this already answered, is the delta real. Lens: assumption-surfacing.
- **Impact realist**: if this succeeds, what changes. Lens: second-order consequences.

## 5. Breaking identical inputs

Even though every juror gets the same shared evidence, identical prompts across jurors waste the panel: debate over identical inputs adds no expected correctness. Force difference in three cheap ways:

1. **Distinct primary concern**: state one different thing each juror should weight most (from its persona). This alone breaks the identical-input condition.
2. **Distinct lens**: each juror runs a different critical method, so the same facts get interrogated differently.
3. **Optional evidence emphasis**: when the question has separable evidence streams (for example, cost data vs incident history vs user interviews), point different jurors at different streams as their primary, while still giving all of them the full context. Do not starve a juror of facts; only change the emphasis.
