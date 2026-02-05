---
name: nx-workspace
description: Configure, explore, and optimize Nx monorepo workspaces. Use when setting up Nx, exploring workspace structure, configuring project boundaries, running tasks, analyzing affected projects, optimizing build caching, or implementing CI/CD with affected commands. Keywords - nx, monorepo, workspace, projects, targets, affected, build, lint, test.
---

# Nx Workspace Management

## Quick Start

**Exploring workspace**: `nx show projects` and `nx show project <name> --json`  
**Running tasks**: `nx <target> <project>` (e.g., `nx build my-app`)  
**Affected analysis**: `nx show projects --affected` or `nx affected -t <target>`

> **Note**: Prefix commands with `npx`/`pnpx`/`yarn` if nx isn't installed globally.

## Core Commands

### List and Explore Projects

```bash
# List all projects
nx show projects

# Filter by type, pattern, or target
nx show projects --type app
nx show projects --projects "apps/*"
nx show projects --withTarget build

# Find affected projects
nx show projects --affected --base=main
```

### Get Project Information

**Critical**: Always use `nx show project <name> --json` for full resolved configuration. Do NOT read `project.json` directly - it contains only partial configuration.

```bash
# Get full configuration
nx show project my-app --json

# Extract targets
nx show project my-app --json | jq '.targets | keys'
```

Configuration schemas:

- Workspace: `node_modules/nx/schemas/nx-schema.json`
- Project: `node_modules/nx/schemas/project-schema.json`

### Run Tasks

```bash
# Run specific project
nx build web --configuration=production

# Run affected
nx affected -t test --base=main

# View dependency graph
nx graph
```

## Workspace Architecture

```
workspace/
├── apps/              # Deployable applications
├── libs/              # Shared libraries
│   ├── shared/        # Shared across scopes
│   └── feature/       # Feature-specific
├── nx.json            # Workspace configuration
└── tools/             # Custom executors/generators
```

### Library Types

| Type | Purpose | Example |
|------|---------|---------|
| **feature** | Business logic, smart components | `feature-auth` |
| **ui** | Presentational components | `ui-buttons` |
| **data-access** | API calls, state management | `data-access-users` |
| **util** | Pure functions, helpers | `util-formatting` |

## Detailed Resources

**Configuration**: See [reference/configuration.md](reference/configuration.md) for:

- nx.json templates and options
- project.json structure
- Module boundary rules
- Remote caching setup

**Commands**: See [reference/commands.md](reference/commands.md) for:

- Complete command reference
- Advanced filtering options
- Common workflows

**CI/CD**: See [reference/ci-cd.md](reference/ci-cd.md) for:

- GitHub Actions configuration
- GitLab CI setup
- Jenkins, Azure Pipelines, CircleCI examples
- Affected commands in pipelines

**Best Practices**: See [reference/best-practices.md](reference/best-practices.md) for:

- Do's and don'ts
- Complete troubleshooting guide
- Performance optimization
- Migration guides

## Common Workflows

**"What's in this workspace?"**

```bash
nx show projects --type app  # List applications
nx show projects --type lib  # List libraries
```

**"How do I run project X?"**

```bash
nx show project X --json | jq '.targets | keys'
```

**"What changed?"**

```bash
nx show projects --affected --base=main
```

## Quick Troubleshooting

- **Targets not showing**: Use `nx show project <name> --json`, not project.json
- **Affected not working**: Ensure git history available (`fetch-depth: 0` in CI)
- **Cache issues**: Run `nx reset`

For detailed troubleshooting, see [reference/best-practices.md](reference/best-practices.md).
