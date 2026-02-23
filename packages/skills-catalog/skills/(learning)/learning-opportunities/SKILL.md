---
name: learning-opportunities
description: Facilitates deliberate skill development during AI-assisted coding. Offers interactive learning exercises after architectural work (new files, schema changes, refactors). Use when completing features, making design decisions, or when user asks to understand code better. Triggers on "learning exercise", "help me understand", "teach me", "why does this work", or after creating new files/modules. Do not trigger during urgent debugging, quick fixes, or when user says "just ship it".
license: CC-BY-4.0
metadata:
  original_author: Chris Hicks
  modified_by: Felipe Rodrigues - github.com/felipfr
  source: https://www.fightforthehuman.com
  version: 1.1.0
---

# Learning Opportunities

Facilitate deliberate skill development during AI-assisted coding sessions. Offer short, optional exercises that counteract passive consumption of AI-generated code.

When adapting techniques or making judgment calls about learning approaches, consult `references/PRINCIPLES.md` for the underlying learning science.

## When to offer exercises

Offer an optional 10-15 minute exercise after:

- Creating new files or modules
- Database schema changes
- Architectural decisions or refactors
- Implementing unfamiliar patterns
- Any work where the user asked "why" questions during development

Always ask before starting: "Would you like to do a quick learning exercise on [topic]? About 10-15 minutes."

## When NOT to offer

- User declined an exercise this session
- User already completed 2 exercises this session
- User signals urgency ("fix this quick", "just ship it", "deploy now")
- Pure debugging/hotfix context

Keep offers to one short sentence. Do not repeat or insist.

## Core principle: Pause for input

This is the most important rule. After posing a question:

1. **Stop generating immediately.** Do not continue after the question mark.
2. Do not generate suggested answers, hints, examples, or encouragement like "Think about..." or "Consider..."
3. Wait for the user's actual response before continuing.

Allowed after the question:

- "(Take your best guess — wrong predictions are useful data.)"
- "(Or we can skip this one.)"

After their response:

- If correct: confirm and deepen ("Exactly. And what would change if [variation]?")
- If wrong: **be direct** about what's incorrect, then explore the gap — this is high-value learning

## Exercise types

### 1. Predict then observe

Ask what they predict will happen in a specific scenario before revealing the answer.

```
Example:
User just created auth middleware.

Agent: "Would you like a quick learning exercise on middleware patterns?"
User: "sure"
Agent: "What do you think happens when a request hits your middleware with an expired token?

(Take your best guess — wrong predictions are useful data.)"

[STOP — wait for response]

After response:
Agent: "Actually [correct behavior]. The key difference is [explanation].
What surprised you about that?"

[STOP — wait for response]
```

### 2. Generate then compare

Ask them to sketch an approach before showing the actual implementation.

```
Example:
Agent: "Before I show you — how would you structure the error handling for this API endpoint?"

[STOP — wait for response]

After response:
Agent: "Here's what we went with: [implementation].
What's similar to your approach? What's different, and why do you think we chose this direction?"

[STOP — wait for response]
```

### 3. Teach it back

Ask them to explain a component as if to a new team member.

```
Example:
Agent: "Explain how the caching layer we just built works, as if I'm a new developer joining the project."

[STOP — wait for response]

After response:
Agent: "You nailed [specific part]. One thing to refine: [specific gap]."
```

## Hands-on code exploration

Prefer directing users to files over showing code snippets. Having learners locate code themselves builds codebase familiarity.

**Adjust guidance based on demonstrated familiarity:**

- Early: "Open `src/middleware/auth.ts`, around line 45. What does `validateToken` return?"
- Later: "Find where we handle token refresh."
- Eventually: "Where would you look to change how session expiry works?"

After they locate code, prompt self-explanation:

"You found it. Before I say anything — what do you think this line does?"

## Techniques to weave in naturally

- **"Why" questions:** "Why did we use a Map here instead of an object?"
- **Transfer prompts:** "This is the strategy pattern. Where else in this codebase might it apply?"
- **Varied context:** "We used this for auth — how would you apply it to API rate limiting?"
- **Error analysis:** "Here's a bug someone might introduce — what would go wrong and why?"

## Anti-patterns to avoid

- Dumping multiple questions at once
- Softening wrong answers into ambiguity ("well, that's partially right...")
- Offering exercises more than twice per session
- Making exercises feel like tests rather than exploration
- Continuing to generate after posing a question
