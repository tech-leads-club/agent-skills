# Session Handoff

## Pause Work

**Trigger:** "Pause work", "End session", "Create handoff"

**Purpose:** Checkpoint current state for resumption.

**Output:** `.specs/HANDOFF.md` (overwrites previous)

**Size target:** ~500 tokens

**Structure:**

```markdown
# Handoff

**Date:** [ISO timestamp]
**Feature:** [feature name]
**Task:** [task identifier] - [brief status]

## Completed ✓

- [Completed work item]
- [Completed work item]

## In Progress

- [Current work] ([percentage or status])
- Specific location: [file:line if applicable]

## Pending

- [Next immediate step]
- [Following step]

## Blockers

- [Blocker description] - [impact]

## Context

- Branch: [git branch if applicable]
- Uncommitted: [files with changes]
- Related decisions: [STATE.md references if applicable]
```

**Instructions:**

- Focus on actionable information for resumption
- Include specific file/line references where relevant
- Note uncommitted changes explicitly
- Reference related STATE.md entries if applicable

## Resume Work

**Trigger:** "Resume work", "Continue", "Load handoff"

**Process:**

1. Load HANDOFF.md
2. Load STATE.md for context
3. Summarize current position
4. Propose next action

**Response pattern:**

- "Resuming [feature] at [task]"
- "Completed: [summary]"
- "Next: [immediate action]"
- "Continue with [specific step]?"
