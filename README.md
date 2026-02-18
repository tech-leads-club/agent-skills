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
  <strong>A curated collection of skills for AI coding agents</strong>
</p>

<p align="center">
  Extend the capabilities of <b>Antigravity</b>, <b>Claude Code</b>, <b>Cursor</b>, <b>GitHub Copilot</b>, and more with reusable, packaged instructions.
</p>

<p align="center">
  <a href="https://tech-leads-club.github.io/agent-skills/" target="_blank">https://tech-leads-club.github.io/agent-skills/</a>
</p>

## 📖 Table of Contents

- [✨ What are Skills?](#-what-are-skills)
- [🤖 Supported Agents](#-supported-agents)
- [🌟 Featured Skills](#-featured-skills)
- [🚀 Quick Start](#-quick-start)
- [⚡ How It Works](#-how-it-works)
- [🛠 For Contributors](#-for-contributors)
- [📁 Project Structure](#-project-structure)
- [📝 Skill Structure](#-skill-structure)
- [🔒 Security Scan](#-security-scan)
- [🔄 Release Process](#-release-process)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

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

---

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

## 🛠 For Contributors

### Prerequisites

- **Node.js** ≥ 22
- **npm** (comes with Node.js)

### Setup

```bash
git clone https://github.com/tech-leads-club/agent-skills.git
cd agent-skills
npm ci
npm run build
```

### Development Commands

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `npm run start:dev` | Run CLI locally (interactive mode) |
| `npm run g <name>`  | Generate a new skill               |
| `npm run build`     | Build all packages                 |
| `npm run test`      | Run all tests                      |
| `npm run lint`      | Lint codebase                      |
| `npm run format`    | Format code with Prettier          |
| `npm run scan`      | Run incremental security scan      |

### Creating a New Skill

```bash
# With category (recommended)
nx g @tech-leads-club/skill-plugin:skill my-skill --category=development

# Full options
nx g @tech-leads-club/skill-plugin:skill my-skill \
  --description="What my skill does" \
  --category=development \
  --author="github.com/username" \
  --skillVersion="1.0.0"
```

The generator creates:

- `packages/skills-catalog/skills/(development)/my-skill/SKILL.md`

## 📁 Project Structure

```
agent-skills/
├── packages/
│   ├── cli/                      # @tech-leads-club/agent-skills CLI
│   └── skills-catalog/           # Skills collection
│       └── skills/               # All skill definitions
│           ├── (category-name)/  # Categorized skills
│           └── _category.json    # Category metadata
├── tools/
│   └── skill-plugin/             # Nx skill generator
├── skills-registry.json          # Auto-generated catalog
├── .github/
│   └── workflows/                # CI/CD pipelines
└── nx.json                       # Nx configuration
```

## 📝 Skill Structure

```
packages/skills-catalog/skills/
├── (category-name)/              # Category folder
│   └── my-skill/                 # Skill folder
│       ├── SKILL.md              # Required: main instructions
│       ├── scripts/              # Optional: executable scripts
│       ├── templates/            # Optional: file templates
│       └── references/           # Optional: on-demand docs
└── _category.json                # Category metadata
```

### SKILL.md Format

```markdown
---
name: my-skill
description: What this skill does. Use when user says "trigger phrase".
metadata:
  version: 1.0.0
  author: github.com/username
---

# My Skill

Brief description.

## Process

1. Step one
2. Step two
```

### Category Metadata

`_category.json`:

```json
{
  "(development)": {
    "name": "Development",
    "description": "Skills for software development",
    "priority": 1
  }
}
```

### Best Practices

- **Keep SKILL.md under 500 lines** — use `references/` for detailed docs
- **Write specific descriptions** — include trigger phrases
- **Assume the agent is smart** — only add what it doesn't already know
- **Prefer scripts over inline code** — reduces context window usage

## 🔒 Security Scan

Every skill is scanned with [`mcp-scan`](https://github.com/invariantlabs-ai/mcp-scan) before publishing. The scan is **incremental** — only skills whose content changed since the last run are re-scanned.

```bash
npm run scan              # Incremental (default)
npm run scan -- --force   # Force full re-scan
```

### How it works

Each skill has a SHA-256 content hash (computed from all its files). Results are cached in `.security-scan-cache.json` (gitignored). On the next run, skills whose hash hasn't changed skip re-scanning and load results from cache.

```
Content hash unchanged → load from cache (fast)
Content hash changed   → re-scan with mcp-scan
```

### Handling false positives

If `mcp-scan` flags a finding that is intentional (e.g. a first-party MCP server integration), add it to the allowlist:

**`packages/skills-catalog/security-scan-allowlist.yaml`**

```yaml
version: "1.0.0"

entries:
  - skill: my-skill
    code: W011
    reason: >
      Fetches from trusted first-party API — expected behavior.
    allowedBy: github.com/username
    allowedAt: "2026-01-01"
    expiresAt: "2027-01-01"  # Optional but recommended
```

- Match is by `skill + code` — no re-scan needed after adding an entry
- `expiresAt` is optional but recommended — forces periodic review
- Expired entries re-activate the finding automatically
- Use YAML for better readability, comments, and cleaner diffs

The allowlist is committed to the repo and reviewable in PRs.

## 🔄 Release Process

This project uses **Conventional Commits** for automated versioning:

| Commit Prefix | Version Bump  | Example                      |
| ------------- | ------------- | ---------------------------- |
| `feat:`       | Minor (0.X.0) | `feat: add new skill`        |
| `fix:`        | Patch (0.0.X) | `fix: correct symlink path`  |
| `feat!:`      | Major (X.0.0) | `feat!: breaking API change` |
| `docs:`       | No bump       | `docs: update README`        |
| `chore:`      | No bump       | `chore: update deps`         |

Releases are automated via GitHub Actions when merging to `main`.

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feat/amazing-skill`)
3. **Commit** with conventional commits (`git commit -m "feat: add amazing skill"`)
4. **Push** to your fork (`git push origin feat/amazing-skill`)
5. **Open** a Pull Request

## 🛡️ Content & Authorship

This repository is a collection of curated skills intended to benefit the community. We deeply respect the intellectual property and wishes of all creators.

If you are the author of any content included here and would like it **removed** or **updated**, please [open an issue](https://github.com/tech-leads-club/agent-skills/issues/new) or contact the maintainers.

## 📄 License

MIT © [Tech Leads Club](https://github.com/tech-leads-club)

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
