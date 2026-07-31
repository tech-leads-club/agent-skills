# 🔌 agent-skills-mcp

MCP server that exposes the same [agent-skills](https://github.com/tech-leads-club/agent-skills) catalog to any MCP-compatible AI client. Use it when you want the agent to **consult skills on demand** during a session — search by intent, then fetch only what's needed.

## CLI vs MCP

Both use the **same catalog** and the same CDN. Choose by workflow:

|                 | **CLI** (`@tech-leads-club/agent-skills`)                                                    | **MCP** (this package)                                                            |
| :-------------- | :------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------- |
| **Use when**    | You want skills **installed** in your agent (project or global) so they're always available. | You want the agent to **look up** skills during a chat — no installation.         |
| **Persistence** | Skills live in `.agents/`, `~/.cursor/skills/`, etc.                                         | No local install; agent fetches from CDN when it needs a skill.                   |
| **Best for**    | Curated set of skills you use often; lockfile, updates, multi-agent install.                 | One-off help, exploring the catalog, or trying a skill before installing via CLI. |

You can use **both**: install your go-to skills with the CLI and add the MCP so the agent can pull in others on demand.

## Why use this MCP

When the agent needs a skill mid-session, loading the full catalog would be wasteful. This server provides a **three-step workflow** — search by intent, load the right skill, then fetch only the references needed — so the agent finds skills in one tool call and doesn't overfetch or guess names.

The three steps map onto the three levels of **progressive disclosure**, and each level pays only for itself:

| Level          | Tool                  | What loads                                                               | Typical cost                                |
| :------------- | :-------------------- | :----------------------------------------------------------------------- | :------------------------------------------ |
| 1 — Discovery  | `search_skills`       | `name`, `category`, `usage_hint`, score                                  | ~50–250 tokens for up to 5 candidates       |
| 2 — Activation | `read_skill`          | `SKILL.md` body, frontmatter stripped, plus the reference index          | the skill body only — a few thousand tokens |
| 3 — Execution  | `fetch_skill_files`   | Only the `references/`, `scripts/`, `assets/` the instructions asked for | Bounded at ~12.5k tokens per call           |
| 3 — Execution  | `prepare_skill_files` | Nothing — files land on disk, the agent gets `file://` links             | ~700 tokens for a whole skill               |

Level 3 has two doors because skills use their bundled files in two different ways. A file under `references/` is meant to be **read**, so `fetch_skill_files` returns its text. A file under `scripts/` is meant to be **run** — skill instructions invoke them by path, e.g. `node $SKILL_DIR/scripts/render.mjs` — so `prepare_skill_files` writes the verified file to disk and returns a `file://` resource link instead of its contents. Staging cost is flat: a handful of tokens per file, regardless of file size.

For explicit catalog browsing requests, there is also a dedicated `list_skills` tool that returns a compact category-grouped list with truncated descriptions.

Search is powered by **Fuse.js**: per-token fuzzy matching over name, extracted trigger keywords, description, and category, with relevance scoring (0–100 + match quality). Natural intent phrases work directly — no query syntax to learn.

`search_skills` and `list_skills` declare an MCP `outputSchema`, so clients receive validated `structuredContent` plus a JSON text fallback.

## 🛠️ Tools

### `list_skills`

> **Catalog browse tool (explicit request only).**
> **When:** The user explicitly asks to list/browse available skills.
> **Input:** `explicit_request: true` (required) and optional `description_max_chars` (default `120`, range `40..240`).
> **Returns:** Available skills grouped by `category`, each with `name` and truncated `description`, plus `total_skills` and `total_categories`.
> **Constraints:** Do not call proactively during normal search/read/fetch workflow.

- Returns `structuredContent` validated against the tool's `outputSchema`, with a JSON text fallback
- Designed for low token usage with compact JSON output
- Uses in-memory index data (no extra registry fetch on execution)
- Returns only currently available skills for use

### `search_skills`

> **Step 1 of 3** in the skill workflow. Always call this before `read_skill`.
> **When:** The user needs help with a technical task (implement, refactor, test, deploy, review, etc.).
> **Input:** A concise intent phrase in English, e.g. `typescript api error handling`, `react component testing`.
> **Returns:** Up to 5 skills ranked by relevance with `name`, `category`, `usage_hint`, `score` (0-100), and `match_quality`.
> **Then:** Pick the highest-scoring match and call `read_skill` with its name.

**Search features:**

- **Per-token fuzzy matching** (`useTokenSearch` + `ignoreLocation`): each word is scored independently, anywhere in the field, so natural phrases match without query operators
- **Weighted fields:** `name` (0.45), extracted `triggers` (0.30), `description` (0.20), `category` (0.05)
- **Trigger extraction:** Automatically parses "Triggers on...", "Use when...", and "Keywords -..." patterns from descriptions into a high-signal index field
- **Relevance scoring:** Each result includes a 0-100 score and a human-readable `match_quality` label (`exact` ≥45 / `strong` ≥30 / `partial` ≥20 / `weak`)
- **Noise floor:** `weak` matches are dropped. Fuzzy matching returns a ranked list for _any_ query, including one no skill answers, so without a floor the agent receives near-zero-scoring results it might act on. It now gets `results: []` and can conclude no skill applies.
- Returns `structuredContent` validated against the tool's `outputSchema`, with a JSON text fallback
- Omits the full `description` from results — `usage_hint` carries the gist, and `read_skill` provides the rest
- Minimum match character length of 2 to avoid noise
- Empty query → `UserError("Query cannot be empty")`
- No matches (or only `weak` ones) → empty array with explanatory message

### `read_skill`

> **Step 2 of 3.** Call after `search_skills` — never call directly without searching first.
> **Input:** The skill `name` from `search_skills` results.
> **Returns:** `[0]` The skill's main instructions (SKILL.md). `[1]` A list of available reference file paths (`scripts/`, `references/`, `assets/`).
> **Then:** Apply the skill instructions. Only call `fetch_skill_files` if the instructions reference specific files you need.

- Fetches `SKILL.md` explicitly from `files[]` as the main skill instructions
- **Strips the YAML frontmatter** before returning: `name` and `description` are the level-1 discovery payload the agent already got from `search_skills`, so resending them duplicates that payload and puts registry metadata ahead of the instructions. Integrity is unaffected — the `contentHash` is verified over the original bytes first.
- Reference list covers every file the registry declares for the skill except `SKILL.md`, whatever directory it sits in — the registry's file list is the contract, not a folder-name convention
- Returns two separate content blocks: main content + compact reference list (capped at 50 paths)
- Skill with only one file returns a single content block (no empty second block)
- Invalid `skill_name` → `UserError("Skill '{name}' not found. Use search_skills to find valid names.")`
- CDN failure → `UserError("CDN unavailable. Try again shortly.")`

### `fetch_skill_files`

> **Step 3 of 3 (optional).** Fetch reference files that a skill's instructions told you to load.
> **Input:** `skill_name` + up to 5 `file_paths` from the reference list returned by `read_skill`.
> **Returns:** The content of each requested file, separated by `---` delimiters.
> **Constraints:** Only paths from `read_skill`'s reference list are valid — never guess or construct paths. Make multiple calls if you need more than 5 files.

- Validates **all** paths against `skill.files[]` before any network call — rejects with the full list of invalid paths
- Accepts any path from `read_skill`'s list; paths not declared for that skill are rejected
- Fetches valid files in parallel (`Promise.allSettled`)
- Partial failure: returns successful content and notes failed paths — does not abort the entire response
- **Response budget of 50,000 chars (~12.5k tokens):** files are emitted in the requested order; anything beyond the budget is truncated or omitted, and the response names what was left out so the agent can request it in a follow-up call. Without this, five large reference files could exceed the 25k-token cap agents apply to tool responses.
- Use this for files meant to be **read**. For files meant to be **run**, use `prepare_skill_files`.

### `prepare_skill_files`

> **Step 3 of 3 (alternative to `fetch_skill_files`).** Writes a skill's files to disk so the agent can execute them.
> **When:** The skill's instructions tell the agent to run something (`node $SKILL_DIR/scripts/render.mjs`, `python <path-to-skill>/scripts/check.py`).
> **Input:** `skill_name` + optional `file_paths` (defaults to every `scripts/`, `references/`, `assets/` file).
> **Returns:** The absolute `skill_dir` to use as `$SKILL_DIR`, plus one `resource_link` per staged file — **not** the file contents.
> **Then:** Run the skill's command with `SKILL_DIR` set to the returned path.

- **The only tool that writes to disk** — declared as `readOnlyHint: false`, `destructiveHint: false`, `idempotentHint: true`. Both hints are properties of the implementation, not promises: the staging directory is keyed on the skill's `contentHash` (`<skill>/<revision>/`), so a new revision lands **beside** the old one rather than replacing it, and a file already on disk with identical bytes is left untouched — which is what makes "additive" and "idempotent" literally true rather than arguable
- `dry_run` returns the destination and the exact file list **before** any network fetch or write, so the call is previewable without depending on client elicitation support
- Superseded revisions of the same skill are reclaimed after a one-hour grace period, so the cache does not grow with every published revision. Only unreachable directories are removed: never the current revision, never another skill, and never one used recently enough that a script could still be running out of it
- Files are written under `~/.cache/agent-skills-mcp/` (override with `SKILLS_STAGING_DIR`), mode `0600`, **without** the execute bit — running staged code takes a deliberate act (invoking an interpreter), never an accidental one
- **Every file is checksum-verified before being written**, so nothing unverified reaches the filesystem
- Paths are validated twice against traversal: once on the registry-supplied path list, then again after resolution, because `files[]` is remote input served by the CDN
- Uses `resource_link` with a `file://` URI — the spec's canonical shape for referencing a file without inlining it

---

## 📦 Resource & Prompts

### `skills://catalog`

Full registry JSON (`application/json`). MCP clients that support Resources can cache this natively, eliminating round-trips for catalog data.

### Prompts (Slash Commands)

MCP prompts are surfaced as **slash commands** (`/`) in compatible clients (Claude Desktop, Cursor, VS Code + Copilot, Claude Code). They give users instant access to skills without typing tool names.

#### `/skills` — Main entrypoint

The easiest way to use the catalog. Give your task in natural language and the prompt guides the agent through `search_skills` → `read_skill` → apply.

| Argument | Required | Description                                                           |
| :------- | :------- | :-------------------------------------------------------------------- |
| `task`   | Yes      | What you are trying to accomplish (e.g. "optimize React performance") |

Examples:

- `/skills task:"refactor a large React component"`
- `/skills task:"review accessibility issues in my UI"`
- `/skills task:"plan migration from monolith to modular architecture"`

#### `/use` — Direct skill shortcut

Use when you already know the exact skill name and want a direct shortcut.

| Argument  | Required | Description                           |
| :-------- | :------- | :------------------------------------ |
| `name`    | Yes      | Exact skill name (e.g. `docs-writer`) |
| `context` | No       | What specifically you need help with  |

Examples:

- `/use name:"docs-writer" context:"write a README for this package"`
- `/use name:"react-best-practices" context:"improve Next.js page performance"`

#### `/skills-help` — Quick usage examples

Shows quick examples and when to use `/skills` vs `/use`.

#### `/find-skill` — Compatibility alias

Alias for `/skills` with the same `task` argument.

---

## 🚀 Quick Start

### Plugin Install (Recommended)

The fastest way — no manual config, no JSON editing.

#### Cursor

Browse [cursor.com/marketplace](https://cursor.com/marketplace) and search for **`agent-skills`**, or type inside Cursor:

```bash
/add-plugin agent-skills
```

#### Claude Code

Add the Tech Leads Club marketplace, then install the plugin:

```bash
/plugin marketplace add tech-leads-club/agent-skills
/plugin install agent-skills-mcp@tech-leads-club
```

Or browse the [official Anthropic plugin directory](https://claude.com/plugins) and search for **`agent-skills-mcp`**.

### Manual Install (Any MCP-compatible agent)

Add the MCP server directly to your agent's config. The block below is the standard MCP format — works for most agents:

```json
{
  "mcpServers": {
    "agent-skills": {
      "command": "npx",
      "args": ["-y", "@tech-leads-club/agent-skills-mcp"]
    }
  }
}
```

#### Claude Code (CLI)

```bash
claude mcp add agent-skills -- npx -y @tech-leads-club/agent-skills-mcp
```

#### VS Code (GitHub Copilot)

`.vscode/mcp.json` uses a slightly different schema:

```json
{
  "servers": {
    "agent-skills": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@tech-leads-club/agent-skills-mcp"]
    }
  }
}
```

## ⚡ Caching

The registry is fetched from [jsDelivr CDN](https://cdn.jsdelivr.net/gh/tech-leads-club/agent-skills@latest/packages/skills-catalog/skills-registry.json) and cached in memory:

- **TTL:** 15 minutes — cache hit returns immediately with no network call
- **ETag revalidation:** on TTL expiry, sends `If-None-Match`; a `304 Not Modified` renews the TTL without re-downloading the payload
- **Cold start retry:** 3 attempts with exponential backoff — server won't start if CDN is unreachable
- **Stale fallback:** if CDN fails after warmup, stale cache is returned rather than erroring
- All cache events are logged to `stderr` (never `stdout` — stdout is reserved for JSON-RPC)

## 🔒 Error Reference

| Scenario                               | Behaviour                                                                       |
| :------------------------------------- | :------------------------------------------------------------------------------ |
| Registry CDN unreachable at cold start | Retries 3× with exponential backoff, then server exits with error               |
| Registry CDN unreachable after warmup  | Stale cache returned; warning logged to `stderr`                                |
| Malformed registry JSON                | Logged to `stderr`; stale cache used if available                               |
| `skill_name` not in registry           | `UserError`: "Skill '{name}' not found. Use search_skills to find valid names." |
| `file_paths` contains invalid path     | `UserError` listing all invalid paths — no files fetched                        |
| `search_skills` with empty query       | `UserError`: "Query cannot be empty"                                            |
| One parallel file fetch fails          | Partial success: successful files returned, failed path noted in output         |

## 🧪 Development

From the **repo root**:

```bash
npm run build              # Build all (or: npx nx build @tech-leads-club/agent-skills-mcp)
npx nx lint @tech-leads-club/agent-skills-mcp
npx nx test @tech-leads-club/agent-skills-mcp
npm run start:dev:mcp      # Build MCP and open Inspector
```

From **packages/mcp**:

```bash
npx nx build @tech-leads-club/agent-skills-mcp
npx nx lint @tech-leads-club/agent-skills-mcp
npx nx test @tech-leads-club/agent-skills-mcp
npm run start:dev          # Build + Inspector (uses ../../dist/packages/mcp)
```

## ⚙️ Requirements

- Node.js ≥ 24

## 📄 License & repo

MIT — [Tech Leads Club](https://github.com/tech-leads-club). Same repo as the [CLI](https://github.com/tech-leads-club/agent-skills#-quick-start) and the [skills catalog](https://tech-leads-club.github.io/agent-skills/).
