# Architecture Document Reference

How to produce a polished, self-contained **HTML architecture document** with elegant hand-drawn-style SVG diagrams. Read this in Phase 7.

## Table of Contents

1. How to start
2. Visual system
3. Building blocks (CSS classes)
4. SVG diagram conventions
5. Standard sections
6. Diagram catalog
7. Consistency & accessibility

---

## 1. How to start

Copy `assets/architecture-template.html` to the target location, open it, and **keep the `<style>` block and structure intact** — replace only the placeholder content. The result is a single file that opens in a browser with no build step. Keep it vendor-neutral unless the user asks for branding.

## 2. Visual system

- **Palette (CSS variables):** dark navy dock (`--bushido`), coral accents (`--coral`, `--coral-strong`, `--coral-soft`), blue (`--mizu`), purple (`--purple`), plus semantic `--success` / `--warn` / `--danger` and soft backgrounds. Use coral for the Core/primary, blue for supporting/app, purple for domain, green for infrastructure, sand/tan for external.
- **Fonts:** `Lato` for prose and diagram labels; `JetBrains Mono` for code, identifiers, and folder trees.
- **Layout:** sticky left **dock** (navigation) + centered **main** (max-width ~920px). Generous spacing, rounded corners (`--radius` 10px, cards/diagrams 14–16px).

## 3. Building blocks (CSS classes)

- `meta-row` / `meta-item` — header chips (Stack, Pattern, etc.).
- `toc-inline` — two-column table of contents.
- `card-grid` + `card` (with `card-title .tag`) — feature/option cards.
- `callout` with variants `info`, `ok`, `warn`, `danger` — highlighted notes.
- `badge` with variants `core`, `support`, `generic`, `ok`, `warn`, `info`, `todo` — inline labels.
- `diagram` (wrapper, grid background) + `svg` + `diagram-caption` (italic, numbered) + `legend` (color key).
- `stack-grid` / `stack-row` / `stack-key` / `stack-val .pill` — the tech-stack table.
- `gap-list` / `gap` (`gap-id` + `gap-body`) — backlog/decision items.
- `principle-grid` / `principle` — compact principle cards.
- `two-col` — side-by-side panels.

## 4. SVG diagram conventions

- `viewBox="0 0 880 H"` — width 880 to match the column; pick H per diagram. Always set `role="img"` and a descriptive `aria-label`.
- **Arrows:** define a `<marker>` per diagram with a unique id (e.g., `arr`, `m-arr`, `o-arr`); reuse via `marker-end`. Color the arrow to match its meaning (neutral gray for flow, coral for push/UI, purple for domain/events, green for success/data, tan/gold for external calls).
- **Boxes:** rounded `rect` (`rx` 8–14). White fill with a colored stroke for items; soft fill (the `*-soft` colors or light gradients) for zones/bands.
- **Zones:** large soft-filled rounded rects with an uppercase, letter-spaced label in the top-left.
- **Text:** Lato for titles (`font-weight:700`) and labels; JetBrains Mono for identifiers/trees. Keep secondary text ~9.5–10.5px in a muted gray.
- **Captions:** every diagram ends with `diagram-caption` numbered sequentially: `Diagrama N — ...` (or `Diagram N — ...`). Keep numbering contiguous; if you insert one, renumber the rest.
- Escape `<`, `>`, and `&` in SVG text (`&lt;`, `&gt;`, `&amp;`).

## 5. Standard sections

Order them in the dock and main, each with one focused diagram where useful:

1. Overview — what the platform is.
2. Domains (DDD) — context map (Core/Supporting/Generic + external via ACL).
3. Principles — modular + structural.
4. Modular monolith — monorepo map (apps/bootstrap + libs/contexts + shared).
5. Bounded contexts — rich aggregates.
6. Anti-Corruption Layer — ports & adapters.
7. Communication — events + transactional outbox.
8. Front-to-back — OpenAPI/typed client + REST + SSE.
9. Modules — flat-by-aggregate (folder tree + dependency rule via suffixes).
10. Workflow — durable pipeline (if any).
11. Data model — ERD with ownership per context.
12. Resilience — timeout → breaker → retry (backoff + jitter).
13. Real-time — SSE (+ pub/sub fan-out).
14. Evolution — staged granularity.
15. Stack — the tech table.

## 6. Diagram catalog

Reusable diagram types (all in the same visual language):

- **Context map** — zones for Core / Supporting / Generic and a band for external systems behind the ACL.
- **Monorepo map** — three stacked layers: apps (bootstrap) → libs (contexts) → shared.
- **Rich aggregate** — a root box with methods (ubiquitous language) + child entity + value-object pills + invariant note.
- **Ports & Adapters** — core column, port column, adapter column, external column; arrows for "uses", "implements" (dashed, inward), "calls".
- **Transactional outbox** — business + outbox in one ACID box → relay → bus → idempotent consumers.
- **Front-to-back** — browser box and backend box with REST (request/response) and SSE (push) arrows, plus the OpenAPI→client codegen band.
- **Flat-by-aggregate module** — a folder tree (mono) beside the dependency rule (controller → service → entity ← repository).
- **Durable pipeline** — a horizontal step pipeline under an orchestrator band.
- **ERD by context** — table boxes grouped/colored by owning context; solid lines for in-context FKs, dashed for cross-context id references.
- **Resilience layers** — nested rects (timeout ⊃ breaker ⊃ retry ⊃ call) + fallback box + the jitter formula.
- **SSE fan-out** — browsers ↔ instances ↔ pub/sub ↔ event source.
- **Sequence** — lanes with lifelines and numbered messages (use distinct arrow colors per actor).
- **Evolution timeline** — staged boxes connected by arrows, with a "you are here" marker.

## 7. Consistency & accessibility

- One visual language across all diagrams (same palette, fonts, corner radius, arrow style).
- Number diagrams contiguously; keep the dock nav, the inline TOC, and the section ids in sync.
- Add `role="img"` and `aria-label` to every SVG; provide a `legend` when colors carry meaning.
- Keep content generic and reusable; do not hard-code a company name unless explicitly requested.
