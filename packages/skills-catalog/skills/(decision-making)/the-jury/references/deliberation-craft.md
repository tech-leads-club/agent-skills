# Deliberation Craft

Read this before Phase 1 (to assign lenses) and keep it open through Phase 3 (for the prompt templates). This file carries the critical rigor of `the-fool` into the jury room, plus the operational guards that keep deliberation from degrading the answer, plus copy-ready prompts.

## Table of contents

1. The steelman requirement (universal)
2. The five assignable lenses
3. Evidence grading
4. Cognitive-bias checklist
5. Anti-anchoring and anti-sycophancy guards
6. Round 1 prompt template (blind)
7. Round 2 prompt template (deliberation)
8. Evidence base (2025 to 2026)

## 1. The steelman requirement (universal)

Every juror, in Round 2, must restate the strongest opposing position in its most convincing form BEFORE arguing against it. Attacking a weak version of the other side (strawman) is the fastest way to a confident wrong verdict. The Proponent and Devil's advocate roles are the dialectic made explicit: one builds the thesis, one builds the antithesis, and the Integrator drives the synthesis.

## 2. The five assignable lenses

Assign one lens per juror in Phase 1. The lens is the critical method the juror uses to interrogate the shared evidence. Apply the method; do not name-drop it to the user.

- **Assumption-surfacing (Socratic)**: relentlessly ask what is being taken for granted. List the unstated premises the position depends on, then ask which of them are actually established versus merely assumed. Output: an assumption inventory, each tagged established or assumed.
- **Pre-mortem**: assume it is N months later and the decision failed. Write the specific failure narrative and trace the second-order chain (the failure causes X, which causes Y). Concrete stories, not "it might not work". Output: 2 to 3 failure narratives with consequence chains.
- **Red-team**: adopt an adversary or a worst-case user. How is this exploited, gamed, misused, or broken on purpose? Output: attack vectors and the conditions that trigger them.
- **Evidence-audit (falsification)**: for the leading position, ask what evidence would prove it wrong, whether that evidence was even sought, and how strong the supporting evidence actually is. Grade every key claim on the A to D scale below. Output: a graded evidence table and the single weakest link.
- **Second-order consequences**: ignore the immediate effect and reason about what the decision makes true 6 to 18 months out, including incentives it creates and doors it closes. Output: the downstream state and any one-way-door warnings.

## 3. Evidence grading

Jurors grade the evidence behind their position in Round 1, and the evidence-audit juror grades the leading claim. Scale:

- **A (strong)**: direct data, a proof, a reproducible result, or a first-hand measurement.
- **B (moderate)**: solid reasoning from established facts, or indirect but reliable data.
- **C (weak)**: plausible but thin; a single source, a small sample, or an untested inference.
- **D (anecdotal or assumed)**: a story, a vibe, or an unverified assumption stated as fact.

The foreman uses grades to break ties and to cap confidence. A verdict resting on C and D evidence cannot be HIGH confidence no matter how the vote lands.

## 4. Cognitive-bias checklist

Each juror self-scans in Round 2, and the foreman scans the whole panel in Phase 4. Frame biases as patterns to correct, never as accusations. Watch for:

- **Anchoring**: the position is stuck on the first number or framing seen.
- **Confirmation**: only evidence that supports the position was gathered.
- **Sunk cost**: the argument leans on past investment rather than future value.
- **Availability**: a recent or vivid event is over-weighted.
- **Bandwagon / groupthink**: agreement is tracking the apparent majority rather than the argument.
- **Authority / backbone bias**: a position is favored because of who (or which model) stated it.
- **Overconfidence**: stated confidence outruns the evidence grade.
- **Base-rate neglect**: the specific story ignores how often this kind of thing actually succeeds or fails.

If a juror's own reasoning trips one of these, it must say so and adjust. If the foreman sees the panel converging via bandwagon or authority bias, that convergence is SUSPECT (see next section).

## 5. Anti-anchoring and anti-sycophancy guards

These are the mechanical defenses that make the panel worth more than one agent. Do not weaken them for speed.

- **Blind Round 1**: no juror sees another's opinion before committing its own. This protects the diversity of initial positions, which matters because the group's final answer tends to stay inside the envelope of the initial spread. A narrow initial spread caps how good the verdict can get.
- **Anonymization in deliberation**: strip identities and relabel positions neutrally. Identity leakage drives same-backbone favoritism and social deference.
- **Flip-must-cite**: a juror may change its mind, but only with a specific cited new argument or piece of evidence. Log the reason.
- **Bandwagon signature**: if flips are uncited, or if every flip moves toward the earliest-stated majority, the convergence is persuasion, not reasoning. Mark the deliberation SUSPECT and fall back to the independent Round 1 confidence-weighted aggregate at LOW confidence. Independent aggregation frequently beats degraded deliberation, so this fallback is a feature, not a failure.
- **Adaptive stop and 2-round cap**: stop as soon as positions are stable. Extra rounds mostly amplify conformity. Never exceed 2 deliberation rounds.

## 6. Round 1 prompt template (blind)

Fill the braces and send to each juror independently, in parallel. Do not include any other juror's content.

```
You are a juror on a decision panel. You are deciding independently and will NOT see other jurors yet.

DECISION FRAME:
{decision_frame_with_options_or_claim}

RUBRIC (score against these criteria):
{criteria}

SHARED EVIDENCE:
{facts_constraints_context}

YOUR ROLE: {Proponent | Devil's advocate | Integrator | domain persona}
YOUR PERSONA: {persona_and_its_primary_concern}
YOUR LENS (apply this method, do not name it): {assumption-surfacing | pre-mortem | red-team | evidence-audit | second-order}

Return ONLY this block:
POSITION: <pick one option / take a clear stance; "it depends" is not allowed>
ARGUMENTS: <2 to 4 concrete, grounded points from your lens; no vague what-ifs>
EVIDENCE_GRADE: <A | B | C | D for the evidence behind your position, with a one-line justification>
ASSUMPTIONS: <what must be true for your position to hold>
CONFIDENCE: <0 to 100>
```

## 7. Round 2 prompt template (deliberation)

Anonymize all Round 1 positions first (Position 1, Position 2, ...), then send the full anonymized set to each juror.

```
You are the same juror. Here are all positions from Round 1, anonymized. You do not know who wrote which.

ANONYMIZED POSITIONS:
{position_1}
{position_2}
{position_3}
...

Do the following, in order:
1. STEELMAN: restate the strongest position that opposes yours, in its most convincing form.
2. REBUT: give your strongest counter to it, grounded and specific.
3. CHANGE-MY-MIND: state exactly what evidence or argument would flip you.
4. BIAS-CHECK: name any bias in your own Round 1 reasoning (anchoring, confirmation, sunk cost, bandwagon, overconfidence, base-rate neglect) and adjust if needed.
5. FINAL: hold or revise.

Return ONLY this block:
FINAL_POSITION: <option / stance>
FINAL_CONFIDENCE: <0 to 100>
CHANGED: <yes | no>
FLIP_REASON: <if changed: the specific new argument or evidence that moved you; if you cannot name one, do not change>
```

## 8. Evidence base (2025 to 2026)

This protocol is grounded in recent multi-agent and LLM-jury research. Summarized in plain terms, not for recitation to the user:

- Panels of diverse evaluators beat a single strong judge, but the benefit comes from diversity, not from the act of debating. Homogeneous panels rarely beat simple baselines.
- Debate over identical inputs does not improve expected correctness (it behaves like a martingale). Distinct lenses, personas, and evidence emphasis are what make a panel productive.
- Deliberation can make a correct answer worse through persuasion and conformity: confidently wrong agents can flip correct ones. Independent aggregation with confidence-weighted voting is a strong, robust baseline and is the correct fallback when deliberation shows bandwagon signs.
- Agents anchor on their initial opinion, and group updates stay inside the convex hull of the initial positions (Friedkin-Johnsen style dynamics). Hence the blind, diverse first round is the most important gate.
- A designated devil's advocate reduces conformity, even when its argument is imperfect.
- Anonymizing positions reduces identity bias, including the tendency to favor one's own model's reasoning.
- Correlated errors cap the real independence of a same-model panel (a panel of nine can act like an effective two), and standard aggregation cannot close that Condorcet gap. Therefore consensus is weak proof, and verdict confidence must be calibrated to real diversity.
- Confidence-weighted consensus tends to beat plain majority voting for capable models, but self-reported confidence from small or weak models can be uninformative, so weight it with the evidence grade rather than trusting the number alone.
- Adaptive stopping (halt once positions stabilize) beats running a fixed large number of rounds, which mostly amplifies conformity.
