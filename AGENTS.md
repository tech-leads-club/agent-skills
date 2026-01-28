# AGENTS.md

This file provides guidance to AI coding agents (Antigravity, Claude Code, Cursor, Copilot, etc.) when working with code in this repository.

## Repository Overview

A curated collection of skills for AI coding agents. Skills are packaged instructions, scripts, and resources that extend agent capabilities for specialized tasks. This monorepo includes:

- **CLI tool** (`@tech-leads-club/agent-skills`) for installing skills
- **NX plugin** for generating new skills
- **Pre-built skills** for common development workflows

## Project Structure

```
agent-skills/
├── packages/
│   └── cli/                    # @tech-leads-club/agent-skills CLI
│       └── src/
│           ├── index.ts        # Entry point
│           ├── agents.ts       # Agent detection and mapping
│           ├── installer.ts    # Symlink/copy logic
│           ├── prompts.ts      # Interactive menu (@clack/prompts)
│           ├── skills.ts       # Skill discovery
│           └── types.ts        # TypeScript types
├── tools/
│   └── skill-plugin/           # NX generator plugin
│       └── src/generators/skill/
├── skills/                     # Skill definitions
│   ├── skill-creator/          # Meta-skill for creating skills
│   ├── spec-driven-dev/        # Specification-driven development workflow
│   └── ...
├── .github/workflows/
│   ├── ci.yml                  # Lint, test, build
│   └── release.yml             # Version and publish
│└── nx.json                     # NX configuration
```

## Creating a New Skill

### Using the NX Generator

The preferred way to create skills:

```bash
nx g @tech-leads-club/skill-plugin:skill my-skill
```

This creates `skills/my-skill/SKILL.md` with the correct template.

### Skill Structure

```
skills/
  {skill-name}/             # kebab-case directory name
    SKILL.md                # Required: main instructions
    scripts/                # Optional: executable scripts
    references/             # Optional: docs loaded on-demand
    templates/              # Optional: file templates
    assets/                 # Optional: images, files
```

### Naming Conventions

- **Skill directory**: `kebab-case` (e.g., `api-designer`, `code-reviewer`)
- **SKILL.md**: Always uppercase, always this exact filename
- **Scripts**: `kebab-case.sh` or `kebab-case.ts`

### SKILL.md Format

```markdown
---
name: {skill-name}
description: {What it does} + {When to use it}. Include trigger phrases.
---

# {Skill Title}

{Brief description}

## Process

1. {Step 1}
2. {Step 2}
3. ...

## Examples (optional but recommended)

{Concrete input → output examples}
```

### Best Practices for Context Efficiency

Skills are loaded on-demand. The full `SKILL.md` loads into context only when the agent decides the skill is relevant.

- **Keep SKILL.md under 500 lines** — put detailed reference material in separate files
- **Write specific descriptions** — helps the agent know exactly when to activate the skill
- **Use progressive disclosure** — reference supporting files that get read only when needed
- **Prefer scripts over inline code** — script execution doesn't consume context
- **Assume the agent is smart** — challenge each piece: "Does this justify its token cost?"

### What NOT to Include in Skills

- README.md, CHANGELOG.md, INSTALLATION_GUIDE.md
- User-facing documentation
- Testing/setup procedures

Skills are for agents, not humans.

## Development Commands

```bash
# Install dependencies
npm ci

# Build all packages
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format

# Generate a new skill
nx g @tech-leads-club/skill-plugin:skill {skill-name}

# Test the CLI locally
npm run dev --workspace=@tech-leads-club/agent-skills

# Dry-run release
npm run release:dry

# Release (CI only)
npm run release
```

## Agent-Specific Paths

The CLI installs skills to these locations:

| Agent          | Local Path          | Global Path                            |
| -------------- | ------------------- | -------------------------------------- |
| Antigravity    | `.agent/skills/`    | `~/.gemini/antigravity/global_skills/` |
| Claude Code    | `.claude/skills/`   | `~/.claude/skills/`                    |
| Cursor         | `.cursor/skills/`   | `~/.cursor/skills/`                    |
| GitHub Copilot | `.github/skills/`   | `~/.copilot/skills/`                   |
| OpenCode       | `.opencode/skills/` | `~/.opencode/skills/`                  |

## Testing Skills

After creating or modifying a skill:

1. Install it locally: `npx @tech-leads-club/agent-skills --skill {skill-name}`
2. Start a new agent session
3. Test with prompts that should trigger the skill
4. Iterate based on real usage

## Commit Convention

This repository uses [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature (minor version bump)
- `fix:` — bug fix (patch version bump)
- `docs:` — documentation only
- `chore:` — maintenance
- `feat!:` or `BREAKING CHANGE:` — breaking change (major version bump)

## Recommended Tools (MCP)

This repository is an **Nx Workspace**. To significantly improve AI agent performance, understanding of the project structure, and task execution, it is highly recommended to use the **Nx MCP Server**.

### Capabilities

- **Workspace Structure Understanding**: Deep architectural awareness of the monorepo.
- **Improved Task Execution**: Ability to list and run Nx targets (lint, test, build) with context.
- **Enhanced Code Generation**: AI-powered generator suggestions.

### Setup Instructions

**Automatic Setup (Recommended):**
Run this command to automatically configure your Nx workspace for AI agents (creates/updates `AGENTS.md`, `CLAUDE.md`, etc):

```bash
npx nx configure-ai-agents
```

**Manual Configuration:**
If you need to manually configure your MCP client (e.g., Claude Desktop, Cursor), use the following settings:

```json
{
  "mcpServers": {
    "nx-mcp": {
      "command": "npx",
      "args": ["-y", "nx-mcp@latest"]
    }
  }
}
```

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.

<!-- nx configuration end-->
