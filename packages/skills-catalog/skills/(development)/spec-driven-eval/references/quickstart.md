# Quick start — running the eval end-to-end

This is the operational how-to for `spec-driven-eval`. The main `SKILL.md` is the scoring methodology; this file is the workflow that produces something to score and then grades it.

Run the eval as **4 separate chat sessions**, in order. Use a *fresh* session for each so context can't leak from one stage into the next — the grade must never see how the code was produced. The stages share state only through **git** (the implementation branch + a base ref) and the frozen **baseline file**.

Since each session starts clean, **attach the `spec-driven-eval` guideline to the eval sessions (1 and 4)** — they follow it. Sessions 2 and 3 follow the *framework-under-test's* own instructions.

Fill in these placeholders for your own evaluation: `<PATH TO YOUR PRD>` · `<YOUR SPEC FOLDER>` (where the baseline + reports live) · `<FRAMEWORK>` · `<BASE_REF>` (the commit/branch the implementation started from) · `<RUN_BRANCH>`.

## What the PRD needs to contain

The baseline-freeze step (Session 1) reads three things from the PRD, so make sure yours has them: **user stories grouped by explicit priority** (`P0`/`P1`/`P2`), **numbered acceptance criteria** per story (the unit of scoring), and an **explicit out-of-scope list** (so absent features aren't penalized). Below is a minimal dummy PRD with that shape — copy the structure, swap in your own feature.

**Write the PRD from a well-known, complete feature, and cover all of its business needs.** The PRD *is* the ground truth — every score is measured against it. A thin or partial PRD (missing stories, vague ACs, no explicit boundaries) invites **scope drift**: frameworks build things the PRD never sanctioned (hurting scope adherence) or skip needs the PRD never stated (hurting fidelity), and because the missing intent isn't in the frozen baseline, the resulting grade is neither fair nor reproducible. Base it on a feature you understand well enough to enumerate completely — every story, every AC, every explicit boundary — so the baseline captures the full intent and the numbers stay comparable across runs.

```markdown
# PRD — Wishlist

## P0 — Add item to wishlist
As a logged-in user, I want to save an item to my wishlist so I can find it later.

**Acceptance criteria**
- AC1: A logged-in user can add an item; the response returns the saved item with its `wishlistId` and `createdAt`.
- AC2: Adding an item the user already has does not create a duplicate; the existing entry is returned.
- AC3: An unauthenticated request is rejected with `401`.

## P1 — Remove item from wishlist
As a logged-in user, I want to remove an item so my list stays relevant.

**Acceptance criteria**
- AC1: A logged-in user can remove an item they own; the item no longer appears in their list.
- AC2: Removing an item the user does not own returns `404` and changes nothing.

## P2 — Share wishlist via public link
(Lower priority — graded at weight 0; absence is not a defect.)

**Acceptance criteria**
- AC1: A user can generate a read-only public link to their wishlist.

## Out of scope
- Wishlist item price-drop notifications.
- Sharing to external social networks.
```

Notes that map to how this gets scored:

- **Priority labels drive the weights** — `P0` → 3, `P1` → 2, `P2`/out-of-scope → 0. Label every story; an unlabeled story is flagged `ASSUMED`.
- **Conjunctions become separate checks** — AC1's "`wishlistId` **and** `createdAt`" is two I-checks (one per field). Spell out each field you expect in a returned/persisted/emitted payload.
- **The out-of-scope list bounds scope** — building something on it counts against scope adherence; *not* building it is correct.

## Session 1 — Freeze the baseline (once per PRD)

Open a new chat (with the guideline attached) and paste:

```
Following this spec-driven-eval guideline, do ONLY the baseline-freeze steps
(locate PRD → enumerate stories + acceptance criteria → build the binary checklist)
for the PRD at <PATH TO YOUR PRD>: enumerate every story + acceptance criterion,
tag priority from the PRD's explicit P0/P1/P2 labels, decompose each AC into binary
I-checks and T-checks, and write <YOUR SPEC FOLDER>/evaluations/_ac-baseline.md.
Do not grade any implementation.
```

Reuse this baseline file verbatim for every later run — never re-derive it. It is the comparability anchor of the whole evaluation.

## Before Session 2 — clean the working tree (do NOT skip)

After cutting your run branch off the base, you **must** scrub the working tree *before* planning. This is critical for a fair run: `git checkout` **never** removes git-ignored files, so leftovers from a previous run survive into your supposedly "clean" branch and **silently leak the previous run's answer** into the new one.

Clean up, at minimum:

- **Compiled / build output** — e.g. build dirs, transpiled output, coverage and cache directories.
- **Previously generated SDD plan artifacts** — the prior framework's `spec.md`/`tasks.md` and its working directories.
- **Dependency drift** — reconcile dependencies to the locked versions (a clean, frozen-lockfile install).

Do this *after* cutting the branch and *before* planning, so the cleanup can't wipe the new plan.

## Session 2 — Plan

Open a new chat on the clean branch:

```
I'm on branch <RUN_BRANCH> (cut from <BASE_REF>).
Read <FRAMEWORK>'s own planning instructions and follow them exactly. Using ONLY
the PRD at <PATH TO YOUR PRD> as input, run <FRAMEWORK>'s planning flow to produce
its spec + tasks artifacts. Plan only — do not write any production code.
```

## Session 3 — Implement

Open a new chat on the same branch:

```
I'm on branch <RUN_BRANCH>. Read <FRAMEWORK>'s own implementation instructions and
follow them. Implement STRICTLY from the spec.md/tasks.md on this branch — do NOT
read the PRD. Write production code plus unit and e2e tests.
```

Keeping it PRD-blind here is deliberate: the implementer should only ever see the framework's plan, so the grade measures the framework, not the model backfilling from the PRD.

## Session 4 — Evaluate (the guideline)

Open a new chat on the implemented branch (with the guideline attached):

```
Following this spec-driven-eval guideline, grade the implementation on the current
branch against base <BASE_REF>. REUSE the frozen
<YOUR SPEC FOLDER>/evaluations/_ac-baseline.md verbatim — do not re-enumerate.
Score I-checks and T-checks with file:line evidence over the diff
(git diff <BASE_REF>..HEAD), run E/S/R/G/D, do k=3, compute Final with a script, and
write a timestamped report to <YOUR SPEC FOLDER>/evaluations/. Do NOT modify the code
under evaluation.
```

## Grading several frameworks against one PRD

Freeze the baseline once (Session 1), then repeat Sessions 2–4 per framework with a *fresh* evaluator each time, and aggregate the `Final`s. Same baseline + same evaluator across all runs is what keeps the numbers comparable.
