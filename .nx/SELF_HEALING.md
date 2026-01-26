# Self-Healing CI Configuration

This file provides project-specific instructions to the Nx Cloud Self-Healing CI agent for the `agent-skills` monorepo.

## Project Context

This is a TypeScript monorepo managed by Nx, containing:

- **CLI package** (`@tech-leads-club/agent-skills`) - Node.js CLI for installing AI agent skills
- **Core library** (`@tech-leads-club/core`) - Shared utilities and types
- **Skill plugin** - Nx generator for creating new skills
- **Skills collection** - Pre-built skills for AI agents (Claude, Cursor, Copilot, etc.)

See [AGENTS.md](../AGENTS.md) for comprehensive architectural context.

## Confidence Rules

- **High confidence required** for:
  - Changes to `packages/cli/src/index.ts` (entry point)
  - Changes to skill generators in `tools/skill-plugin/`
  - Any modifications to published package versions
  - Changes to CI/CD workflows (`.github/workflows/`)
  - Failures in `*build*` or `*e2e*` tasks

- **Medium confidence acceptable** for:
  - ESLint rule updates
  - Test file modifications (`*.spec.ts`)
  - Documentation updates (README, CHANGELOG)
  - Type definition improvements
  - Failures in `*test*` tasks

- **Low confidence acceptable** for:
  - Formatting fixes (Prettier, ESLint auto-fix)
  - Whitespace normalization
  - Import organization
  - Failures in `*format*` or `*lint*` tasks

- **Classify as environment_state**:
  - Failures in dependency installation
  - CI-specific environment variable issues
  - Permission or authentication errors

## Off-Limits Areas

- `/tmp/` - Temporary build outputs, do not modify
- `CHANGELOG.md` - Managed by semantic-release, do not manually edit
- `package-lock.json` - Only update via `npm install`, never manually
- `/node_modules/` - Dependencies, never modify directly

## Fix Preferences

### Linting and Formatting

- **Always prefer** running `nx format` over manual formatting fixes
- **Always prefer** updating ESLint configuration over adding `eslint-disable` comments
- For TypeScript errors, prefer explicit types over `any` or `@ts-ignore`
- Use `// @ts-expect-error with explanation` only when absolutely necessary

### Testing

- When test failures occur in `*.spec.ts` files:
  1. First check if the test itself is outdated
  2. Then verify if implementation changed the expected behavior
  3. Only then suggest code fixes to make tests pass
- Prefer updating test snapshots (`nx test --updateSnapshot`) when UI/output changes are intentional

### Code Quality

- Maintain existing code patterns (e.g., use of `@clack/prompts` for CLI interactions)
- Follow kebab-case for file/directory names in `skills/` directory
- Ensure all new skills have valid frontmatter in `SKILL.md`
- Respect the monorepo structure - keep packages independent

### Build Failures

- For TypeScript compilation errors, check `tsconfig.json` configuration first
- For module resolution issues, verify entries in `tsconfig.base.json` paths
- Build failures in CI often indicate dependency installation issues - check `package.json` and lockfile

## Predefined Fixes

### Deterministic Nx Commands

For these specific failures, always run the corresponding fix command:

- **Formatting failures** (`nx format:check`): Run `nx format` to auto-fix
- **Sync check failures** (`nx sync:check`): Run `nx sync` to synchronize workspace
- **Lint failures**: Try `nx affected -t lint --fix` before proposing code changes
- **Test snapshots**: For intentional changes, run `nx affected -t test --updateSnapshot`

### Skill Validation Failures

If `validate-skills` job fails:

1. Check for missing `SKILL.md` files in skill directories
2. Verify frontmatter starts with `---` in SKILL.md
3. Ensure skills are properly listed in `skills/categories.json`
4. Validate against `skills/categories.schema.json`

### Conventional Commit Issues

If commit message validation fails:

- Ensure commits follow format: `type(scope): description`
- Valid types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `ci`
- Breaking changes require `!` or `BREAKING CHANGE:` in footer

### TypeScript Errors

For import path errors:

- Check `tsconfig.base.json` for correct path mappings
- Verify package exports in `package.json` files
- Use workspace-relative imports via path aliases (e.g., `@tech-leads-club/core`)

## Auto-Apply Criteria

The following task patterns are safe to auto-apply when the agent has **high confidence**:

- `*format*` - Code formatting via Prettier/ESLint
- `*lint*` - Linting fixes that don't change logic
- Test updates when implementation intentionally changed behavior

**Never auto-apply** fixes to:

- `*build*` tasks when they might affect published packages
- `*e2e*` or integration tests
- Version bumps or changelog generation

## Context

See [AGENTS.md](../AGENTS.md) for complete project architecture, monorepo structure, and development guidelines.

Key configuration files:

- `nx.json` - Nx workspace configuration and task runner settings
- `tsconfig.base.json` - TypeScript path mappings for monorepo
- `skills/categories.json` - Skill taxonomy and categorization
- `.github/workflows/ci.yml` - CI pipeline definition

## Project-Specific Notes

### Skill Creation

New skills must:

1. Be created via `nx g @tech-leads-club/skill-plugin:skill <name>`
2. Have kebab-case directory names
3. Include frontmatter in SKILL.md with `name` and `description`
4. Follow the template structure (see `tools/skill-plugin/src/generators/skill/files/`)

### CLI Development

When modifying `packages/cli/`:

- Ensure changes maintain backward compatibility
- Update tests in `__tests__/` directory
- Verify against all supported agents (Claude, Cursor, Copilot, Antigravity, OpenCode)
- Test with both `--local` and `--global` installation modes

### Testing Strategy

- Use `NODE_OPTIONS: '--experimental-vm-modules'` for Jest (ESM support)
- Run affected tests via `nx affected -t test`
- Coverage reports are in `coverage/` (gitignored)

## Failure Classification

When analyzing failures, classify them as:

- **code_quality**: Linting, formatting, type errors
- **test_failure**: Unit/integration test failures
- **build_failure**: Compilation, bundling errors
- **dependency_issue**: Missing or incompatible dependencies
- **configuration_error**: Incorrect nx.json, tsconfig, or package.json settings
- **environment_state**: CI-specific issues (permissions, env vars)

This helps determine the appropriate fix strategy and confidence level.
