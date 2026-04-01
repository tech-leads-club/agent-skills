---
name: pagerunner-skill
description: Real Chrome browser automation for AI agents. Use when you need browser automation with real Chrome sessions, authenticated access using existing Chrome profiles, PII anonymization, or multi-agent browser coordination. Do NOT use for static HTML fetching (use WebFetch), cross-browser testing (use Playwright), or cloud remote browsers.
version: "1.0.0"
author: Stas
---

# Pagerunner Skill

**Pagerunner** is real Chrome browser automation for AI agents. Gives Claude, Cursor, Windsurf, or any MCP client native control over real Chrome — with existing login sessions, cookies, and browser history already loaded.

## Prerequisites

Install Pagerunner and register as MCP server:

```bash
brew tap enreign/pagerunner && brew install pagerunner
claude mcp add pagerunner "$(which pagerunner)" mcp
```

## Quick Start

### Solo Developer (Claude Code / Cursor)

```javascript
const sessionId = await open_session({ profile: "personal" });
const [tab] = await list_tabs(sessionId);
await navigate(sessionId, tab.target_id, "http://localhost:3000");
await screenshot(sessionId, tab.target_id);
await close_session(sessionId);
```

### PII-Safe Automation

```javascript
open_session({ profile: "agent", anonymize: true });
// john@company.com → [EMAIL:a3f9b2] before reaching the LLM
```

### Multi-Agent Coordination

```javascript
pagerunner daemon &  // persistent process

await kv_set("pipeline", "checkpoint", JSON.stringify(data));  // Agent A
const data = await kv_get("pipeline", "checkpoint");           // Agent B
```

## Common Gotchas

**Arrays cause hallucinations** — always return labeled objects from `evaluate()`:
```javascript
return { likes, replies };  // ✅ not [likes, replies]
```

**Async selectors** — always `wait_for` before clicking after navigation.

**Fill vs type** — use `fill()` for React/Vue (synthetic events), `type_text()` for plain HTML.

## References

Full documentation: https://github.com/Enreign/pagerunner-skill

- [PATTERNS.md](https://github.com/Enreign/pagerunner-skill/blob/main/PATTERNS.md) — 11 workflow patterns
- [REFERENCE.md](https://github.com/Enreign/pagerunner-skill/blob/main/REFERENCE.md) — all 27 tools
- [SECURITY.md](https://github.com/Enreign/pagerunner-skill/blob/main/SECURITY.md) — PII anonymization, audit logging
- [EXAMPLES.md](https://github.com/Enreign/pagerunner-skill/blob/main/EXAMPLES.md) — full ICP workflows
