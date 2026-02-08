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

## 📖 Table of Contents

- [✨ What are Skills?](#-what-are-skills)
- [🤖 Supported Agents](#-supported-agents)
- [🌟 Featured Skills](#-featured-skills)
- [🚀 Quick Start](#-quick-start)
- [⚡ How It Works](#-how-it-works)
- [🛠 For Contributors](#-for-contributors)
- [📁 Project Structure](#-project-structure)
- [📝 Skill Structure](#-skill-structure)
- [🔄 Release Process](#-release-process)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## ✨ What are Skills?

Skills are packaged instructions and resources that extend AI agent capabilities. Think of them as **plugins for your AI assistant** — they teach your agent new workflows, patterns, and specialized knowledge.

```
packages/skills-catalog/skills/
  (category-name)/
    spec-driven-dev/
      SKILL.md          ← Main instructions
      templates/        ← File templates
      references/       ← On-demand documentation
```

## 🤖 Supported Agents

Install skills to any of these AI coding agents:

**Tier 1 — Most Popular**

<p align="center">
  <a href="https://cursor.com"><img src="https://img.shields.io/badge/Cursor-000000?style=for-the-badge&logo=cursor&logoColor=white" alt="Cursor" /></a>
  <a href="https://claude.ai/code"><img src="https://img.shields.io/badge/Claude_Code-191919?style=for-the-badge&logo=anthropic&logoColor=white" alt="Claude Code" /></a>
  <a href="https://github.com/features/copilot"><img src="https://img.shields.io/badge/GitHub_Copilot-000000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Copilot" /></a>
  <a href="https://codeium.com/windsurf"><img src="https://img.shields.io/badge/Windsurf-0066FF?style=for-the-badge&logo=codeium&logoColor=white" alt="Windsurf" /></a>
  <a href="https://github.com/cline/cline"><img src="https://img.shields.io/badge/Cline-4A154B?style=for-the-badge&logo=visual-studio-code&logoColor=white" alt="Cline" /></a>
</p>

**Tier 2 — Rising Stars**

<p align="center">
  <a href="https://aider.chat"><img src="https://img.shields.io/badge/Aider-FF6B6B?style=for-the-badge&logo=terminal&logoColor=white" alt="Aider" /></a>
  <a href="https://openai.com/index/introducing-codex/"><img src="https://img.shields.io/badge/OpenAI_Codex-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI Codex" /></a>
  <a href="https://ai.google.dev/gemini-api/docs/code-execution"><img src="https://img.shields.io/badge/Gemini_CLI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini CLI" /></a>
  <a href="https://idx.google.com"><img src="https://img.shields.io/badge/Antigravity-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Antigravity" /></a>
  <a href="https://roo.dev"><img src="https://img.shields.io/badge/Roo_Code-FF4081?style=for-the-badge&logo=visual-studio-code&logoColor=white" alt="Roo Code" /></a>
  <a href="https://kilocode.ai"><img src="https://img.shields.io/badge/Kilo_Code-00D4AA?style=for-the-badge&logo=visual-studio-code&logoColor=white" alt="Kilo Code" /></a>
  <a href="https://docs.trae.ai"><img src="https://img.shields.io/badge/TRAE-8B5CF6?style=for-the-badge&logo=visual-studio-code&logoColor=white" alt="TRAE" /></a>
</p>

**Tier 3 — Enterprise & Specialized**

<p align="center">
  <a href="https://aws.amazon.com/q/developer/"><img src="https://img.shields.io/badge/Amazon_Q-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white" alt="Amazon Q" /></a>
  <a href="https://www.augmentcode.com"><img src="https://img.shields.io/badge/Augment-6366F1?style=for-the-badge&logo=visual-studio-code&logoColor=white" alt="Augment" /></a>
  <a href="https://www.tabnine.com"><img src="https://img.shields.io/badge/Tabnine-5B5BD6?style=for-the-badge&logo=tabnine&logoColor=white" alt="Tabnine" /></a>
  <a href="https://github.com/opencode-ai/opencode"><img src="https://img.shields.io/badge/OpenCode-1A1A1A?style=for-the-badge&logo=terminal&logoColor=white" alt="OpenCode" /></a>
  <a href="https://sourcegraph.com/cody"><img src="https://img.shields.io/badge/Sourcegraph_Cody-FF5733?style=for-the-badge&logo=sourcegraph&logoColor=white" alt="Sourcegraph Cody" /></a>
</p>

<p align="center">
  <sub>Missing your favorite agent? <a href="https://github.com/tech-leads-club/agent-skills/issues/new"><strong>Open an issue</strong></a> and we'll add support!</sub>
</p>

## 🌟 Featured Skills

A glimpse of what's available in our growing catalog:

| Skill | Category | Description |
|-------|----------|-------------|
| **[tlc-spec-driven](packages/skills-catalog/skills/(development)/tlc-spec-driven)** | Development | Project and feature planning with 4 phases: Specify → Design → Tasks → Implement. Creates atomic tasks with verification criteria and maintains persistent memory across sessions. |
| **[aws-advisor](packages/skills-catalog/skills/(cloud)/aws-advisor)** | Cloud | Expert AWS Cloud Advisor for architecture design, security review, and implementation guidance. Leverages AWS MCP tools for documentation-backed answers. |
| **[playwright-skill](packages/skills-catalog/skills/(web-automation)/playwright-skill)** | Automation | Complete browser automation with Playwright. Test pages, fill forms, take screenshots, validate UX, and automate any browser task. |
| **[figma](packages/skills-catalog/skills/(design)/figma)** | Design | Fetch design context from Figma and translate nodes into production code. Design-to-code implementation with MCP integration. |
| **[security-best-practices](packages/skills-catalog/skills/(security)/security-best-practices)** | Security | Language and framework-specific security reviews. Detect vulnerabilities, generate reports, and suggest secure-by-default fixes. |

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

1. **Browse categories** — Filter skills by category or select "All"
2. **Select skills** — Choose which skills to install
3. **Choose agents** — Pick target agents (Cursor, Claude Code, etc.)
4. **Installation method** — Symlink (recommended) or Copy
5. **Scope** — Global (user home) or Local (project only)

Each step shows a **← Back** option to return and revise your choices.

### CLI Options

```bash
# Interactive mode (default)
npx @tech-leads-club/agent-skills

# List available skills
npx @tech-leads-club/agent-skills list

# Install a specific skill
npx @tech-leads-club/agent-skills install -s spec-driven-dev

# Install to specific agents
npx @tech-leads-club/agent-skills install -a cursor claude-code

# Install globally (to ~/.gemini, ~/.claude, etc.)
npx @tech-leads-club/agent-skills install -g

# Force re-download (bypass cache)
npx @tech-leads-club/agent-skills install -s my-skill --force

# Update a specific skill
npx @tech-leads-club/agent-skills update -s my-skill

# Remove skills
npx @tech-leads-club/agent-skills remove

# Manage cache
npx @tech-leads-club/agent-skills cache --clear   # Clear all cache
npx @tech-leads-club/agent-skills cache --path    # Show cache location

# Show help
npx @tech-leads-club/agent-skills --help
```

### Global Installation (Optional)

```bash
npm install -g @tech-leads-club/agent-skills
tlc-skills  # Use 'tlc-skills' instead of 'npx @tech-leads-club/agent-skills'
```

## ⚡ How It Works

The CLI fetches skills **on-demand** from our CDN:

1. **Browse** — The CLI fetches the skills catalog (~45KB)
2. **Select** — You choose the skills you need
3. **Download** — Selected skills are downloaded and cached locally
4. **Install** — Skills are installed to your agent's configuration

### Caching

Downloaded skills are cached in `~/.cache/tlc-skills/` for offline use.

```bash
# Clear the cache
rm -rf ~/.cache/tlc-skills
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

| Command               | Description                        |
| --------------------- | ---------------------------------- |
| `npm run start:dev`   | Run CLI locally (interactive mode) |
| `npm run g <name>`    | Generate a new skill               |
| `npm run build`       | Build all packages                 |
| `npm run test`        | Run all tests                      |
| `npm run lint`        | Lint codebase                      |
| `npm run format`      | Format code with Prettier          |

### Creating a New Skill

```bash
# With category (recommended)
nx g @tech-leads-club/skill-plugin:skill my-skill --category=development

# Full options
nx g @tech-leads-club/skill-plugin:skill my-skill \
  --description="What my skill does" \
  --category=development
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
