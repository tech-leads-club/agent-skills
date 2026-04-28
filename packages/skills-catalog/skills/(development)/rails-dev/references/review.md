# Code review

What to flag when reviewing Rails code against this skill's conventions. This is the consolidated anti-pattern checklist; each row points to the reference with the full pattern. The Coding style section in `SKILL.md` applies too. Be specific in feedback: name the anti-pattern, show the fix, link the reference, and prioritize correctness and security over style.

---

## Review priorities

Triage findings in this order; spend the most attention near the top.

1. Correctness and data safety
2. Security boundaries
3. Maintainability and readability
4. Performance hot spots
5. Style and polish

---

## Anti-patterns to flag

| Smell | Use instead | Reference |
|---|---|---|
| Service object (`*Service`, `*Creator`, `*Manager`) | a method on the model that owns the data, or a noun-named PORO | `model.md` |
| Verb-named class | a noun (the concept); the verb is a method | `model.md` |
| Custom controller action (non-REST) | a new noun-named resource | `crud.md` |
| Business logic in the controller | move it to the model; controller stays thin | `crud.md`, `model.md` |
| Boolean column for business state | a state record (a noun) | `state-records.md` |
| Unpaired `!` method (no non-bang counterpart), or `mark_` prefix | `!` only with a counterpart; domain verbs (`fail`/`complete`) | `model.md`, `SKILL.md` |
| Duplicated behavior across models | extract a concern (adjective) | `concerns.md` |
| Foreign key constraint added | soft reference (indexed `*_id`, no FK) | `migration.md` |
| UUID or integer primary key | ULID | `migration.md` |
| `account_id` / tenant scoping added | nothing, this app is single-tenant | `multi-tenant.md` |
| Slow work in the request cycle | a background job (`_later`) | `jobs.md` |
| Manual cache invalidation (`Rails.cache.delete`, sweeper) | key-based: cache keys + `touch: true` | `caching.md` |
| `respond_to` JSON error rendering `model.errors` raw | the one error envelope (`code`/`message`) | `api.md` |
| RSpec / FactoryBot | Minitest / fixtures | `test.md` |
| Test asserting a method was called | assert observable behavior | `test.md` |
| Inbound webhook processed in the request | inbox: verify, store, ack, process async, idempotent | `webhooks.md` |
| Redirect to an unvalidated URL | check it against open redirects | `auth.md` |
| Secret/PII in logs or telemetry | scrub before emitting | `logging.md`, `auth.md` |
| Lookup not scoped to owner/parent | load through the association, or authorize via a model predicate | `auth.md`, `crud.md` |
| In-memory filter/sort, or `.map(&:name)` | SQL: `.where` / `.order` / `.pluck` (read-time sorting breaks pagination; compute at write) | `model.md` |
| `html_safe` on unescaped interpolation | escape first (`h(...)`) | `auth.md` |
| `fresh_when` / etag on a page with a form | no HTTP caching (stale CSRF → 422) | `caching.md` |
| `status == "x"` string check | string enum / predicate (`status_x?`) | `model.md` |
| `validates uniqueness: true` without a unique index | back it with a unique index | `migration.md` |
| Helper reading an implicit `@ivar` | explicit arguments | `SKILL.md` |
| New gem without strong justification | vanilla Rails, or 50-150 lines in-repo | `SKILL.md` |
| Metaprogramming for 2-3 cases | just write the methods | `SKILL.md` |
| Private-only concern | inline it | `concerns.md` |
| Speculative/defensive code with no current caller | YAGNI: remove until a real use case exists | `SKILL.md` |
| Production code shaped for test convenience | test the behavior as-is; don't leak test needs into the design | `test.md` |
| Special-case query to dodge bad data | normalize at input (`normalizes`) | `model.md` |
| Comment describing *what*, not *why* | explain intent, or delete it | `SKILL.md` |

---

## Per-area checklist

**Models**
- Business logic on the model, not a service object; classes are nouns, methods are verbs
- State with a when/who is a record; a single transition is a timestamp
- Concerns extract repeated behavior; `_commit` callbacks for external side effects

**Controllers / API**
- Only the seven REST actions; new behavior is a new resource
- No business logic; queries load through the parent / current user
- Strong parameters on every write; authorization via model predicates
- JSON errors use the single envelope; correct status codes

**Views**
- Turbo first (Streams/Frames/Broadcasts); Stimulus only for what Turbo can't do
- Fragment caching mirrors the data with `touch:`; no manual invalidation

**Jobs**
- `perform` calls a model `_now` method; no business logic in the job
- Enqueue from `after_create_commit`; retries use `:polynomially_longer`; long jobs use continuations
- Work is idempotent (at-least-once delivery)

**Tests**
- Minitest + fixtures; assert behavior; cover happy path and edge cases
- Auth flows tested for allowed and denied paths

**Data**
- ULID keys; soft references (no FK constraint); business state as records, not booleans
- A new table's full shape in one migration per branch

**Security**
- No secrets/PII in logs; signatures verified; redirects validated; no enumeration leaks

---

## Giving feedback

Lead with the biggest issue, not line order: correctness and security first, style secondary (the linter owns most of it). For each finding, state the anti-pattern, **show the rewrite** (exact code, `file:line`), and name the principle behind it so the author learns the rule, not just the fix. Link the reference for the full pattern. Acknowledge what was done well, separate must-fix from nice-to-have, and end with a verdict: `Ship it`, or a short prioritized fix list.

Voice:

- **Terse.** One or two sentences. A nit can be a single word: "Inline.", "Pluck.", "Same here."
- **Drop the subject pronoun.** "Would extract this method", "Think we can drop this test" — not "You should...".
- **Ask, don't assert, when the answer might be good.** "Why not an enum here?", "What does this give over `order(:created_at)`?"
- **Hedged but decisive.** "I'd probably just go with X", "Would consider Y": soft tone, clear direction.
- **State the principle behind the nit**, not just that it's wrong: "the class name should stand alone".
- **Honest uncertainty** when judgment isn't settled: "Something feels off here, maybe it's...".
- **Praise sparingly and briefly**: "Much nicer 👌" — rare, one emoji at most.
