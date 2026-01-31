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

---

## ✨ What are Skills?

Skills are packaged instructions and resources that extend AI agent capabilities. Think of them as **plugins for your AI assistant** — they teach your agent new workflows, patterns, and specialized knowledge.

```
skills/
  (category-name)/
    spec-driven-dev/
      SKILL.md          ← Main instructions
      templates/        ← File templates
      references/       ← On-demand documentation
```

## 🚀 Quick Start

### Install Skills in Your Project

```bash
npx @tech-leads-club/agent-skills
```

This launches an interactive wizard with 5 steps:

1. **Browse categories** — Filter skills by category or select "All"
2. **Select skills** — Choose which skills to install
3. **Choose agents** — Pick target agents (Cursor, Claude Code, etc.)
4. **Installation method** — Symlink (recommended) or Copy
5. **Scope** — Global (user home) or Local (project only)

Each step shows a **← Back** option to return to the previous step and revise your choices. A confirmation summary is shown before installation.

### CLI Options

```bash
# Interactive mode (default)
npx @tech-leads-club/agent-skills

# Install globally (to ~/.gemini/antigravity/global_skills, ~/.claude/skills, etc.)
npx @tech-leads-club/agent-skills install -g

# List available skills
npx @tech-leads-club/agent-skills list

# Install a specific skill
npx @tech-leads-club/agent-skills install -s spec-driven-dev

# Install to specific agents
npx @tech-leads-club/agent-skills install -a antigravity cursor

# Use copy instead of symlink
npx @tech-leads-club/agent-skills install --copy

# Remove skills (interactive)
npx @tech-leads-club/agent-skills remove

# Remove a specific skill
npx @tech-leads-club/agent-skills remove -s spec-driven-dev

# Remove from global installation
npx @tech-leads-club/agent-skills remove -g -s spec-driven-dev

# Show help
npx @tech-leads-club/agent-skills --help
npx @tech-leads-club/agent-skills install --help
npx @tech-leads-club/agent-skills remove --help
```

---

## 📦 Discovering Skills

Use the CLI to browse and install available skills:

```bash
# Interactive mode — browse categories and select skills
npx @tech-leads-club/agent-skills

# List all available skills
npx @tech-leads-club/agent-skills list
```

Skills are organized by category (development, creation, automation, etc.) and the collection is constantly growing.

---

## 🛠 For Contributors

### Prerequisites

- **Node.js** ≥ 22
- **npm** (comes with Node.js)

### Setup

```bash
# Clone the repository
git clone https://github.com/tech-leads-club/agent-skills.git
cd agent-skills

# Install dependencies
npm ci

# Build all packages
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
| `npm run lint:fix`    | Fix lint issues                    |
| `npm run format`      | Format code with Prettier          |
| `npm run release:dry` | Preview release (dry-run)          |

### Creating a New Skill

Use the NX generator:

```bash
# Basic usage (will prompt for category)
nx g @tech-leads-club/skill-plugin:skill my-awesome-skill

# With category specified
nx g @tech-leads-club/skill-plugin:skill my-awesome-skill --category=development

# With all options
nx g @tech-leads-club/skill-plugin:skill my-skill \
  --description="What my skill does" \
  --category=development
```

The generator will:

- Create the skill folder inside the specified category (e.g., `skills/(development)/my-skill/`)
- Create `SKILL.md` with the correct template structure
- If no category is specified, the skill will be created at the root of the `skills/` directory and appear as "Uncategorized" in the CLI.

### Skill Structure

```
skills/
├── (category-name)/      # Category folder (starts and ends with parenthesis)
│   └── my-skill/         # Individual skill folder
│       ├── SKILL.md      # Required: main instructions
│       ├── scripts/      # Optional: executable scripts
│       ├── references/   # Optional: on-demand documentation
│       └── ...
└── uncategorized-skill/  # Uncategorized skills stay at the root
```

Skills are organized into categories using the file-system structure, inspired by the Next.js App Router conventions.

#### Folder Convention

To put a skill in a category, place its folder inside a directory named with parentheses:

- ✅ `skills/(development)/spec-driven-dev/` -> Category: **development**
- ✅ `skills/(creation)/skill-creator/` -> Category: **creation**
- ❌ `skills/my-skill/` -> **Uncategorized**

#### Category Metadata

Optional metadata (display name, description, priority) for categories can be defined in `skills/_category.json`:

```json
{
  "(development)": {
    "name": "Development",
    "description": "Skills for software development workflows",
    "priority": 1
  }
}
```

- `name`: Display name in the CLI (defaults to the folder name without parentheses)
- `description`: Optional description shown in the CLI
- `priority`: Display order (lower = first)

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
3. ...
```

### Best Practices

- **Keep SKILL.md under 500 lines** — use `references/` for detailed docs
- **Write specific descriptions** — include trigger phrases
- **Assume the agent is smart** — only add what it doesn't already know
- **Prefer scripts over inline code** — reduces context window usage

---

## 📁 Project Structure

```
agent-skills/
├── packages/
│   └── cli/                    # @tech-leads-club/agent-skills CLI package
├── tools/
│   └── skill-plugin/           # NX generator plugin
├── skills/                     # Skill definitions
│   ├── (category-name)/        # Categorized skills
│   ├── _category.json          # Category metadata (optional)
│   └── [skill-name]/           # Uncategorized skill folders
├── .github/
│   └── workflows/
│       ├── ci.yml              # CI: lint, test, build
│       └── release.yml         # Release: version, publish
├── nx.json                     # NX configuration
└── package.json                # Root package.json
```

---

## 🔄 Release Process

This project uses **NX Release** with **Conventional Commits** for automated versioning:

| Commit Prefix | Version Bump  | Example                      |
| ------------- | ------------- | ---------------------------- |
| `feat:`       | Minor (0.X.0) | `feat: add new skill`        |
| `fix:`        | Patch (0.0.X) | `fix: correct symlink path`  |
| `feat!:`      | Major (X.0.0) | `feat!: breaking API change` |
| `docs:`       | No bump       | `docs: update README`        |
| `chore:`      | No bump       | `chore: update deps`         |

Releases are automated via GitHub Actions when merging to `main`.

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feat/amazing-skill`)
3. **Commit** with conventional commits (`git commit -m "feat: add amazing skill"`)
4. **Push** to your fork (`git push origin feat/amazing-skill`)
5. **Open** a Pull Request

---

## 🛡️ Content & Authorship

This repository is a collection of curated skills intended to benefit the community. We deeply respect the intellectual property and wishes of all creators.

If you are the author of any content included here and would like it **removed** or **updated**, please [open an issue](https://github.com/tech-leads-club/agent-skills/issues/new) or contact the maintainers. We will address your request immediately.

---

## 📄 License

MIT © [Tech Leads Club](https://github.com/tech-leads-club)

---

<p align="center">
  <sub>Built with ❤️ by the Tech Leads Club community</sub>
</p>
