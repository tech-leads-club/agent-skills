# AGENTS.md

This file provides guidance to AI Coding Agents when working with code in this repository.

## Repository

**Agent Skills Monorepo** — a registry and CLI for distributing "skills" (packaged instructions) to AI coding agents (Claude Code, Cursor, Copilot, Windsurf, Cline, and 14 others).

## Commands

```bash
# Setup
npm ci && npm run build

# Development
npm run start:dev              # Run CLI interactively (tsx, no build needed)
SKILLS_CDN_REF=main npm run dev -- install  # Test CLI against local registry

# Build & Test
npm run build                  # Build all packages (Nx)
npm run test                   # Run all tests (requires Node --experimental-vm-modules)
npm run test --workspace=@tech-leads-club/agent-skills  # CLI tests only

# Quality
npm run lint                   # ESLint
npm run lint:fix
npm run format:check           # Prettier
npm run format

# Skills
npm run generate:data          # Regenerate skills-registry.json + marketplace data
npm run scan                   # Security scan (mcp-scan, incremental)
nx g @tech-leads-club/skill-plugin:skill {name} --category={cat}  # Create new skill
```

## Architecture

**Nx monorepo** with independent versioning and conventional commits.

### Packages

- **`packages/cli`** — `@tech-leads-club/agent-skills`. The user-facing installer. Dual-mode: interactive TUI (React + Ink) and non-interactive CLI (Commander.js). Entry: `src/index.ts`. Business logic in `src/services/` (registry fetching, skill installation, lockfile management, agent configs).
- **`packages/skills-catalog`** — Skill definitions in `skills/{(category)}/{skill-name}/SKILL.md` with YAML frontmatter. `src/generate-registry.ts` produces `skills-registry.json` (committed, published to npm, served via jsDelivr CDN).
- **`packages/marketplace`** — Next.js 16 static site deployed to GitHub Pages. Reads from `src/data/skills.json` (generated from the registry).
- **`libs/core`** — `@tech-leads-club/core`. Shared types (`AgentType`, `SkillInfo`, `CategoryInfo`) and constants.
- **`tools/skill-plugin`** — Nx generator for scaffolding new skills.

### Key Flows

**Skill installation**: CLI fetches `skills-registry.json` from CDN → downloads skill files (batched, 10 concurrent) to `~/.cache/agent-skillsls/` → installs via copy or symlink to agent-specific directory → records in `.agents/.skill-lock.json` (v2, Zod-validated, atomic writes).

**Registry generation**: `generate-registry.ts` scans all `SKILL.md` files, parses frontmatter, computes SHA-256 content hashes, outputs `skills-registry.json`.

### Agent Configuration

Canonical agent config is in `packages/cli/src/services/agents.ts`. Each of the 19 supported agents has `skillsDir` (project-local) and `globalSkillsDir` (home directory) paths. Agents are tiered: Tier 1 (Cursor, Claude Code, Copilot, Windsurf, Cline), Tier 2, Tier 3.

## Code Conventions

- **ESM-only** throughout. Jest requires `NODE_OPTIONS='--experimental-vm-modules'`.
- **TypeScript strict mode**. `@typescript-eslint/no-explicit-any: error`. Unused vars with `_` prefix are allowed.
- **Prettier**: no semicolons, single quotes, trailing commas, 120 char width, organize-imports plugin.
- **Node ≥ 24** (monorepo), **Node ≥ 22** (CLI package).
- Tests: Jest 30 + ts-jest. Property-based tests use fast-check (`*.pbt.test.ts`). Security-specific tests exist for installer and lockfile.

## Skill Structure

```
skills/(category)/{skill-name}/
├── SKILL.md          # Required — YAML frontmatter + markdown body
├── scripts/          # Optional executable scripts
├── templates/        # Optional file templates
└── references/       # Optional on-demand documentation
```

Always use the Nx generator (`nx g @tech-leads-club/skill-plugin:skill`) to create skills. Keep `SKILL.md` under 500 lines; offload reference material to `references/`.

## Release

Nx Release with conventional commits. `chore`, `test`, `style`, `build`, `ci` prefixes do not trigger version bumps. Security scan must pass before release (`npm run scan`). Two independent release groups: `cli` and `skills-catalog`.
