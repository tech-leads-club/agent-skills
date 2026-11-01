# Coding Principles

A behavioural bias, not a checklist. Read it before every implementation.

---

## Before Coding

- State your assumptions. When you are unsure and the choice is the user's, ask.
- Several readings exist? Name them all. Never pick one in silence.
- A simpler approach exists? Say so, and push back when it is warranted.
- The user's approach looks wrong? Disagree honestly. Agreement you do not hold helps nobody.

---

## During Implementation

### Simplicity

- No feature beyond the request.
- No abstraction for code used once.
- No flexibility or configuration nobody asked for.
- No error handling for a state that cannot happen.
- 200 lines that could be 50? Rewrite them.

### Surgical Changes

- Do not improve adjacent code, comments or formatting.
- Do not refactor what is not broken.
- Match the existing style, even when you would write it differently.
- Mention unrelated dead code. Do not delete it.
- Remove only the imports, variables and functions your change orphaned.

### Test Integrity

`check_commit.py` refuses most of these on the commit. The rules hold anyway.

- Never weaken an assertion to make it pass.
- Never delete a test to reduce the failure count.
- Never use the framework's skip or pending mechanism to get past a failing test.
- Never change a task's tests afterwards to make the code pass.
- When a test is wrong per the spec, stop and confirm with the user before you change it.
- The tests are the spec. The code conforms to the tests, never the reverse.

### Goal-Driven

- Turn a vague task into a goal you can check.
- Every changed line traces to the request.

---

## After Each Change

Ask: "Would a senior engineer call this overcomplicated?" If yes, simplify before you go on.

---

## Writing Rules

These rules hold this skill's own text, and every artifact it writes: specs, decisions, reports, commit bodies and summaries. `lint_prose.py` checks the skill's text on every `selftest.py` run. Each rule is a count or an exact match.

1. **At most 20 words per sentence.** A longer sentence carries two ideas. Split it.
2. **At most 6 sentences per paragraph, list item or table cell.** Each paragraph holds one topic.
3. **No semicolons.** A semicolon joins two sentences. Write two.
4. **No `e.g.`, `i.e.`, `etc.`, `vs.` or `cf.`** Their periods read as the end of a sentence. Write "such as", "that is" or "and others".
5. **No em dash or en dash.** A dash usually hides a second sentence. Use a comma, a colon or a full stop.
6. **One term for one thing.** The skill calls each thing by one name:
   - "criterion" and "criteria", never `AC` or `acceptance criterion`
   - "sub-agent", never `subagent`
   - "user" for the person the skill serves, never `human`
   - "author" for whoever writes the plan or the code, never `builder` or `implementer`

Then write in a decided voice:

- **Lead with the verdict.** A report opens with PASS or FAIL and the one thing that matters.
- **State decisions as decisions.** Write "we will", never "we might". A decision that still hedges is not one yet.
- **Use active voice and the plain verb.** Write "evaluated", never "performed an evaluation of". Name who acts.
- **Cut filler.** Drop "it is worth noting", "as you can see" and "in order to". Keep hedging for real uncertainty.
- **Do not announce the phase.** Produce the artifact instead of narrating "I will now run Specify".
- **In Portuguese**, keep sentences short. Do not carry long chains of subordinate clauses into the artifact.

None of this simplifies the content. It simplifies only the prose that carries it.
