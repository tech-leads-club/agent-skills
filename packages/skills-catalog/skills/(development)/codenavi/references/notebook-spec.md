# .notebook/ Specification

Read this file when you need to create or update notes during the
Debrief phase, or when you need to understand the notebook format
during Briefing.

## Structure

```
.notebook/
├── INDEX.md          # Always read first. Compact index of all notes.
├── auth-flow.md      # Individual note files — flat by default.
├── error-handling.md
└── checkout-race.md
```

Notes start flat in the root of `.notebook/`. When volume exceeds
~15 notes, organize into subdirectories by category:

```
.notebook/
├── INDEX.md
├── flows/
│   ├── auth-flow.md
│   └── checkout-flow.md
├── patterns/
│   └── error-handling.md
├── gotchas/
│   └── checkout-race.md
└── domain/
    └── coupon-types.md
```

Categories:

- **flows** — How things work. Integrations, sequences, data paths.
- **patterns** — How things are done here. Conventions, recurring structures.
- **gotchas** — Traps. Bugs, quirks, counterintuitive behavior.
- **domain** — Business concepts. Terminology, rules, logic not obvious in code.

These categories are guidelines, not rigid rules. If a note fits
multiple categories, pick the primary one. If none fits, put it in root.

## INDEX.md Format

The index must be compact. One line per note. The AI reads this every
session, so every byte counts.

```markdown
# .notebook
> Project intelligence — read before every mission

Last updated: 2026-02-22

- [auth-flow](auth-flow.md) — OAuth2 + refresh rotation | flow | auth, security
- [error-handling](error-handling.md) — Error boundaries + custom hook | pattern | react, errors
- [checkout-race](checkout-race.md) — Race condition on cart update | gotcha | checkout, cart
- [coupon-types](coupon-types.md) — Percentage vs fixed vs BOGO rules | domain | coupons, pricing
```

Format per line:

```
- [slug](path) — summary (max ~80 chars) | category | tags
```

Rules for INDEX.md:

- Keep summaries short and scannable.
- Tags are lowercase, comma-separated. Use them for quick grep.
- Update `Last updated` whenever the index changes.
- If using subdirectories, paths include the folder: `flows/auth-flow.md`.
- Sort by most recently updated, not alphabetically.

## Individual Note Format

Notes are telegraphic. Think field notes, not documentation.

```markdown
# Auth Flow
> OAuth2 with refresh token rotation

Entry: `src/middleware/auth.ts:authMiddleware()` (L12)
Flow: middleware → `services/auth/jwt.ts:verify()` → `services/user/find.ts:findById()`

Refresh: `services/auth/refresh.ts:rotateToken()`
- Single-use tokens — consumed on refresh, new pair issued
- Stored in Redis with TTL (see `lib/redis.ts:sessionStore`)

OAuth providers: `config/oauth.ts` — Google, GitHub
- Each provider maps to `services/auth/oauth/[provider].ts`

Session: Redis-backed via `lib/redis.ts` (L45-62)

Updated: 2026-02-22
```

### Format principles

1. **Pointers, not copies.** Always reference as:
   - `file/path.ts:functionName()` for functions
   - `file/path.ts` (L10-25) for specific line ranges
   - `file/path.ts:ClassName.method()` for class methods
   Never paste code blocks into notes. Code changes; pointers
   can be re-checked. Pasted code becomes stale lies.

2. **One concept per note.** If it needs scrolling, split it.
   A note about auth flow should not also cover session management
   unless they're inseparable.

3. **Minimal prose.** Use fragments, arrows, dashes. Not sentences.
   "middleware → verify JWT → load user → attach to req" is better
   than "The middleware first verifies the JWT token, then loads
   the user from the database, and finally attaches it to the
   request object."

4. **Always include Entry point.** Every note should have a clear
   starting point so the reader knows where to begin exploring.

5. **Always include Updated date.** So the reader knows how fresh
   the information is.

6. **No opinions, only observations.** "Uses Redux for state" not
   "Uses Redux instead of a better solution." If something is
   genuinely problematic, state the observable impact:
   "Redux store has 47 top-level keys — finding relevant state
   requires searching across 12 reducers."

## Creating the .notebook/ for the First Time

When `.notebook/` doesn't exist yet:

1. Create the directory.
2. Create INDEX.md with the header only:

   ```markdown
   # .notebook
   > Project intelligence — read before every mission

   Last updated: [today]
   ```

3. Do NOT do a full project analysis. Notes are created organically
   as you work. The first notes will come from your first mission's
   Debrief.

## Updating Notes

When updating an existing note:

1. Read the current content.
2. Add, modify, or remove information based on what you discovered.
3. Update the `Updated` date at the bottom.
4. If the summary in INDEX.md changed, update it too.

When information becomes invalid (e.g., a flow changed because of
your work), update the note immediately — stale notes are worse
than no notes.

## Token Budget

The entire `.notebook/` system is designed for progressive disclosure:

- **INDEX.md** is read every session (~5-50 lines). Cost: minimal.
- **Individual notes** are read only when relevant to the current
  mission. The AI decides which to open based on INDEX.md tags.
- **Total cost per session:** INDEX.md + 0-3 relevant notes.

If INDEX.md grows beyond 50 entries, consider archiving old notes
into an `archive/` subdirectory and removing them from the active
index. Archived notes are still searchable but not loaded by default.
