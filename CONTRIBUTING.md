# 🤝 Contributing to Agent Skills

First of all, thank you for taking the time to contribute! 🎉

> **Note**: This document provides all the necessary information to get your local environment set up, understand the architecture, create new skills, and safely submit your contributions.

## 🛠 Prerequisites

- **Node.js** ≥ 22
- **npm** (comes with Node.js)

## 🚀 Setup

```bash
git clone https://github.com/tech-leads-club/agent-skills.git
cd agent-skills
npm ci
npm run build
```

## 💻 Development Commands

| Command                            | Description                        |
| ---------------------------------- | ---------------------------------- |
| `npm run start:dev:cli`            | Run CLI locally (interactive mode) |
| `npm run start:dev:mcp`            | Build MCP and open Inspector       |
| `npm run generate:skill <name>`    | Generate a new skill               |
| `npm run validate`                 | Validate all skills                |
| `npm run build`                    | Build all packages                 |
| `npm run test`                     | Run all tests                      |
| `npm run lint`                     | Lint codebase                      |
| `npm run format`                   | Format code with Prettier          |
| `npm run scan`                     | Run incremental security scan      |
| `nx run marketplace:dev`           | Run marketplace locally            |
| `nx run marketplace:generate-data` | Update marketplace skills data     |

## ⭐ Creating a New Skill

> **Important**: When creating a new skill or adding an external skill to the catalog, you **must** use the **`skill-architect`** skill to guide the process and ensure the skill follows our quality standards. If you're an AI agent, load the `skill-architect` skill before proceeding. If contributing manually, review the [Description Quality Standards](#description-quality-standards) below.

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

After generating the scaffold, refine the `SKILL.md` content (especially the `description` field) following the quality standards below.

## 📁 Project Structure

```
agent-skills/
├── packages/
│   ├── cli/                      # @tech-leads-club/agent-skills CLI
│   ├── marketplace/              # Next.js static site for the skill registry
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
description: What this skill does in one sentence. Use when user says "trigger phrase", "another trigger", or "third trigger". Do NOT use for things handled by other-skill.
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
- **Use the `skill-architect` skill** — for creating new skills or validating existing ones

### Description Quality Standards

Every skill description **must** follow this structure:

```
[What it does] + [Use when ...] + [Do NOT use for ...]
```

**Mandatory rules:**

| Rule                                                | Example                                                   |
| --------------------------------------------------- | --------------------------------------------------------- |
| Include `Use when` with user-facing trigger phrases | `Use when user says "deploy my app", "push this live"`    |
| Include `Do NOT use for` with negative triggers     | `Do NOT use for Netlify deployments (use netlify-deploy)` |
| Under 1024 characters                               | Keep it concise but complete                              |
| No XML angle brackets (`< >`) in YAML               | Use standard quotes instead                               |
| User perspective, not internal jargon               | "fix my build" not "remediate CI pipeline failures"       |

**Good example:**

```yaml
description: Deploy applications to Vercel. Use when the user requests "deploy my app",
  "push this live", or "create a preview deployment". Do NOT use for deploying to
  Netlify, Cloudflare, or Render (use their respective skills).
```

**Bad example:**

```yaml
# ❌ Missing triggers and negative scope
description: Helps with deployments.
```

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
version: '1.0.0'

entries:
  - skill: my-skill
    code: W011
    reason: >
      Fetches from trusted first-party API — expected behavior.
    allowedBy: github.com/username
    allowedAt: '2026-01-01'
    expiresAt: '2027-01-01' # Optional but recommended
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

## 🛍️ Contributing to the Marketplace

The Agent Skills Marketplace is a Next.js static site located in `packages/marketplace`. It serves as the frontend for browsing and discovering agent skills.

To work on the marketplace locally:

```bash
# Parse SKILL.md files and generate the JSON data used by the UI
nx run marketplace:generate-data

# Start the development server (runs with production config matching static export)
nx run marketplace:dev
```

Open `http://localhost:3000` in your browser. For more details on the marketplace architecture, SEO optimization, and Next.js setup, see the [Marketplace README](packages/marketplace/README.md).

## 🤝 Submitting Contributions

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feat/amazing-skill`)
3. **Commit** with conventional commits (`git commit -m "feat: add amazing skill"`)
4. **Push** to your fork (`git push origin feat/amazing-skill`)
5. **Open** a Pull Request