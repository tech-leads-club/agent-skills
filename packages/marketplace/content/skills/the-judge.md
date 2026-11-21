## Why teams use it

AI review passes tend to post long lists of comments, some wrong, many repeating the linter. The Judge pushes the other way. The model still does the reviewing, but Python scripts decide what is allowed to reach GitHub. A blocker or should-fix with no `path:line` reference, no https source and no reproduction command never gets posted. A comment with an exclamation mark, a "great job", or an opening like "Looking at" fails the gate. So does a verdict that doesn't follow from the severity counts.

The review itself runs six passes: correctness, security, structure, AI slop, claims in the PR description, and bypasses. The structure pass is the demanding one. A PR that takes a file past 1000 lines is treated as a presumptive blocker, and new ad-hoc branches threaded through unrelated code count as design problems, not nits. The security pass comes with a fixed list of things it never reports, such as DoS, missing hardening and regex injection.

The skill also limits re-reviews. Everything found goes into round 1. From round 2 on, the gate rejects any new finding that isn't a blocker, and by round 3 every open item has to be settled one way or another.

## How a session goes

> Judge PR 412 before I merge it. Write the review in Portuguese.

1. The agent calls `gh pr view`, `gh pr diff` and `gh api user` to load the PR, its author and the current login. It sorts changed files into core and mechanical (lockfiles, generated code, snapshots) and treats a block of three or more identical lines deleted in one place and added elsewhere as moved code. Its own earlier reviews on the PR tell it which round this is.
2. It runs the repo's own lint, typecheck and focused tests. Anything those tools report is off-limits for review comments. Then it pipes the diff into `scripts/scan_bypasses.py` to get a list of candidates.
3. It lists every external surface the diff touches, such as dependency bumps and API calls, and checks current official docs and advisories for each one. URLs go into a research log.
4. It loads `references/review-standards.md` and runs passes A through F. On diffs over roughly 400 core lines, the passes may run as parallel subagents.
5. A verification pass re-reads each cited location and drops anything it can't back with evidence. Small but real issues are downgraded to nits, not discarded.
6. It loads `references/comment-voice.md` and writes `findings.json`: a summary, a verdict, a round number, a carryover count and findings with evidence.
7. It runs `scripts/review_gate.py` and keeps rewriting until the gate exits 0.
8. `scripts/post_review.py` posts the whole review in one API call and prints the URL. If the branch has no PR or `gh` isn't authenticated, the agent stops and reports it.

## What's in the folder

- `scripts/review_gate.py`: the noise gate. It uses only the standard library and makes no network calls.
  - Each body must start with the emoji for its severity (🔴 🟠 🟡 🟣).
  - Blockers and should-fixes need at least one evidence entry. An `internal` entry must match `path:line`, an `external` one must be an https URL, and a `repro` one must contain a command.
  - Body caps: 900 characters for blockers, should-fixes and pre-existing findings, 400 for nits, 10 lines for all of them.
  - Before checking the text, it strips code spans and fences and removes accents. It then rejects em and en dashes, exclamation marks, banned words and phrases in English and Portuguese, the "not just X but Y" pattern, and announcing openers on the first line.
  - It fails a review with more than 5 nits, or a summary that lacks a TL;DR, a lint-rule section or the verdict token.
  - It recomputes the expected verdict from the findings plus the carryover and rejects a mismatch.
  - From round 2 on, it requires a `carryover` object and a Resolution section and accepts only new blockers.
  - Exit codes: 0 for pass, 1 for violations, 2 for malformed input.
- `scripts/post_review.py`: re-runs the gate and refuses to post on failure. On your own PR, where GitHub rejects APPROVE and REQUEST_CHANGES with a 422 error, it posts as COMMENT and adds a footer naming the intended verdict. Pre-existing findings go in the summary only, and the other findings are anchored on the RIGHT side of the diff. If GitHub rejects the post with a 422, the script lists every anchor it sent. It accepts an optional `--pr N`.
- `scripts/scan_bypasses.py`: reads a unified diff on stdin and tracks new-file line numbers from the hunk headers. It runs 20 regex markers against added lines only, in these categories: suppression, test-dodge, hook-bypass, tls-bypass, type-bypass, error-swallow, unsafe-html and sync-hack. It always exits 0, so the scan can't block a review.
- `references/review-standards.md`: what each pass looks for, the 14 security exclusions and 5 precedents (for example, environment variables are trusted), the 1000-line rule, which comments to flag for deletion, and how to treat claims in the PR description.
- `references/comment-voice.md`: how a comment is shaped (problem and location first, then the smallest fix that works), the banned-language list, and before-and-after rewrites.

## Choosing between similar skills

- [security-best-practices](/skills/security-best-practices/) produces a full security report for Python, JS/TS or Go. Pick it when you want broad security coverage. The Judge reports only exploitable issues the PR introduces and leaves out whole categories on purpose.
- [best-practices](/skills/best-practices/) applies web modernization and security guidance to a codebase. Pick it for a sweep of the codebase. Pick The Judge when the unit of work is one PR and the output has to be a posted review.
- [coding-guidelines](/skills/coding-guidelines/) guides the agent while it writes code. Pick it while code is being written. Pick The Judge once the PR is open.
- [the-fool](/skills/the-fool/) challenges plans and decisions. Pick it before code exists. Pick The Judge once there is a diff to review.

## Works well with

- [gh-address-comments](/skills/gh-address-comments/): the skill's own description sends responses to review comments here. After round 1 is addressed there, The Judge's round 2 checks each resolution.
- [gh-fix-ci](/skills/gh-fix-ci/): The Judge runs the repo's checks but excludes fixing CI failures, so failing GitHub Actions checks go here.

## Recent changes

- 2026-09-08, catalog 0.17.5: added to the `quality` category by felipfr (commit 7807faa) with all six current files. It entered the catalog at skill version 1.4.0.
- No commits have touched the folder since, through catalog 0.17.23 (2026-11-21).
