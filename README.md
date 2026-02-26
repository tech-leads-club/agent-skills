<p align="center">
  <img src=".github/assets/logo.png" alt="Tech Leads Club" width="400" />
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/@tech-leads-club/agent-skills?style=flat-square&color=blue" alt="npm version" />
  <img src="https://img.shields.io/npm/dt/@tech-leads-club/agent-skills?style=flat-square&color=blue" alt="total downloads" />
  <img src="https://img.shields.io/npm/dm/@tech-leads-club/agent-skills?style=flat-square&color=blue" alt="monthly downloads" />
  <img src="https://img.shields.io/github/license/tech-leads-club/agent-skills?style=flat-square" alt="license" />
  <img src="https://img.shields.io/github/actions/workflow/status/tech-leads-club/agent-skills/release.yml?style=flat-square" alt="build status" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D22-brightgreen?style=flat-square&logo=node.js" alt="node version" />
  <img src="https://img.shields.io/badge/TypeScript-100%25-blue?style=flat-square&logo=typescript" alt="typescript" />
  <img src="https://img.shields.io/badge/Nx%20Cloud-Enabled-blue?style=flat-square&logo=nx" alt="nx cloud" />
  <img src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square" alt="semantic-release" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/tech-leads-club/agent-skills?style=flat-square&color=yellow" alt="github stars" />
  <img src="https://img.shields.io/github/contributors/tech-leads-club/agent-skills?style=flat-square&color=orange" alt="contributors" />
  <img src="https://img.shields.io/github/last-commit/tech-leads-club/agent-skills?style=flat-square" alt="last commit" />
  <img src="https://img.shields.io/badge/AI-Powered%20Skills-purple?style=flat-square&logo=openai" alt="ai powered" />
</p>

<h1 align="center">🧠 Agent Skills</h1>

<p align="center">
  <strong>The secure, validated skill registry for professional AI coding agents</strong>
</p>

<p align="center">
  In an ecosystem where <a href="https://github.com/snyk/agent-scan/blob/main/.github/reports/skills-report.pdf">over 13% of marketplace skills contain critical vulnerabilities</a>,
  <b>Agent Skills</b> stands apart as a hardened library of <b>verified</b>, <b>tested</b>, and <b>safe</b> capabilities.
  Extend <b>Antigravity</b>, <b>Claude Code</b>, <b>Cursor</b>, and more with absolute confidence.
</p>

<p align="center">
  <a href="https://tech-leads-club.github.io/agent-skills/" target="_blank">https://tech-leads-club.github.io/agent-skills/</a>
</p>

## 📖 Table of Contents

- [✨ What are Skills?](#-what-are-skills)
- [🛡️ Security & Trust](#️-security--trust)
- [🤖 Supported Agents](#-supported-agents)
- [🌟 Featured Skills](#-featured-skills)
- [🚀 Quick Start](#-quick-start)
- [⚡ How It Works](#-how-it-works)
- [🔌 MCP Server](#-mcp-server)
- [🤝 Contributing](#-contributing)
- [🛡️ Content & Authorship](#️-content--authorship)
- [📄 License and Attribution](#-license-and-attribution)

## ✨ What are Skills?

Skills are packaged instructions and resources that extend AI agent capabilities. Think of them as **plugins for your AI assistant** — they teach your agent new workflows, patterns, and specialized knowledge.

```
packages/skills-catalog/skills/
  (category-name)/
    skill/
      SKILL.md          ← Main instructions
      templates/        ← File templates
      references/       ← On-demand documentation
```

## 🛡️ Security & Trust

Your environment's safety is our top priority. Unlike open marketplaces where **13.4% of skills contain critical issues**, `agent-skills` is a managed, hardened library: 100% open source (no binaries), static analysis in CI/CD, immutable integrity via lockfiles and content hashing, and human-curated prompts. The CLI uses defense-in-depth (sanitization, path isolation, symlink guards, atomic lockfile, audit trail); every skill is scanned with [mcp-scan](https://github.com/invariantlabs-ai/mcp-scan) before publishing.

→ **Full threat model, implementation details, and vulnerability reporting:** [SECURITY.md](SECURITY.md)

## 🤖 Supported Agents

Install skills to any of these AI coding agents:

<div align="center">
<br />

|                     Tier 1 (Popular)                      |                            Tier 2 (Rising)                             |                   Tier 3 (Enterprise)                   |
| :-------------------------------------------------------: | :--------------------------------------------------------------------: | :-----------------------------------------------------: |
|         **[Claude Code](https://claude.ai/code)**         |                    **[Aider](https://aider.chat)**                     |   **[Amazon Q](https://aws.amazon.com/q/developer/)**   |
|        **[Cline](https://github.com/cline/cline)**        |               **[Antigravity](https://idx.google.com)**                |       **[Augment](https://www.augmentcode.com)**        |
|             **[Cursor](https://cursor.com)**              | **[Gemini CLI](https://ai.google.dev/gemini-api/docs/code-execution)** |    **[Droid (Factory.ai)](https://www.factory.ai)**     |
| **[GitHub Copilot](https://github.com/features/copilot)** |                  **[Kilo Code](https://kilocode.ai)**                  | **[OpenCode](https://github.com/opencode-ai/opencode)** |
|       **[Windsurf](https://codeium.com/windsurf)**        |                     **[Kiro](https://kiro.dev/)**                      |  **[Sourcegraph Cody](https://sourcegraph.com/cody)**   |
|                                                           |    **[OpenAI Codex](https://openai.com/index/introducing-codex/)**     |         **[Tabnine](https://www.tabnine.com)**          |
|                                                           |                    **[Roo Code](https://roo.dev)**                     |                                                         |
|                                                           |                    **[TRAE](https://docs.trae.ai)**                    |                                                         |

</div>

<p align="center">
  <sub>Missing your favorite agent? <a href="https://github.com/tech-leads-club/agent-skills/issues/new"><strong>Open an issue</strong></a> and we'll add support!</sub>
</p>

## 🌟 Featured Skills

A glimpse of what's available in our growing catalog:

| Skill                                                                                              | Category    | Description                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[tlc-spec-driven](<packages/skills-catalog/skills/(development)/tlc-spec-driven>)**              | Development | Project and feature planning with 4 phases: Specify → Design → Tasks → Implement. Creates atomic tasks with verification criteria and maintains persistent memory across sessions. |
| **[aws-advisor](<packages/skills-catalog/skills/(cloud)/aws-advisor>)**                            | Cloud       | Expert AWS Cloud Advisor for architecture design, security review, and implementation guidance. Leverages AWS MCP tools for documentation-backed answers.                          |
| **[playwright-skill](<packages/skills-catalog/skills/(web-automation)/playwright-skill>)**         | Automation  | Complete browser automation with Playwright. Test pages, fill forms, take screenshots, validate UX, and automate any browser task.                                                 |
| **[figma](<packages/skills-catalog/skills/(design)/figma>)**                                       | Design      | Fetch design context from Figma and translate nodes into production code. Design-to-code implementation with MCP integration.                                                      |
| **[security-best-practices](<packages/skills-catalog/skills/(security)/security-best-practices>)** | Security    | Language and framework-specific security reviews. Detect vulnerabilities, generate reports, and suggest secure-by-default fixes.                                                   |

<p align="center">
  <a href="#-quick-start"><strong>→ Browse all skills</strong></a>
</p>

## 🚀 Quick Start

### Install Skills in Your Project

```bash
npx @tech-leads-club/agent-skills
```

This launches an interactive wizard:

1. **Choose Action** — "Install skills" or "Update installed skills"
2. **Browse & Select** — Filter by category or search
3. **Choose agents** — Pick target agents (Cursor, Claude Code, etc.)
4. **Installation method** — Copy (recommended) or Symlink
5. **Scope** — Global (user home) or Local (project only)

Each step shows a **← Back** option to return and revise your choices.

### CLI Options

> **Note**: You can use either `npx @tech-leads-club/agent-skills` or install globally and use `agent-skills` directly.

```bash
# Interactive mode (default)
npx @tech-leads-club/agent-skills
# or: agent-skills (if installed globally)

# List available skills
agent-skills list
agent-skills ls        # Alias

# Install one skill
agent-skills install -s tlc-spec-driven

# Install multiple skills at once
agent-skills install -s aws-advisor coding-guidelines docs-writer

# Install to specific agents
agent-skills install -s my-skill -a cursor claude-code

# Install multiple skills to multiple agents
agent-skills install -s aws-advisor nx-workspace -a cursor windsurf cline

# Install globally (to ~/.gemini, ~/.claude, etc.)
agent-skills install -s my-skill -g

# Use symlink instead of copy
agent-skills install -s my-skill --symlink

# Force re-download (bypass cache)
agent-skills install -s my-skill --force

# Update a specific skill
agent-skills update -s my-skill

# Update all installed skills
agent-skills update

# Remove one skill
agent-skills remove -s my-skill

# Remove multiple skills at once
agent-skills remove -s skill1 skill2 skill3
agent-skills rm -s my-skill    # Alias

# Remove from specific agents
agent-skills remove -s my-skill -a cursor windsurf

# Force removal (bypass lockfile check)
agent-skills remove -s my-skill --force

# Manage cache
agent-skills cache --clear           # Clear all cache
agent-skills cache --clear-registry  # Clear only registry
agent-skills cache --path            # Show cache location

# View audit log
agent-skills audit                   # Show recent operations
agent-skills audit -n 20             # Show last 20 entries
agent-skills audit --path            # Show audit log location

# Show contributors and credits
agent-skills credits

# Show help
agent-skills --help
```

### Global Installation (Optional)

```bash
npm install -g @tech-leads-club/agent-skills
agent-skills  # Use 'agent-skills' instead of 'npx @tech-leads-club/agent-skills'
```

## ⚡ How It Works

The CLI fetches skills **on-demand** from our CDN:

1. **Browse** — The CLI fetches the skills catalog (~45KB)
2. **Select** — You choose the skills you need
3. **Download** — Selected skills are downloaded and cached locally
4. **Install** — Skills are installed to your agent's configuration

### Caching

Downloaded skills are cached in `~/.cache/agent-skills/` for offline use.

```bash
# Clear the cache
rm -rf ~/.cache/agent-skills
```

## 🔌 MCP Server

`@tech-leads-club/agent-skills-mcp` is an MCP server that exposes the skills catalog directly to AI agents via **progressive disclosure** — search first, then fetch only what's needed.

| Tool                | Purpose                              |
| :------------------ | :----------------------------------- |
| `list_skills`       | Browse all skills by category        |
| `search_skills`     | Find skills by intent (fuzzy search) |
| `read_skill`        | Load a skill's main instructions     |
| `fetch_skill_files` | Fetch specific reference files       |

`list_skills` should be called only when the user explicitly asks to browse/list the catalog.

**Quick install** (works with any MCP-compatible client):

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

→ Full setup for all clients (Cursor, Claude Code, VS Code, etc.), caching, and error reference: **[packages/mcp/README.md](packages/mcp/README.md)**

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for detailed guidelines on how to set up your local environment, create new skills, contribute to the marketplace, and follow our release processes.

## 🛡️ Content & Authorship

This repository is a collection of curated skills intended to benefit the community. We deeply respect the intellectual property and wishes of all creators.

If you are the author of any content included here and would like it **removed** or **updated**, please [open an issue](https://github.com/tech-leads-club/agent-skills/issues/new) or contact the maintainers.

## 📄 License and Attribution

- **Software Engine:** The application source code (CLI, scripts, tools) is licensed under the **[MIT License](LICENSE)**.
- **Tech Leads Club Skills:** Unless otherwise stated, all skill files (`SKILL.md`) authored by the repository maintainers are licensed under the **[Creative Commons Attribution 4.0 International License (CC-BY-4.0)](https://creativecommons.org/licenses/by/4.0/)**.
- **Third-Party Skills:** Some skills included in this catalog are created by the community or original authors. These skills retain their original licenses and copyrights. Please check the individual `SKILL.md` files for specific licensing and author attribution.

_If you use our skills catalog, you **must** provide attribution to Tech Leads Club, regardless of how it is used._

## ⭐ Star History

<p align="center">
  <a href="https://star-history.com/#tech-leads-club/agent-skills&Date">
    <img src="https://api.star-history.com/svg?repos=tech-leads-club/agent-skills&type=Date" alt="Star History Chart" />
  </a>
</p>

---

<p align="center">
  <sub>Built with ❤️ by the Tech Leads Club community</sub>
</p>
