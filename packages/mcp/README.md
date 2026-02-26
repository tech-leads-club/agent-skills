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

For explicit catalog browsing requests, there is also a dedicated `list_skills` tool that returns a compact category-grouped list with truncated descriptions.

Search is powered by **Fuse.js**: fuzzy matching over name, extracted trigger keywords, description, and category, with extended operators and relevance scoring (0–100 + match quality).

## 🛠️ Tools

### `list_skills`

> **Catalog browse tool (explicit request only).**
> **When:** The user explicitly asks to list/browse available skills.
> **Input:** `explicit_request: true` (required) and optional `description_max_chars` (default `120`, range `40..240`).
> **Returns:** Available skills grouped by `category`, each with `name` and truncated `description`, plus `total_skills` and `total_categories`.
> **Constraints:** Do not call proactively during normal search/read/fetch workflow.

- Designed for low token usage with compact JSON output
- Uses in-memory index data (no extra registry fetch on execution)
- Returns only currently available skills for use

### `search_skills`

> **Step 1 of 3** in the skill workflow. Always call this before `read_skill`.
> **When:** The user needs help with a technical task (implement, refactor, test, deploy, review, etc.).
> **Input:** A concise intent phrase, e.g. `typescript api error handling`, `react component testing`.
> **Returns:** Up to 5 skills ranked by relevance with `name`, `description`, `category`, `usage_hint`, `score` (0-100), and `match_quality`.
> **Then:** Pick the highest-scoring match and call `read_skill` with its name.
> **Tips:** Multi-word queries use AND logic. Use `|` for OR (e.g. `react | vue testing`). Use `=` for exact match.

**Search features:**

- Fuzzy matching via Fuse.js with **extended search operators** (AND, OR `|`, exact `=`, prefix `^`)
- **Weighted fields:** `name` (0.45), extracted `triggers` (0.30), `description` (0.20), `category` (0.05)
- **Trigger extraction:** Automatically parses "Triggers on...", "Use when...", and "Keywords -..." patterns from descriptions into a high-signal index field
- **Relevance scoring:** Each result includes a 0-100 score and a human-readable `match_quality` label (`exact` / `strong` / `partial` / `weak`)
- Minimum match character length of 2 to avoid noise
- Empty query → `UserError("Query cannot be empty")`
- No matches → empty array with explanatory message

### `read_skill`

> **Step 2 of 3.** Call after `search_skills` — never call directly without searching first.
> **Input:** The skill `name` from `search_skills` results.
> **Returns:** `[0]` The skill's main instructions (SKILL.md). `[1]` A list of available reference file paths (`scripts/`, `references/`, `assets/`).
> **Then:** Apply the skill instructions. Only call `fetch_skill_files` if the instructions reference specific files you need.

- Fetches `SKILL.md` explicitly from `files[]` as the main skill instructions
- Reference list includes only paths under `scripts/`, `references/`, and `assets/`
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
- Accepts only paths under `scripts/`, `references/`, and `assets/` from `read_skill`
- Fetches valid files in parallel (`Promise.allSettled`)
- Partial failure: returns successful content and notes failed paths — does not abort the entire response

---

## 📦 Resource & Prompts

### `skills://catalog`

Full registry JSON (`application/json`). MCP clients that support Resources can cache this natively, eliminating round-trips for catalog data.

### Prompts (Slash Commands)

MCP prompts are surfaced as **slash commands** (`/`) in compatible clients (Claude Desktop, Cursor, VS Code + Copilot, Claude Code). They give users instant access to skills without typing tool names.

#### `/find-skill` — Discovery

Search for the best skill when you don't know which one you need. Guides the agent through `search_skills` → `read_skill` → apply.

| Argument | Required | Description                                                           |
| :------- | :------- | :-------------------------------------------------------------------- |
| `task`   | Yes      | What you are trying to accomplish (e.g. "optimize React performance") |

#### `/skill-<name>` — Direct Skill Access

One prompt per skill in the catalog (e.g. `/skill-docs-writer`, `/skill-react-composition-patterns`). Selecting one instructs the agent to call `read_skill` directly — no search step needed.

| Argument  | Required | Description                          |
| :-------- | :------- | :----------------------------------- |
| `context` | No       | What specifically you need help with |

**How it works:** On startup, the MCP server reads the registry and registers one prompt per skill. Each prompt's description is a concise summary extracted from the skill's full description (text before "Use when…" or the first sentence, capped at 160 chars).

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
npm run build              # Build all (or: npx nx build mcp)
npx nx lint mcp
npx nx test mcp
npm run start:dev:mcp      # Build MCP and open Inspector
```

From **packages/mcp**:

```bash
npx nx build mcp
npx nx lint mcp
npx nx test mcp
npm run start:dev          # Build + Inspector (uses ../../dist/packages/mcp)
```

## ⚙️ Requirements

- Node.js ≥ 24

## 📄 License & repo

MIT — [Tech Leads Club](https://github.com/tech-leads-club). Same repo as the [CLI](https://github.com/tech-leads-club/agent-skills#-quick-start) and the [skills catalog](https://tech-leads-club.github.io/agent-skills/).
