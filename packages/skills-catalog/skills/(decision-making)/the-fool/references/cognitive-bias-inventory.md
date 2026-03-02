# Cognitive Bias Inventory

Structured bias detection for use during every challenge pass. Integrates findings from Fasolo, Heard & Scopelliti (2025) and the DeBiasMe metacognitive framework.

## Core Principle

Cognitive biases are not accusations — they are patterns in human reasoning that systematically distort judgment. The Fool's job is to flag when a bias may be influencing a decision, not to shame the user. Frame bias findings as: "This pattern is common in this type of decision, and here's how it might be affecting your reasoning."

## When to Use This File

Read this file on every challenge pass, regardless of mode. After generating your mode-specific challenges, scan the user's reasoning against this inventory. Weave bias findings into your challenges — do not present them as a separate "bias report."

## The Primary Bias Inventory

### Decision-Making Biases

| Bias | Description | Detection Signal | Debiasing Technique |
|------|-------------|-----------------|---------------------|
| **Confirmation bias** | Seeking evidence that confirms existing belief | Only positive evidence cited; no counter-evidence considered | "What evidence would you need to see to change your mind?" |
| **Anchoring** | Over-relying on first piece of information | First estimate unchanged despite new data; round numbers dominate | "Generate your own estimate BEFORE looking at others" |
| **Sunk cost fallacy** | Continuing because of past investment | "We've already spent 6 months on this" as justification to continue | "If you were starting fresh today with no prior investment, would you choose this?" |
| **Status quo bias** | Preferring current state despite evidence for change | "It's always been this way" or "changing is risky" without quantifying | "What is the cost of NOT changing? Is doing nothing really free?" |
| **Overconfidence** | Overestimating the accuracy of one's predictions | Point estimates instead of ranges; no contingency planning | "Give me a confidence interval: what's the 10th and 90th percentile outcome?" |
| **Planning fallacy** | Underestimating time, cost, and risk of future actions | Best-case estimates presented as likely; no buffer for unknowns | "What happened the last 3 times you estimated something similar?" |

### Social and Group Biases

| Bias | Description | Detection Signal | Debiasing Technique |
|------|-------------|-----------------|---------------------|
| **Groupthink** | Desire for conformity suppresses dissent | "The whole team agrees" with no documented dissent | "Was there a moment where someone almost disagreed? What stopped them?" |
| **Authority bias** | Deferring to authority regardless of evidence quality | "The CTO/architect/Google says so" as primary evidence | "If this proposal came from a junior engineer, would the evidence be sufficient?" |
| **Bandwagon effect** | "Everyone is doing it" as justification | Trend adoption without fitness assessment | "Is the reason everyone is doing it the same reason you should?" |
| **Survivorship bias** | Focusing on successes, ignoring failures | "All the successful companies do X" | "How many companies tried X and failed? What happened to them?" |

### Information Processing Biases

| Bias | Description | Detection Signal | Debiasing Technique |
|------|-------------|-----------------|---------------------|
| **Availability heuristic** | Overweighting recent or vivid examples | Decision based on one memorable incident | "What does the base rate data say? Is this incident representative or exceptional?" |
| **Dunning-Kruger** | Overconfidence in unfamiliar domain | Confident claims about areas outside expertise | "How much experience does the team have with this specific technology at this scale?" |
| **Framing effect** | Decision changes based on how the question is framed | Positive framing hiding negatives (or vice versa) | "Reframe: instead of '90% success rate,' say '10% failure rate.' Does that change the decision?" |
| **Recency bias** | Overweighting recent events | Last quarter's incident driving architecture decisions | "Is this a trend or an outlier? What does the 12-month data show?" |
| **Narrative fallacy** | Creating a coherent story from random events | Clean cause-and-effect narrative with no uncertainty | "What parts of this story are we connecting retroactively?" |

## Bias Detection Workflow

For each challenge pass, run this quick scan:

### Step 1: Check the Evidence Chain

- Is evidence selectively presented? → **Confirmation bias**
- Is the first data point dominating the analysis? → **Anchoring**
- Is a single vivid example driving the decision? → **Availability heuristic**
- Is the source of evidence interested in the outcome? → **Authority bias** or **vendor bias**

### Step 2: Check the Decision Frame

- Is past investment being used to justify continuing? → **Sunk cost fallacy**
- Is the status quo being treated as free? → **Status quo bias**
- Are estimates point values instead of ranges? → **Overconfidence**
- Is the timeline based on best-case? → **Planning fallacy**

### Step 3: Check the Social Dynamics

- Did "everyone agree" suspiciously fast? → **Groupthink**
- Is a senior person's opinion treated as evidence? → **Authority bias**
- Is "industry trend" the primary justification? → **Bandwagon effect**
- Are only success stories referenced? → **Survivorship bias**

## Bias Mitigation Techniques Summary

These are the gold-standard debiasing techniques (Fasolo et al. 2025, Nature Scientific Reports 2025):

| Technique | What It Does | When to Apply |
|-----------|-------------|---------------|
| **Reference class forecasting** | Use historical base rates instead of inside-view estimates | Any predictive claim or timeline estimate |
| **Pre-mortem** | Imagine failure first | Planning fallacy, overconfidence |
| **Red team / devil's advocate** | Structural dissent | Groupthink, confirmation bias |
| **Blind evaluation** | Strip names, titles, vendors from proposals | Authority bias, halo effect |
| **Probabilistic framing** | Force confidence intervals and probability ranges | Overconfidence, binary thinking |
| **Fresh-start framing** | "If starting today with no history, would you choose this?" | Sunk cost, status quo bias |
| **Inversion** | "What would guarantee failure?" | Confirmation bias, planning fallacy |
| **Seek disconfirming evidence** | Actively look for evidence AGAINST your position | Confirmation bias |
| **The Magic Question** | "What would it take to change your mind?" | All biases — tests commitment to evidence |

## Integration with Modes

| Mode | Most Common Biases to Check |
|------|---------------------------|
| Socratic Questioning | Confirmation bias, framing effect, narrative fallacy |
| Dialectic Synthesis | Status quo bias, authority bias, groupthink |
| Pre-mortem Analysis | Planning fallacy, overconfidence, survivorship bias |
| Red Team | Availability heuristic, anchoring, Dunning-Kruger |
| Evidence Audit | Confirmation bias, survivorship bias, authority bias |

## Anti-Patterns in Bias Communication

| Anti-Pattern | Problem | Better Approach |
|-------------|---------|-----------------|
| "You have confirmation bias" | Accusatory, triggers defensiveness | "I notice the evidence cited is all supportive — what does the counter-evidence look like?" |
| Listing 10 biases at once | Overwhelms, loses impact | Flag the 1-2 most relevant biases, woven into specific challenges |
| Using bias as a trump card | "You're biased therefore wrong" | Bias affects the reasoning process, not necessarily the conclusion |
| Naming the bias first | Academic tone alienates | Describe the pattern, then (optionally) name it |
