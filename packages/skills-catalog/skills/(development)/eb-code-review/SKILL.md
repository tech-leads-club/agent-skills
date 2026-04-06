---
name: eb-code-review
description: "Multi-agent code review for pull requests. Checks for bugs, CLAUDE.md compliance, git history context, and previous PR comments. Uses confidence scoring to filter false positives. Use when the user wants to review a PR, code review, check a pull request, or mentions 'review my PR', 'code review', 'check this PR'. Also triggers when dev-workflow reaches the code review phase."
---

# Code Review — Multi-Agent PR Review

Provide a thorough, multi-perspective code review for pull requests using parallel agents with confidence-based filtering.

The goal is to find real, impactful bugs while avoiding false positives and nitpicks. A senior engineer wouldn't waste time on trivial issues — neither should this review.

## Process

Follow these steps precisely:

### 1. Eligibility Check (Haiku agent)

Check if the pull request: (a) is closed, (b) is a draft, (c) does not need review (automated PR, trivially simple), or (d) already has a code review from you. If any condition is true, stop.

### 2. Discover CLAUDE.md Files (Haiku agent)

Get file paths (not contents) of relevant CLAUDE.md files: the root CLAUDE.md and any CLAUDE.md files in directories whose files the PR modified.

### 3. Summarize the Change (Haiku agent)

View the pull request and return a summary of the change.

### 4. Parallel Review (5 Sonnet agents)

Launch 5 parallel agents. Each returns a list of issues with the reason each was flagged:

| Agent | Focus |
|-------|-------|
| **#1 — CLAUDE.md Compliance** | Audit changes against CLAUDE.md rules. Note: CLAUDE.md is guidance for code writing, so not all instructions apply during review. |
| **#2 — Bug Scan** | Shallow scan for obvious bugs in the diff only. Focus on large bugs. Avoid nitpicks. Ignore likely false positives. |
| **#3 — Git History** | Read git blame and history of modified code. Identify bugs in light of historical context. |
| **#4 — Previous PRs** | Read previous PRs that touched these files. Check for comments that may apply to the current PR. |
| **#5 — Code Comments** | Read code comments in modified files. Ensure changes comply with guidance in those comments. |

### 5. Confidence Scoring (parallel Haiku agents)

For each issue found, launch a Haiku agent that scores confidence 0-100:

| Score | Meaning |
|-------|---------|
| **0** | False positive. Doesn't hold up to scrutiny, or pre-existing issue. |
| **25** | Might be real, might be false positive. Unable to verify. Stylistic issues not in CLAUDE.md. |
| **50** | Verified real issue, but may be a nitpick or rare in practice. Not very important relative to the PR. |
| **75** | Double-checked and very likely real. Will be hit in practice. Existing approach is insufficient. Directly mentioned in CLAUDE.md. |
| **100** | Absolutely certain. Confirmed real, happens frequently. Evidence directly confirms. |

For CLAUDE.md issues, the agent must double-check that the CLAUDE.md actually calls out that issue specifically.

### 6. Filter

Discard issues scoring below **80**. If no issues remain, proceed to step 8 with "no issues found."

### 7. Re-check Eligibility (Haiku agent)

Repeat the eligibility check from step 1 to make sure the PR is still eligible.

### 8. Post Comment

Use `gh pr comment` to post the review. Keep it brief, no emojis, cite and link relevant code/files/URLs.

**Format (with issues):**

```markdown
### Code review

Found N issues:

1. <brief description> (CLAUDE.md says "<...>")

<link to file and line with full SHA + line range>

2. <brief description> (bug due to <file and code snippet>)

<link to file and line with full SHA + line range>
```

**Format (no issues):**

```markdown
### Code review

No issues found. Checked for bugs and CLAUDE.md compliance.
```

**Link format:** `https://github.com/owner/repo/blob/<full-sha>/path/to/file.ts#L10-L15`
- Must use full git SHA (not HEAD or short hash)
- Include 1 line of context before and after the issue
- Line range: `L[start]-L[end]`

## False Positives to Ignore

These are NOT real issues:
- Pre-existing issues (not introduced by this PR)
- Something that looks like a bug but isn't
- Pedantic nitpicks a senior engineer wouldn't mention
- Issues a linter, typechecker, or compiler would catch (imports, types, formatting)
- General code quality issues (coverage, docs) unless required by CLAUDE.md
- CLAUDE.md violations explicitly silenced in code (lint ignore comments)
- Intentional functionality changes related to the broader change
- Real issues on lines the user did not modify

## Notes

- Do NOT check build signal, build, or typecheck. Those run separately in CI.
- Use `gh` for all GitHub interactions (not web fetch)
- Make a todo list first to track progress
- Cite and link every bug (if from CLAUDE.md, link the specific file)
- Consult `references/review-patterns.md` for advanced review patterns including blast-radius analysis, structured output templates, and test coverage gap detection.
