# 🤝 Contributing to Agent Skills

First of all, thank you for taking the time to contribute! 🎉

> **Note**: This document covers how contributions are accepted, how to set up your environment, how the project is laid out, and how to create a skill.

Start with the section below — it takes a minute and tells you whether to open an issue or a pull request. Everything after it is setup and reference.

## 🤝 How contributions work

We use an **issue-first** flow. Anyone can open an issue. Pull requests come from Tech Leads Club members.

### Why

This repository was receiving a steady stream of automated pull requests. At volume, a machine-generated PR is not reliably distinguishable from a large human one, and reviewing them was consuming the time that should go into reviewing real contributions. Rather than judge submissions case by case — which is where good contributors get caught in the crossfire — we moved the entry point to issues, where a short exchange settles intent before anyone writes code.

This is not a closed project, and it is not about the quality of your work. Every issue gets read and answered. What changed is the order: talk first, code second.

### If you are not a member

1. **Open an issue** describing what you want to add or change. For a new skill, say what it does, when an agent should reach for it, and which existing skill it might overlap with.
2. **A maintainer replies.** If the idea fits, we say so explicitly, and then either:
   - **you implement it** — we grant you the access needed to open the PR, or
   - **a maintainer implements it** — and you are credited (see below).
3. **Trivial fixes still start with an issue** — a typo, a broken link, a wrong command. Those get resolved quickly; we are not going to make you negotiate over a missing letter.

### If you are a member

Open the pull request directly. Branch, conventional commits, PR — the steps at the end of this section.

### Credit

An issue-first policy is only fair if the person who had the idea is named. When your issue leads to a change:

- your GitHub handle goes in the skill's `metadata.author` field when the contribution is a skill,
- the issue is linked from the commit that implements it, and
- you are credited in the release notes for that version.

If a maintainer implements your proposal and the credit is missing, say so on the issue. That is a mistake on our side, not a favour to ask for.

### AI-assisted contributions

Using an agent to help is fine and expected — this repository is built for agents. Two conditions: you understand and can defend every line you submit, and you say in the issue or PR that an agent was involved. An unreviewed agent output submitted as your own work is the thing this policy exists to filter.

### Steps, once you have the go-ahead

1. **Fork** the repository (or branch directly, if you have write access)
2. **Create** a branch (`git checkout -b feat/amazing-skill`)
3. **Commit** with conventional commits (`git commit -m "feat: add amazing skill"`)
4. **Push** and **open a Pull Request**, linking the issue it implements
5. **Check CI** — `lint`, `test`, `build`, skill validation and the security scan all run on the PR

Pull requests that arrive without a linked issue may be closed with a pointer back to this section. That is a redirect, not a rejection.

## 🛠 Prerequisites

- **Node.js** ≥ 24 — the repo pins `24.18.1` in [`.nvmrc`](.nvmrc), so `nvm use` picks the right one
- **npm** (comes with Node.js)

> **Do not set `NODE_ENV` in your shell.** Each tool sets it for you (`test` for Jest, `production` for a Next build). A `NODE_ENV=development` exported in your profile makes `nx build marketplace` fail with confusing React errors such as `Cannot read properties of null (reading 'useContext')` during prerender. If a build fails only on your machine, check `echo $NODE_ENV` first.

## 🚀 Setup

```bash
git clone https://github.com/tech-leads-club/agent-skills.git
cd agent-skills
npm ci
npm run build
```

## 💻 Development Commands

| Command                            | Description                                  |
| ---------------------------------- | -------------------------------------------- |
| `npm run start:dev:cli`            | Run CLI locally (interactive mode)           |
| `npm run start:dev:mcp`            | Build MCP and open Inspector                 |
| `npm run generate:skill <name>`    | Generate a new skill                         |
| `npm run generate:data`            | Regenerate the registry and marketplace data |
| `npm run validate`                 | Validate all skills                          |
| `npm run build`                    | Build all packages                           |
| `npm run test`                     | Run all tests                                |
| `npm run lint`                     | Lint codebase                                |
| `npm run format`                   | Format code with Prettier                    |
| `npm run format:check`             | Check formatting without writing             |
| `npm run scan`                     | Run incremental security scan                |
| `nx run marketplace:dev`           | Run marketplace locally                      |
| `nx run marketplace:generate-data` | Update marketplace skills data               |

To reproduce what CI runs before opening anything:

```bash
npx nx affected -t lint test build --base=origin/main
npx tsx tools/validate-skills.ts --batch packages/skills-catalog/skills
```

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
│   ├── cli/                          # @tech-leads-club/agent-skills — installs skills into agents
│   ├── mcp/                          # @tech-leads-club/agent-skills-mcp — serves skills over MCP
│   ├── marketplace/                  # Next.js static site for the skill registry
│   └── skills-catalog/               # Skills collection
│       ├── skills/                   # All skill definitions
│       │   ├── (category-name)/      # Categorized skills
│       │   └── _category.json        # Category metadata
│       └── skills-registry.json      # Auto-generated catalog (committed)
├── libs/
│   └── core/                         # @tech-leads-club/core — shared types and services
├── tools/
│   └── skill-plugin/                 # Nx skill generator
├── .github/
│   └── workflows/                    # CI/CD pipelines
└── nx.json                           # Nx configuration
```

There are **two** ways a skill reaches an agent, and both read the same catalog:

- **CLI** — installs skill files into the agent's directory (`.agents/`, `~/.cursor/skills/`, …) and records them in a lockfile.
- **MCP** — serves skills on demand over the Model Context Protocol, with no installation.

A change to a skill's files affects both. See [Contributing to the MCP server](#-contributing-to-the-mcp-server) if you are touching `packages/mcp`.

## 📝 Skill Structure

```
packages/skills-catalog/skills/
├── (category-name)/              # Category folder
│   └── my-skill/                 # Skill folder
│       ├── SKILL.md              # Required: main instructions
│       ├── references/           # Optional: docs the agent reads on demand
│       ├── scripts/              # Optional: executable scripts
│       └── assets/               # Optional: templates and files used in output
└── _category.json                # Category metadata
```

> **Use only these three names for bundled files.** `references/`, `scripts/` and `assets/` are the directories the MCP server exposes — a file under any other folder (`templates/`, `rules/`, `lib/`, or `reference/` in the singular) still ships with the skill and still works through the CLI, but `read_skill` will not list it and `fetch_skill_files` will refuse to serve it. Put templates and static files in `assets/`.

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

Every skill is scanned with [Snyk Agent Scan](https://github.com/snyk/agent-scan) before publishing. The scan is **incremental** — only skills whose content changed since the last run are re-scanned.

```bash
npm run scan              # Incremental (default); requires SNYK_TOKEN
npm run scan -- --force   # Force full re-scan
```

### How it works

Each skill has a SHA-256 content hash (computed from all its files). Results are cached in `.security-scan-cache.json` (gitignored). On the next run, skills whose hash hasn't changed skip re-scanning and load results from cache.

```
Content hash unchanged → load from cache (fast)
Content hash changed   → re-scan with snyk-agent-scan
```

### When CI fails on Security Scan

1. **Open the run** → In the "CI Checks" job you’ll see a step **"Print scan failure summary"** (and/or **"Security Scan"**) with Critical/High counts and affected skills + codes (e.g. `frontend-design: W011`).
2. **Same-repo PRs** → A bot comment on the PR lists the same findings and links to the run.
3. **Fix it:**
   - **Real issue** → Adjust the skill (remove or restrict the flagged behavior).
   - **False positive** → Add an entry to `packages/skills-catalog/security-scan-allowlist.yaml` (see below). Match by `skill` + `code`; add a short `reason` and `allowedBy`/`allowedAt`.
4. **Run locally** (optional): `SNYK_TOKEN=<your-token> npm run scan` to confirm before pushing. PRs from forks don’t run the scan in CI (no secrets); use Merge Queue or run the scan locally.

### Handling false positives

If the scanner flags a finding that is intentional (e.g. a first-party MCP server integration), add it to the allowlist:

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

## 🔌 Contributing to the MCP Server

`packages/mcp` serves the catalog over the Model Context Protocol. It exposes five tools, arranged so each step of the agent's workflow only pays for what it needs:

| Tool                  | Step                       | Returns                                              |
| --------------------- | -------------------------- | ---------------------------------------------------- |
| `search_skills`       | 1 — find a skill by intent | ranked matches with a short `usage_hint`             |
| `list_skills`         | browse (explicit ask only) | the whole catalog, grouped by category               |
| `read_skill`          | 2 — load instructions      | the `SKILL.md` body plus the list of bundled files   |
| `fetch_skill_files`   | 3 — files meant to be read | the text of `references/` files                      |
| `prepare_skill_files` | 3 — files meant to be run  | `file://` links to files written to the user's cache |

Two conventions hold when changing this package:

- **Keep tool modules thin; put logic in `src/tools/core/`.** Core functions are pure and directly unit-tested. Test files must not import a tool module, because tool modules import `fastmcp` at runtime and its ESM-only dependency breaks under Jest. This is why the tools are so small.
- **Anything that costs the agent tokens or touches the filesystem needs a reason in the code.** The response budget, the frontmatter strip and the revision-keyed staging directory all exist for a measured reason recorded next to them; keep that up to date if you change the behaviour.

`npm run start:dev:mcp` builds the server and opens the MCP Inspector against it.
