# Socratic Questioning

Structured question frameworks for exposing assumptions and deepening understanding.

## Core Principle

Socratic questioning does not argue. It asks. The goal is to help the user discover gaps in their own reasoning by surfacing what they have not examined. Every question should create a moment of "I hadn't thought about that."

The agent must never answer the questions itself. Present them, let the user sit with them.

## The 6 Question Types

Research (NAACL 2024, ChemRxiv 2025) confirms these 6 types as the most effective for critical analysis in AI-assisted workflows.

### 1. Clarifying Questions

Force precision on vague or overloaded terms.

| Pattern | Example |
|---------|---------|
| "When you say X, what specifically do you mean?" | "When you say 'scalable,' do you mean 10x users or 1000x?" |
| "How would you define X to someone unfamiliar?" | "How would you explain 'real-time' to a non-engineer?" |
| "Are there cases where X means something different?" | "Does 'fast' mean the same thing for API response and batch job?" |

### 2. Assumption-Probing Questions

Surface hidden premises that the reasoning depends on.

| Pattern | Example |
|---------|---------|
| "What are you assuming here?" | "What has to be true for microservices to improve velocity?" |
| "Is this based on data or intuition?" | "Is the 'users hate the current flow' claim from research or assumption?" |
| "What would change your mind?" | "What metric would convince you this approach is wrong?" |
| "What are you treating as fixed that might be flexible?" | "Does the deadline have to be Q2, or is that an assumption?" |

### 3. Evidence-Probing Questions

Test the evidential basis for beliefs.

| Pattern | Example |
|---------|---------|
| "What evidence supports this?" | "What data shows users actually want this feature?" |
| "How do you know X is true?" | "How do you know the current system can't handle the load?" |
| "How large and representative is the sample?" | "Was the pilot tested on production-like data or sanitized staging data?" |
| "Is the source independent or interested?" | "Is that benchmark from a vendor or an independent test?" |

### 4. Implication Questions

Follow the logical consequences of the position.

| Pattern | Example |
|---------|---------|
| "If that's true, what follows?" | "If we accept this latency budget, what does that force on the database layer?" |
| "Does X necessarily lead to Y?" | "Does adding caching necessarily improve user experience?" |
| "What's the second-order effect?" | "If we hire contractors to speed up, what happens to team knowledge?" |
| "What becomes harder later?" | "What future feature becomes harder if we choose this schema?" |

### 5. Perspective-Shifting Questions

Force consideration of other viewpoints.

| Pattern | Example |
|---------|---------|
| "How would [stakeholder] see this?" | "How would the on-call engineer feel about this architecture?" |
| "What would a skeptic say?" | "What would a senior engineer who prefers simplicity say?" |
| "What does this look like in 2 years?" | "Will this abstraction still make sense when the team doubles?" |
| "Who loses if this succeeds?" | "If we adopt this vendor, what capability do we give up?" |

### 6. Meta-Questions

Examine the reasoning process itself.

| Pattern | Example |
|---------|---------|
| "Why are we framing it this way?" | "Why are we treating this as a technology decision instead of an organizational one?" |
| "What question are we NOT asking?" | "We've discussed performance — what about operability?" |
| "Are we solving the right problem?" | "Is the real problem the deploy pipeline or the coupling?" |
| "What would it take to change your mind?" (Kozyrkov's Magic Question) | "If I could prove X, would you reconsider?" |

## Assumption Detection Signals

Watch for language that hides assumptions. When you hear these, probe immediately.

| Signal Phrase | Hidden Assumption | Probe With |
|---------------|-------------------|------------|
| "Obviously..." | The speaker hasn't questioned this | "What makes this obvious? Has it been tested?" |
| "Everyone knows..." | Consensus hasn't been verified | "Who specifically? Has anyone disagreed?" |
| "It just makes sense..." | The reasoning chain hasn't been articulated | "Walk me through the logic step by step." |
| "We always..." | Historical pattern assumed to be optimal | "Why? What would happen if you didn't?" |
| "There's no other way..." | Alternatives haven't been explored | "What if there were? What would it look like?" |
| "It's simple..." | Complexity has been underestimated | "What's the simplest thing that could go wrong?" |
| "Users want..." | User research may be absent or stale | "How do you know? When was this last validated?" |
| "The standard approach is..." | Convention hasn't been validated for context | "Standard for whom? Does their context match yours?" |
| "We need to be careful..." | Risk aversion without quantified risk | "What specifically is the risk? How likely?" |

## Domain-Adapted Question Banks

### Technical Decisions

- What are you optimizing for? Are you sure that's the right dimension?
- What's the simplest version that tests the core assumption?
- What constraint are you treating as fixed that might actually be flexible?
- How would you build this if you had to ship in one week?
- What's the most expensive thing to change later?
- If you had to explain the failure mode to a non-technical executive, what would you say?

### Business Decisions

- Who is the customer for this decision? Are you sure?
- What would make this a bad investment in hindsight?
- How does this compare to doing nothing?
- What's the opportunity cost of this choice?
- If a competitor made the opposite choice, would you be worried?
- What's the maximum you'd pay a clairvoyant for perfect information on this? (Kozyrkov's Value of Clairvoyance test — if low, the decision doesn't need more analysis)

### Strategic Decisions

- What has to be true for this strategy to work?
- Which of those assumptions are you least confident about?
- What's the fastest way to test the riskiest assumption?
- How will you know if this is failing before it's too late?
- What's the exit strategy if this doesn't work?
- Frame this as a bet: what are you staking, at what odds, for what payoff?

## Output Template

```markdown
## Assumption Inventory

| # | Assumption | Type | Confidence | Source |
|---|-----------|------|------------|--------|
| 1 | [Stated or hidden assumption] | Stated / Unstated | High / Medium / Low | [Where it appears in the reasoning] |

## Probing Questions

### [Theme 1: e.g., "User Behavior"]
1. [Question targeting assumption #X] _(Type: Assumption-probing)_
2. [Follow-up question deepening the probe] _(Type: Implication)_

### [Theme 2: e.g., "Technical Feasibility"]
1. [Question targeting assumption #Y] _(Type: Evidence-probing)_
2. [Follow-up question] _(Type: Perspective-shifting)_

### [Theme 3: e.g., "Business Viability"]
1. [Question targeting assumption #Z] _(Type: Meta-question)_
2. [Follow-up question] _(Type: Clarifying)_

## Suggested Experiments

| Assumption | Experiment | Effort | Signal |
|-----------|-----------|--------|--------|
| [Riskiest assumption] | [How to test it] | Low/Med/High | [What result means] |
```
