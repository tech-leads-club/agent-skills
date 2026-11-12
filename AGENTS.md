# AGENTS.md

Guidance for AI Coding Agents when working with code in this repository.

## Workflow Orchestration

### 1. Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Verification Before Done

- Never mark a task complete without proving it works
- Run the full test suite before considering work done
- Verify your changes against the existing behavior
- Ask yourself: "Would a staff engineer approve this?"

### 4. Demand Elegance (Balanced)

- For nontrivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 5. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Run tests to identify the root cause
- Zero context switching required from the user
- Go fix failing tests without being told how

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Minimal code impact.
- **No Laziness**: Find root causes. No temporary workarounds. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

---

## Repository

**Agent Skills Monorepo** — a registry and CLI for distributing "skills" (packaged instructions) to AI coding agents (Claude Code, Cursor, Copilot, Windsurf, Cline, and 14 others).

## Commands

```bash
# Setup
npm ci && npm run build

# Development
npm run start:dev:cli          # Run CLI interactively (tsx, no build needed)
npm run start:dev:mcp          # Build MCP and open Inspector
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
npm run scan                   # Security scan (snyk-agent-scan, incremental; requires SNYK_TOKEN)
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

### Skill Scripts Must Run on Windows, macOS and Linux

Every script you add to or change in a skill's `scripts/` must work unchanged on all three. Users install skills into any of the supported agents on any OS, and a script that only runs on one platform breaks the skill for everyone else.

- **Language**: Python 3 (standard library only) or Node.js (`.mjs`, no dependencies). No new Bash, PowerShell or other shell-only scripts. The existing `.sh` scripts are legacy: port them when you touch them.
- **Invocation**: `SKILL.md` says how to run each script, defines `<skill-dir>` as the directory containing the `SKILL.md`, and gives the Windows command alongside (`python` or `py -3`, since `python3` may be the Microsoft Store alias).
- **Paths**: build them with `pathlib`/`os.path` (Python) or `node:path` (Node). Never hard-code `/` or `\` separators, `/tmp`, `~` or home-directory layouts.
- **Text I/O**: open files with an explicit `encoding="utf-8"`, accept both LF and CRLF, and make stdout safe for non-ASCII output (`sys.stdout.reconfigure(encoding="utf-8", errors="replace")` in Python), because Windows writes piped output in the ANSI code page and crashes on characters like `→`.
- **Subprocesses**: pass arguments as a list, never through a shell string (`shell=True`, `exec`). Do not assume `bash`, `grep`, `sed`, `which` or other Unix tools exist; resolve executables with `shutil.which` and handle their absence.
- **Exit codes**: `0` for success, non-zero for findings or failure, with a message that says which.
- **Verify**: run the script on the platforms you can, and at least simulate Windows output with `PYTHONIOENCODING=cp1252` (without `-I`, which ignores it) and a CRLF input file.

### Skill Quality Standards

**When creating a new skill or modifying an existing one, you MUST use the `skill-architect` skill** to ensure it follows best practices. If the `skill-architect` skill is not installed, follow these mandatory description rules:

- **Structure**: `[What it does] + [Use when ...] + [Do NOT use for ...]`
- **"Use when"** is mandatory — include actual phrases users would say
- **"Do NOT use for"** is mandatory — add negative triggers to prevent overlap with similar skills
- **Under 1024 characters** — no XML angle brackets (`< >`)
- **User perspective** — write trigger phrases as things the user would actually say, not internal jargon

## Release

Nx Release with conventional commits. `chore`, `test`, `style`, `build`, `ci` prefixes do not trigger version bumps. Security scan must pass before release (`npm run scan`). Two independent release groups: `cli` and `skills-catalog`.
