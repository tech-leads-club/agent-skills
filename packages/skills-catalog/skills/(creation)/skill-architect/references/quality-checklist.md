# Quality Checklist

Use this checklist at the end of the Validate phase to ensure the skill
meets all quality criteria before delivery.

---

## Structural Checks (Pass/Fail)

These are hard requirements. Any failure must be fixed.

- [ ] SKILL.md exists with exact casing
- [ ] YAML frontmatter has opening and closing `---` delimiters
- [ ] `name` field is present and kebab-case
- [ ] `name` matches the folder name
- [ ] `description` field is present
- [ ] `description` is under 1024 characters
- [ ] `description` contains no XML angle brackets (< >)
- [ ] `name` does not contain "claude" or "anthropic"
- [ ] No README.md inside the skill folder
- [ ] Folder name is kebab-case (no spaces, no capitals, no underscores)

## Description Quality (Score 1-5)

Rate each and target 4+ on all:

- [ ] **Specificity (1-5):** Does it describe a concrete capability?
- [ ] **Trigger clarity (1-5):** Would the agent know when to load this?
- [ ] **User language (1-5):** Does it use phrases a user would actually say?
- [ ] **Scope boundaries (1-5):** Is it clear what this skill does NOT do?
- [ ] **Pushiness (1-5):** Is it assertive enough to avoid undertriggering?

## Instruction Quality (Score 1-5)

- [ ] **Actionability (1-5):** Can the agent follow every step without ambiguity?
- [ ] **Specificity (1-5):** Are instructions concrete (not "validate properly")?
- [ ] **Examples (1-5):** Are there realistic input/output examples?
- [ ] **Error handling (1-5):** Are common failures addressed?
- [ ] **Progressive disclosure (1-5):** Is SKILL.md focused, with details in refs?
- [ ] **Composability (1-5):** Does it play well with other skills?

## Trigger Testing

### Should trigger (test 3-5 phrases)

1. [ ] "[Obvious request]" → triggers? Y/N
2. [ ] "[Paraphrased request]" → triggers? Y/N
3. [ ] "[Informal request]" → triggers? Y/N

### Should NOT trigger (test 3-5 phrases)

1. [ ] "[Unrelated task]" → stays silent? Y/N
2. [ ] "[Similar but different scope]" → stays silent? Y/N
3. [ ] "[Generic question]" → stays silent? Y/N

## Performance Targets

Aspirational benchmarks (adapt to your skill):

- [ ] Triggers on ≥90% of relevant queries
- [ ] Completes workflow without user correction
- [ ] Consistent results across separate sessions
- [ ] No failed tool/API calls per workflow
- [ ] Users don't need to prompt the agent about next steps

## Final Sign-Off

- [ ] User has reviewed the skill
- [ ] Test phrases produce expected behavior
- [ ] Skill is packaged and ready for upload
