# Red Team Adversarial

Adversarial thinking and red teaming for finding weaknesses before adversaries do. Incorporates the military RED model (Recognize assumptions, Evaluate arguments, Draw conclusions) and modern red teaming methodologies.

## Core Principle

Red teaming asks: **"If someone wanted to break, exploit, or game this, how would they do it?"** The Fool adopts the mindset of an adversary — not to cause harm, but to find vulnerabilities before real adversaries do. This applies beyond security: competitors, disgruntled users, perverse incentives, and regulatory challenges are all adversarial forces.

## The RED Model

The U.S. Army Applied Critical Thinking Handbook's RED model provides a generalizable three-step checklist applicable to any adversarial analysis:

| Step | Action | Key Questions |
|------|--------|---------------|
| **R — Recognize Assumptions** | What are we taking for granted? | What would have to be true for this to be secure? What are we assuming about the adversary? |
| **E — Evaluate Arguments** | What is the evidence quality? | Are there logical fallacies? What alternative attack paths exist? |
| **D — Draw Conclusions** | What do the data actually support? | What conclusions are we NOT entitled to draw about our security posture? |

Apply RED before constructing adversary personas to ensure the analysis is grounded.

## Process

1. **Apply RED model** — Recognize assumptions about security/resilience, evaluate existing defenses, draw honest conclusions
2. **Identify the asset** — What are you protecting? (system, decision, strategy, product)
3. **Construct adversary personas** — Who would attack this and why?
4. **Map attack vectors** — How would each persona exploit weaknesses?
5. **Detect perverse incentives** — How does the system reward wrong behavior?
6. **Assess impact** — Rank by likelihood x impact
7. **Design defenses** — Specific countermeasures for the highest-ranked vectors

## Adversary Persona Construction

Generic "attackers" produce generic findings. Specific personas produce actionable insights.

### Persona Template

| Field | Description |
|-------|-------------|
| **Role** | Who is this adversary? |
| **Motivation** | Why would they attack? |
| **Capability** | What resources and skills do they have? |
| **Access** | What do they already have access to? |
| **Constraints** | What limits them? |

### Common Adversary Personas

| Persona | Motivation | Typical Vectors |
|---------|-----------|----------------|
| **External Attacker** | Financial gain, data theft | API exploitation, credential stuffing, injection attacks |
| **Competitor** | Market advantage | Feature copying, talent poaching, FUD campaigns |
| **Disgruntled Insider** | Revenge, financial gain | Privilege escalation, data exfiltration, sabotage |
| **Careless User** | None (accidental) | Misconfiguration, weak passwords, sharing credentials |
| **Regulator** | Compliance enforcement | Audit findings, data handling violations, accessibility gaps |
| **Opportunistic Gamer** | Personal benefit | Exploiting loopholes in business logic, referral fraud |
| **Activist** | Ideological goals | Public embarrassment, data leaks, service disruption |
| **AI Agent** | Automated exploitation | Prompt injection, API abuse at scale, automated vulnerability scanning |

### Domain-Specific Personas

| Domain | Key Adversary | Focus |
|--------|--------------|-------|
| E-commerce | Fraudster | Payment bypass, coupon abuse, fake returns |
| SaaS | Free-tier abuser | Rate limit evasion, multi-accounting, resource hoarding |
| Marketplace | Bad-faith seller | Fake listings, review manipulation, escrow games |
| API Platform | Scraper | Rate limit bypass, data harvesting, reverse engineering |
| Social Platform | Troll/bot farm | Spam, manipulation, fake engagement |
| AI/ML System | Adversarial attacker | Data poisoning, model extraction, prompt injection |

## Attack Vector Identification

### By Category

| Category | Vectors | Example |
|----------|---------|---------|
| **Technical** | Injection, auth bypass, race conditions, SSRF | SQL injection in search parameter |
| **Business Logic** | Workflow bypass, state manipulation, price tampering | Applying expired coupon via API replay |
| **Social** | Phishing, pretexting, authority exploitation | "I'm the CEO, I need access now" |
| **Operational** | Supply chain, dependency poisoning, insider threat | Compromised npm package in build pipeline |
| **Information** | Data leakage, metadata exposure, timing attacks | User enumeration via login error messages |
| **Economic** | Resource exhaustion, denial of wallet, asymmetric cost | Lambda invocation flood causing $50K bill |
| **AI-Specific** | Prompt injection, training data extraction, model manipulation | Injecting instructions via user-controlled content |

### Attack Tree Construction

For complex systems, build attack trees to map paths to a goal.

```
Goal: Steal user payment data
├── Path 1: Compromise the database
│   ├── SQL injection in search endpoint
│   ├── Credential theft from env variables in logs
│   └── Exploit unpatched database CVE
├── Path 2: Intercept in transit
│   ├── Downgrade TLS via misconfigured CDN
│   └── Man-in-the-middle on internal service mesh
└── Path 3: Abuse application logic
    ├── Export feature with insufficient access control
    └── Admin panel with default credentials
```

### The 12 Rules of the Red Team Mindset

Adapted from ITS Tactical for decision analysis:

1. Assume the obvious answer is wrong
2. Seek disconfirming evidence actively
3. Never accept the first answer
4. Treat consensus as a warning sign, not a conclusion
5. Distinguish between what is known vs. what is assumed
6. Identify what the defender is NOT protecting
7. Find the single point of failure
8. Exploit the gap between policy and practice
9. Think in time — what's the window of opportunity?
10. Consider the second and third order effects of your attack
11. Map the incentives — follow the money, the ego, the convenience
12. Test the assumption that "no one would ever do that"

## Perverse Incentive Detection

Systems create incentives. Sometimes those incentives reward the wrong behavior.

### Questions to Surface Perverse Incentives

| Question | What It Reveals |
|----------|----------------|
| "How will people game this?" | Loopholes in business logic |
| "What behavior does this reward that we don't want?" | Misaligned incentives |
| "What's the cheapest way to get the reward without the effort?" | Shortcut exploitation |
| "If we measure X, what Y gets sacrificed?" | Goodhart's Law in action |
| "Who benefits from this failing?" | Adversaries with motive |
| "What would a lazy but clever person do?" | Path of least resistance exploits |

### Common Perverse Incentive Patterns

| Pattern | Example | Consequence |
|---------|---------|-------------|
| Metric gaming | "Lines of code" as productivity metric | Verbose, unmaintainable code |
| Reward hacking | Referral bonus with no verification | Fake accounts for self-referral |
| Race to the bottom | "Fastest response time" as SLA | Teams avoid taking complex tickets |
| Cobra effect | Bounty for reporting bugs | Team introduces bugs to claim bounties |
| Information asymmetry | Users know more than the system | Adverse selection in marketplace pricing |
| Goodhart's Law | Any target metric becomes the optimization goal | Metric improves, actual outcome deteriorates |

## Competitive Response Analysis

When the "adversary" is a competitor.

| Scenario | Analysis Framework |
|----------|-------------------|
| Feature parity | What can they copy? How fast? What's our defensible moat? |
| Price war | Can they sustain lower prices? What's their cost structure? |
| Talent poaching | Which roles are critical? How replaceable? What's our retention advantage? |
| Platform risk | Are we dependent on their platform? What's the switch cost? |
| FUD campaign | What claims could they make? Which are hardest to refute? |

## Output Template

```markdown
## Red Team Analysis: [Target]

### RED Model Assessment

| Step | Finding |
|------|---------|
| **Recognize Assumptions** | [Key assumptions about security/resilience] |
| **Evaluate Arguments** | [Quality of evidence for current defenses] |
| **Draw Conclusions** | [Honest assessment of actual posture] |

### Asset Under Assessment

[What we're protecting and why it matters]

### Adversary Profiles

#### Adversary 1: [Name/Role]
- **Motivation:** [Why they attack]
- **Capability:** [What they can do]
- **Access:** [What they start with]

#### Adversary 2: [Name/Role]
- **Motivation:** [Why they attack]
- **Capability:** [What they can do]
- **Access:** [What they start with]

### Attack Vectors (Ranked)

| # | Vector | Adversary | Likelihood | Impact | Risk Score |
|---|--------|-----------|-----------|--------|------------|
| 1 | [Specific attack] | [Who] | High/Med/Low | High/Med/Low | [L x I] |
| 2 | [Specific attack] | [Who] | High/Med/Low | High/Med/Low | [L x I] |
| 3 | [Specific attack] | [Who] | High/Med/Low | High/Med/Low | [L x I] |

### Perverse Incentives

| Incentive Created | Unintended Behavior | Severity |
|-------------------|-------------------|----------|
| [What the system rewards] | [How it gets gamed] | High/Med/Low |

### Recommended Defenses

| Attack Vector | Defense | Effort | Priority |
|--------------|---------|--------|----------|
| #1 | [Specific countermeasure] | Low/Med/High | Immediate/Next sprint/Backlog |
| #2 | [Specific countermeasure] | Low/Med/High | Immediate/Next sprint/Backlog |
| #3 | [Specific countermeasure] | Low/Med/High | Immediate/Next sprint/Backlog |
```
