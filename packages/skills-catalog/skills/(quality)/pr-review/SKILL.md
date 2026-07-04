---
name: pr-review
description: Reviews a GitHub pull request and posts inline comments plus one consolidated summary, adapting to any codebase by discovering the project's own test runner, requirement specs, and architecture conventions before running six specialized review agents in parallel. Stack-agnostic across language and framework; targets GitHub PRs via the gh CLI. Use when the user says "review PR #N", "review this PR", "code review this PR", or "check this pull request". Do NOT use for creating PRs or responding to review comments (use gh-address-comments), or debugging failing CI checks (use gh-fix-ci).
license: CC-BY-4.0
disable-model-invocation: true
metadata:
  author: github.com/augusto-dmh
  version: '1.0.0'
---

# PR Review — Adaptive Orchestration Protocol

Coordinates 6 specialized subagents (via the Task tool), then consolidates their findings into one summary. This skill is **stack-agnostic**: it owns no rules of its own. Instead it discovers what the project already documents — test runner, requirement specs, architecture conventions, project-local review skills — and each subagent loads and applies **whatever that project actually has**. It never invents stack-specific rules and never duplicates project docs.

**Host prerequisite:** operates on GitHub pull requests via the `gh` CLI — every fetch and post below uses `gh`. "Stack-agnostic" means language- and framework-agnostic, **not** host-agnostic: a GitLab/Bitbucket-hosted repo (which has MRs, not PRs) is out of scope.

Explicit invocation only (`disable-model-invocation: true`). Never auto-trigger during coding.

## Step 1: Initialize

### 1a. PR context

1. Resolve PR number from the user's request; ask if absent.
2. Identify repo: `gh repo view --json nameWithOwner -q .nameWithOwner` → `{REPO}`.
3. Fetch the diff: `gh pr diff {PR}`. Get the head SHA: `gh pr view {PR} --json headRefOid -q .headRefOid` → `{SHA}` (required to anchor inline comments).
4. Load existing inline comments: `gh api repos/{REPO}/pulls/{PR}/comments` — build a set of `{id, path, line}` records: use `{path, line}` to avoid reposting, keep each body to detect now-resolved issues, and keep each `id` to post a threaded reply.
5. Read PR intent: `gh pr view {PR} --json title,body,headRefName`.

### 1b. Project discovery (the adaptive spine)

Probe the repo once and record a **project profile** — the DISCOVERY MAP below — passed verbatim to every subagent. Spend real effort here; it is what makes the review fit *this* project. **Prefer evidence the project states over guesses.** Detect only what exists; mark anything absent as `none`.

- **Test runner + layout** — find the command CI actually runs. Check, in order: the CI workflow (`.github/workflows/*` — or any CI config the repo keeps, e.g. `.gitlab-ci.yml`, read **only** to recover the real test command) as the **authoritative** source, then fall back to the manifest (`package.json` scripts, `pyproject.toml`/`tox.ini`/`pytest.ini`, `go.mod`, `Cargo.toml`, `Gemfile`, `Makefile`, `*.gradle`). Derive the test-file glob(s) from existing tests (e.g. `*.spec.ts`, `*_test.go`, `test_*.py`, `*_spec.rb`) and note any unit vs integration/e2e split the repo uses.
- **Requirements sources** — (A) an issue-tracker key in the branch name or PR body (e.g. `[A-Z]+-\d+` for Jira/Linear, `#\d+` or `owner/repo#\d+` for GitHub issues, full ticket URLs); (B) in-repo spec/requirement files: a `.specs/` tree, `docs/`, `*-spec.md`, `*-tasks.md`, PRD files, or ADR/RFC directories.
- **Architecture / convention docs** — whatever states the project's rules: `CONTRIBUTING*`, `ARCHITECTURE*`, `CONVENTIONS*`, `docs/**` convention files, `AGENTS.md`, `CLAUDE.md`, and any coding/integration/security pattern docs the repo keeps. Record paths; do not read them yet — the owning subagent does.
- **Project-local review skills** — scan skill dirs (`.claude/skills/`, `.cursor/skills/`, `.codex/skills/`, `.github/`) for skills covering testing, architecture/modularity, or security. Record their `SKILL.md` paths so subagents load the project's own reference instead of guessing.

Record the map compactly and pass it verbatim to every subagent:

```
TEST:          <command> | globs: <...> | unit vs e2e: <split | none> | none-found
REQS:          tracker=<Jira KEY-123 | GH #42 | Linear ABC-7 | none> ; specs=<paths | none>
CONVENTIONS:   <doc/skill paths that state rules | none-found>
REVIEW_SKILLS: <project-local test/arch skill paths | none>
```

Each subagent loads **only** what the map lists; when a category is `none`, the subagent falls back to the generic checklist in its section and says so.

## Step 2: Launch subagents in parallel

Send **one message** with **six Task tool calls**, launched simultaneously. Each subagent is self-contained — it cannot see this chat, so its prompt carries the full context: `{REPO}`, `{PR}`, `{SHA}`, the diff, the existing `{id,path,line}` comment set, the PR intent, and the **project profile (the DISCOVERY MAP above)**. After all six finish, run Step 3.

---

## Severity labels (all subagents use these)

- 🚨 Critical — bugs or logic errors that will cause failures
- 🔒 Security — vulnerabilities or data exposure
- ⚡ Performance — significant performance concerns
- ⚠️ Warning — code smells or maintainability issues
- 💡 Suggestion — optional improvements

---

## Universal Rules (every subagent + consolidation must follow)

1. **Posting mechanics — never publish a broken body.** For any multiline comment or summary, write the body to a temp file and post with `--body-file` or `-F body=@file`. See the exact commands below. **This is the single most common failure mode — get it right.**
2. **Comment allowlist:** post inline comments **only** on diff lines starting with `+` (never `+++`). Anchor to the exact `+` line that is the evidence.
3. **Skip duplicates:** if a `{path, line}` within ±3 lines already has a comment, skip it.
4. **Mark resolved:** on an existing comment whose issue the diff now fixes, reply `[RESOLVED] This appears resolved by the recent changes.` — post it on that thread via the replies endpoint below, using the comment's `id` from Step 1a.4.
5. **Confidence gate:** report a finding only at **≥80% confidence**. When uncertain, stay silent.
6. **Positive highlight:** every subagent surfaces **at least one** well-done aspect before listing issues.
7. **Comment-only, never destructive:** never `--approve`, never `--request-changes`, never modify files. `--comment` only.
8. **No attribution:** never mention AI, an assistant, a model, or any tool in a comment body. Write as a reviewer.
9. **Marker:** start every inline comment body with `<!-- pr-review:{type} -->` (invisible when rendered; the consolidation step parses it). `{type}` ∈ `security | requirements | tests | architecture | regression | performance`.
10. **Tone:** specific, actionable, collegial. Always explain WHY.

### Comment posting commands (copy exactly)

Write the body to a temp file first (e.g. `body.md`), then:

**Inline review comment** on an added line:
```bash
gh api repos/{REPO}/pulls/{PR}/comments \
  -F body=@body.md -f commit_id={SHA} -f path={path} -F line={N} -f side=RIGHT
```
`line={N}` is the **1-based line number in the head file on the `RIGHT` side** — count from the hunk header's `+c` start across added *and* context lines. It is **not** the diff/hunk offset; a diff-relative position returns 422 or lands the comment on the wrong line.

**Reply on an existing comment thread** (for Rule 4 `[RESOLVED]`), using `{COMMENT_ID}` from Step 1a.4:
```bash
gh api repos/{REPO}/pulls/{PR}/comments/{COMMENT_ID}/replies -F body=@body.md
```

**PR-level summary** (Requirements subagent and Consolidation):
```bash
gh pr review {PR} --comment --body-file body.md
```

**`-F`/`--field` expands `@file` into the file's contents and types numbers; `-f`/`--raw-field` does NOT** — `-f body=@body.md` publishes the literal string `@body.md` instead of your comment. So: **`-F body=@file` for the body, `-F line=N` for the line number, `-f` for plain string fields** (`commit_id`, `path`, `side`). Never `-f body=@file`. When in doubt for a body, prefer `--body-file`.

---

## Subagent 1: Security — `<!-- pr-review:security -->`

If the profile lists security/integration convention docs or a security-focused project skill (from `CONVENTIONS` / `REVIEW_SKILLS`), **load them** and review the diff against those rules first. Then apply this generic sweep regardless: hardcoded secrets or credentials, missing authn/authz on new endpoints, PII or secrets in logs, missing webhook/callback signature validation, overly permissive CORS, unsanitized input reaching a query/command/template (injection), unsafe deserialization, broken access control on user-owned resources, sensitive fields leaking into response payloads, and internal clients/keys exported across a module boundary.

**Second pass (mandatory):** re-read the full diff top to bottom. List every file or hunk you did not comment on. For each, ask: "Does this violate any security rule in my scope?" Skip a file only when you can state explicitly why it is clean.

**Comment format:**
```
<!-- pr-review:security -->
🔒 Security — [Short title]
[What the issue is and why it matters]
**Recommendation:** [Specific fix]
```

---

## Subagent 2: Requirements & Definition of Done — `<!-- pr-review:requirements -->`

**Posts one PR-level summary comment only — no inline comments.**

Discover requirements with two tracks (from the profile's `REQS`). Run both; use whichever yields content.

### Track A — Issue tracker

Extract the ticket/issue reference from the branch name or PR body, then fetch it with whatever the environment allows. Adapt to the tracker present:
- GitHub issue `#N` → `gh issue view {N} --json title,body` (or the `owner/repo#N` form).
- Jira `KEY-123` → the project's Jira API/CLI, e.g. `curl -su "$JIRA_USER:$JIRA_API_TOKEN" "$JIRA_BASE_URL/rest/api/2/issue/KEY-123?fields=summary,description"`.
- Linear / other → whatever the project documents.

Parse acceptance criteria, user stories, and DoD items. If no reference or credentials, skip Track A and fall through to Track B.

### Track B — In-repo spec files

Scan the PR title/body for referenced spec/task files (explicit paths, markdown links, `spec:`/`tasks:` mentions). Also check any `.specs/`, `docs/`, ADR/RFC dirs from the profile for a file matching the branch, ticket, or feature name (fuzzy match on file stem). Read each candidate and extract acceptance criteria, task checklist items, and stated goals / non-goals. Treat ADR/RFC "Decision" and "Consequences" sections as requirements too.

### Resolution logic

| Tracks with content | Action |
|---|---|
| Both A and B | Merge requirements; note the source of each item |
| A only | Use tracker requirements |
| B only | Use spec-file requirements |
| Neither | Post: `⚠️ No issue ticket or spec file found — requirements verification skipped.` and stop |

**Evaluate case by case, evidence-based.** For each criterion, locate the implementing code and mark it ✅ Implemented (cite `path:line`), 🟡 Partial (a meaningful clause missing), or ❌ Missing. **No located evidence ⇒ not implemented** — never award credit from the PR description restating intent. A behavior only *exercised* by a test but not asserted does not count as verified.

**Second pass (mandatory):** re-read the merged requirement list one item at a time: "Did I evaluate this against the diff?" Mark every unassessed item ✅/🟡/❌ against the actual diff.

**Summary format:**
```markdown
<!-- pr-review:requirements -->
## 📋 Requirements Review
**Sources:** {e.g. "Jira: KEY-123" | "Spec: .specs/<feature>/spec.md" | "Both" | "None"}
### ✅ Implemented   — [criterion — `path:line`]
### 🟡 Partial       — [criterion — what's missing]
### ❌ Missing        — [criterion]
### 🔲 Definition of Done   — [x] covered / [ ] not covered
### 💬 Notes
```

---

## Subagent 3: Test Coverage — `<!-- pr-review:tests -->`

Use the profile's `TEST` runner + layout to know where tests belong and what a "correct test" looks like *here*. If `REVIEW_SKILLS` lists a project-local testing skill, **load it** and use its patterns as the reference for placement, naming, setup/teardown, and assertion style. Otherwise apply generic standards. Do not impose a framework the project does not use.

Review the diff for: new or changed behavior with **no corresponding test** (🚨 Critical for public/entry-point behavior — new endpoints, handlers, exported functions, event/queue consumers, jobs); required level wrong (pure logic needs a unit test; observable I/O — HTTP/persistence/queue — needs an integration/e2e test; behavior with both needs both); and quality gaps (wrong location per project layout, missing cleanup/teardown, no fixtures/factories, hardcoded IDs, missing negative/error case, assertions that exercise but don't assert the outcome).

**Second pass (mandatory):** re-read the full diff. List every new/modified entry point (endpoint, exported function, handler, consumer) you did not comment on. For each, ask: "Is there a test covering the happy path and at least one error case, at the right level?" Skip only when you can state why coverage already exists or is N/A.

**Comment format:**
```
<!-- pr-review:tests -->
[🚨/⚠️/💡] — [Short title]
[The coverage gap or test anti-pattern]
**Recommendation:** [Test to add, at which level, following project patterns]
```

---

## Subagent 4: Architecture & Conventions — `<!-- pr-review:architecture -->`

### Phase 0 — Load the project's own convention sources

Load **every** architecture/convention doc and project-local architecture skill named in the profile (`CONVENTIONS` + `REVIEW_SKILLS`) to EOF — do not skip any, and do not substitute stack knowledge for the project's documented rules. If the profile lists **none**, fall back to a minimal generic sweep (module boundaries respected, no layering violations, no cyclic/cross-boundary imports, naming consistent with neighbors) and state in each comment that no project convention docs were found.

### Phase 1 — Extract the rule matrix (do not hardcode)

Read each loaded document and extract **every explicit rule** it states — checklist items (`□`/`- [ ]`), `✅ do` / `❌ don't` bullets, "must"/"never" statements, structural constraints — into one numbered list. Number sequentially from 1. Add nothing the docs don't state; omit nothing you find. **This numbered list, derived from the project's own docs, is the evaluation matrix.**

### Phase 2 — Evaluate the matrix, one file at a time

For each changed file, decide **PASS / VIOLATION / N/A** per rule. `N/A` is valid only when a rule is structurally inapplicable to that file type. For every VIOLATION, post an inline comment on the exact `+` line, citing the rule number and its source document.

**Second pass (mandatory):** after the matrix pass, re-read the full diff. List every file you did not evaluate and run the matrix again on it. Skip a file only by stating which rules are N/A and why.

**Comment format:**
```
<!-- pr-review:architecture -->
[🚨/⚠️/💡] — [Short title]
Rule: [number + source doc, e.g. "Rule 8 — CONTRIBUTING.md Module Boundaries"]
[What in the diff violates it — quote the offending line]
**Recommendation:** [Exact fix; code snippet if < 6 lines]
```

---

## Subagent 5: Regression & Hallucination Detection — `<!-- pr-review:regression -->`

Review the diff for changes unrelated to the PR's stated purpose or bearing signs of machine-generated artifacts: deletions of code unrelated to the change (🚨), imports/references to symbols that don't exist in the repo (🚨), calls with the wrong signature or arity (🚨), `TODO`/`FIXME`/stub left in production paths, type assertions or casts hiding a real type error, logic duplicating something the codebase already provides, weakened error handling or validation, silently swallowed errors, weakened or deleted test assertions, and dead code that is never reached.

**Second pass (mandatory):** re-read the full diff. List every file you did not comment on: "Any unrelated deletions, phantom references, duplicated logic, or weakened assertions here?" Skip only when you can state why none apply.

**Comment format:**
```
<!-- pr-review:regression -->
[🚨/⚠️/💡] — [Short title]
Type: [unrelated-deletion | phantom-reference | wrong-signature | duplicate | weakened-check | dead-code]
[Specific description with quoted evidence from the diff]
**Recommendation:** [Exact fix]
```

---

## Subagent 6: Performance — `<!-- pr-review:performance -->`

If the profile lists data-access or performance convention docs, load them as the reference for the project's expected pattern. Flag only issues **clearly visible in the diff** — no speculation. Look for: a query/lookup inside a loop (N+1), unbounded fetches with no pagination or limit, lazy-loaded relations triggering per-row I/O, sequential `await`/blocking calls for independent operations that could run concurrently, repeated recomputation of an invariant inside a loop, and multiple writes that should share one transaction/batch.

**Second pass (mandatory):** re-read the full diff. List every function, query, and loop you did not comment on: "Any clearly-visible performance issue here?" Skip only when you can state why none apply.

**Comment format:**
```
<!-- pr-review:performance -->
⚡ Performance — [Short title]
[Description with estimated impact, e.g. "O(N) queries per request"]
**Recommendation:** [Fix with short code sketch if < 6 lines]
```

---

## Step 3: Consolidation

After all 6 subagents finish, spawn one more Task subagent to consolidate:

1. `gh api repos/{REPO}/pulls/{PR}/comments` — fetch all inline comments.
2. Keep those whose body starts with `<!-- pr-review:` ; parse `{type}` from the marker.
3. Fetch **review** bodies to pick up the `<!-- pr-review:requirements -->` summary: `gh api repos/{REPO}/pulls/{PR}/reviews`. The Requirements subagent posts it via `gh pr review --comment`, so it is a *review* body — **not** an inline `/pulls/{PR}/comments` entry (Step 3.1) nor an `/issues/{PR}/comments` entry. Keep the review whose body contains the marker.
4. Group findings by severity: 🔒 Security → 🚨 Critical → ⚡ Performance → ⚠️ Warning → 💡 Suggestion.
5. Deduplicate findings at the same `{path, line}` (±3 lines); note every contributing subagent in the entry.
6. Collect one positive highlight per subagent.
7. **Gap detection:** run `gh pr diff {PR} --name-only` for the full changed-file list. Cross-reference against every path that received an inline comment. List any changed logic file with **zero** inline comments under `### 🔍 Files With No Inline Comments`. Omit only config/lock files (`*.json`, `*.yaml`, `*.lock`) and pure type/declaration files with no logic.
8. Write the summary to a temp file and post: `gh pr review {PR} --comment --body-file summary.md`.

**Summary format:**
```markdown
## 📋 PR Review Summary

| | |
|---|---|
| **Subagents** | 6 (Security · Requirements & DoD · Test Coverage · Architecture · Regression · Performance) |
| **Detected runner** | {TEST command, from the map — or "none found"} |
| **Requirements source** | {tracker / spec path / none} |
| **Project refs loaded** | {convention docs + project-local skills used, from the profile} |
| **Findings** | {N} across {M} files |

---
### 🔒 Security ({N})
- [`path/file:L42`] Finding title
### 🚨 Critical ({N})
### ⚡ Performance ({N})
### ⚠️ Warnings ({N})
### 💡 Suggestions ({N})

---
### 🔍 Files With No Inline Comments
- `path/to/file` — no findings from any subagent (verify manually or re-run a targeted review)

_(Omit this section if every logic file received at least one comment.)_

---
### ✅ Highlights
- [One positive highlight per subagent]

---
> See inline comments for details and recommendations.
```

If no findings across all subagents: post `✅ No issues found across all review dimensions.` and still include the metadata table.

---

## Examples

**A — Requirements binds to whatever the repo has.** In a repo whose branch is `feat/PLAT-482-trial`, Track A extracts `PLAT-482`, fetches the Jira ticket (`curl -su "$JIRA_USER:$JIRA_API_TOKEN" .../issue/PLAT-482?fields=summary,description`), and scores its acceptance criteria against the diff → `Sources: Jira: PLAT-482`. In a second repo with no tracker but a `.specs/checkout/spec.md` linked from the PR body, Track B reads that spec and scores its requirement IDs. In a third repo with neither but a `docs/adr/0007-rate-limits.md` referenced in the PR, Track B treats the ADR's Decision/Consequences as the criteria. A fourth repo with none of these → post the skip line and stop. Same subagent, four outcomes — driven entirely by the project profile.

**B — Architecture extracts its own matrix.** Repo X documents conventions in `CONTRIBUTING.md`; Phase 1 turns its "must/never" bullets into Rules 1–12 and the diff is graded against them. Repo Y instead ships a project-local `.cursor/skills/modular-architecture/SKILL.md`; the subagent loads it and extracts that skill's checklist as the matrix. Repo Z has no convention docs at all → the subagent states so and runs only the minimal generic boundary sweep. No stack rules are ever hardcoded.

**C — The `-F` vs `-f` posting fix, correct vs broken.**
```bash
# ✅ posts the file's contents (uppercase -F expands @)
gh api repos/acme/app/pulls/12/comments \
  -F body=@body.md -f commit_id={SHA} -f path=src/x -F line=88 -f side=RIGHT
# ❌ posts the literal string "@body.md" (lowercase -f does NOT expand @)
gh api repos/acme/app/pulls/12/comments -f body=@body.md -f path=src/x ...
```
For the PR-level summary, always `gh pr review 12 --comment --body-file summary.md` — never an inlined multiline `--body`.