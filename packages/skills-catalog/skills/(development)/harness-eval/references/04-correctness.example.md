# Example: Track A report (action-first)

Illustrative excerpt — not a real run. Shows the section order developers see first.

```markdown
# Track A — Correctness (broken paths and commands)

**Diagnosis only** — agent instructions were not edited.
**Question:** Do paths and commands cited in the harness exist?

## At a glance

- **2 problems** to fix · **11** path cites OK
- **Files scanned:** 5 (always-on rules + skills + cited refs)
- **Command lookup:** `package.json` scripts (repo root only; workspace packages are not scanned)

## What to do next

1. Fix or restore the **2** cites in **Problems** below.
2. Re-run Track A until **At a glance** shows **0 problems**.

## Problems (2)

### A001 — Missing file

- **In:** `AGENTS.md`
- **The instruction says:** `src/score.ts`
- **Looked for:** `src/score.ts` at repo root (case-sensitive)
- **Also tried:** `src/score.ts`, `packages/cli/src/score.ts`
- **Possible matches (filename only, not verified):** `packages/cli/src/score.ts`
- **Do this:** Change the cite to a path that exists, or restore the file.

### A002 — Missing command

- **In:** `AGENTS.md`
- **The instruction says:** `npm run bench`
- **Looked in:** `package.json` scripts (repo root only; workspace packages are not scanned)
- **Missing script/task:** `bench`
- **Known scripts:** `build`, `test`, `scan`, …
- **Do this:** Add a script named `bench` to root `package.json`, or cite an existing command.

## Checked and OK (11)

- `docs/guide/measure-and-improve.md` in `AGENTS.md`
- …

## What was scanned

- **Always-on rules (T0):** 4 files
  - `AGENTS.md`
  - …

## How this check works

(Terms and precision rules — read when you need the details.)
```
