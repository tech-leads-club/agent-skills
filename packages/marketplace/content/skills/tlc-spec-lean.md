## Why teams use it

The skill starts from the view that coding agents fail mostly before any code: a sentence of the request never becomes a requirement, or a product choice gets made silently mid-diff. tlc-spec-lean puts most of its effort in front of the code: one `plan.md` that a person reads and approves, and one review by an agent that did not write the code. There is no task list, proof file or post-build gate; inside each approved slice, the builder decides how.

The plan has two halves. The first is what must be true: the problem without a solution in it, EARS criteria with concrete values, assumptions, and scope. The second is what is being built: the path drawn in mermaid, an `erDiagram` with no columns, routes with status codes, and a "Landing" table of one-way doors (schemas, consumed contracts, new dependencies), each with the rejected alternative. Screenshots or design frames sent with the request bind the result by default. The agent stores them under `captures/`, and any departure from them needs a recorded decision.

The skill also assumes the chat will be compacted. The request is saved word for word to `request.md`; the approval, mid-build decisions, review and fix pass are each a line in `plan.md`, and a resume table reads the next step from those lines and `git log`.

## How a session goes

> Use tlc-spec-lean. Members whose card payment fails keep full access until someone notices. Plan the fix; the Figma frame for the "payment failed" banner is attached.

1. The agent writes the request verbatim to `.specs/features/<feature>/request.md`, reads the active `AD-NNN` decisions in `.specs/STATE.md`, and exports the attached frame into `captures/`.
2. It asks every open product decision with a recommendation (who loses access, what the banner says, what a retry does), writing each answer into the plan in the same turn.
3. It drafts `plan.md` from the template in `references/plan.md`, with criteria grouped into slices S1, S2 and so on. Then it runs `validate_plan.py <feature>` and fixes whatever the script reports.
4. **Stop:** it presents the plan. If you answer questions, it revises and presents again. Only an explicit approval goes on the `**Approved**:` line, quoting your words.
5. It builds S1 as a thin end-to-end path (route, rule, tests, screen), opens the screen in a browser at the capture's size, and commits. Before each commit it runs `check_commit.py --message "..."`, which also lists untracked files and the next step the feature owes. Later slices follow one per commit.
6. It runs the repo's own test, build and lint commands, records the HEAD hash on the `**Review:**` line, and starts a fresh sub-agent. The sub-agent gets a fixed prompt and the verbatim request, and writes its findings to `review.md`.
7. It makes one fix pass, fills in the `**Fix pass:**` line, commits, and reports. It also stops to ask if a criterion conflicts with a capture, if a review finding is a product decision, or before any push or deploy.

For changes under about three files with no one-way door, it skips `plan.md`. The answers and the review lines go in `request.md`, and the review still runs.

## What's in the folder

- `references/plan.md`: loaded in the Plan phase. Questioning rules, the decisions each kind of surface always carries (screen, API, command, document), EARS patterns, capture rules and the full `plan.md` template.
- `references/build.md`: loaded after approval. Slice order, what is fixed versus the builder's call, tests, browser checks and commit conventions.
- `references/review.md`: the reviewer prompt to copy word for word, how to fill it in with or without a plan, and the single fix-pass rule.
- `references/memory.md`: the `STATE.md` decision-log format, including how a decision is superseded, and the resume table that maps file state to the next step.
- `scripts/validate_plan.py`: a structural gate on `plan.md`. It fails on missing sections, criteria without SHALL, Landing rows with no rejected alternative, `erDiagram` attribute blocks, Surface rows without status codes, uncited captures, and Differences rows with no active `AD-NNN`.
- `scripts/check_commit.py`: a Conventional Commits check that rejects agent trailers unless `--allow-trailers` is passed. It can be installed as a `commit-msg` hook, and the docstring gives sh and PowerShell versions.
- `scripts/lean_config.py`: detects whether `## Sources` marks a source binding; shared with sibling TLC skills.
- `scripts/selftest.py` and `scripts/fixtures/plan.md`: mutation tests for the gates against a complete worked plan (dunning on a failed charge), plus negative controls and a scratch-repo run of the commit follow-ups.

## Choosing between similar skills

- [tlc-spec-driven](/skills/tlc-spec-driven/) (see also [/tlc-spec-driven/](/tlc-spec-driven/)) has four phases (Specify, Design, Tasks, Execute) sized to the scope of the work, and two human stops: spec and tasks. It writes `tasks.md` with a gate per task and a `## Checks` table that ties each criterion to a test command. `check_proofs.py` runs those commands into `proofs.md`, a Verifier judges each check's test, and a screens sub-agent compares saved `*.running.png` pictures. Pick it when you want proof-level traceability per criterion or a task list to review. Pick tlc-spec-lean when one approved plan and one independent review are enough.
- [tlc-plan](/skills/tlc-plan/) with [tlc-implement](/skills/tlc-implement/) splits planning and building into two skills, and the implement side keeps checks, proofs and a Verifier. Pick that pair when one person plans and another builds, or when you follow the [AI dev flow](/tlc-ai-dev-flow/). tlc-spec-lean keeps the whole loop in one skill.
- [spec-driven-eval](/skills/spec-driven-eval/) builds nothing; it grades an implementation against a spec and runs only when named.

## Works well with

- [tlc-discover](/skills/tlc-discover/) comes before this skill when the idea is still vague or the system is large. Its description sends clear features to tlc-spec-lean.
- [create-adr](/skills/create-adr/): the plan reference says an unresolved architectural bet should be settled in an ADR, RFC or spike and linked from the plan.

## Recent changes

- **2026-11-18, 3.2.0**: the request is saved verbatim to `request.md` before planning. Small changes keep their answers and review lines there, and the fix pass is recorded explicitly so that a review needing no changes can still close.
- **2026-11-18**: the scripts write UTF-8 so they no longer crash on Windows piped output.
- **2026-11-18, 3.1.0**: four phases became three. `checks.md`, the proof scripts and `lessons.py` were removed, and `review.md` with a fixed reviewer prompt was added. `check_commit.py` started reporting the next owed step.
- **2026-10-30, 3.0.0**: proofs ran through the project's own test commands, and mutation testing was dropped.
- **2026-10-25, 2.0.0**: captures sent with a request became binding, rules moved into the tested layer, and approvals were stored in files so they survive compaction.
- **2026-09-09**: added to the catalog.
