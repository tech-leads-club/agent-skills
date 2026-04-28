# Nx Best Practices

## Do's ✅

### Use Tags Consistently

Apply meaningful tags to enforce module boundaries:

```json
{
  "tags": ["type:feature", "scope:web"]
}
```

Benefits:

- Prevents circular dependencies
- Enforces architectural patterns
- Makes dependency graph clearer

### Enable Caching Early

Configure caching from the start:

```json
{
  "targetDefaults": {
    "build": {
      "cache": true,
      "inputs": ["production", "^production"]
    }
  }
}
```

Benefits:

- 50-80% CI time reduction
- Faster local development
- Better resource utilization

### Keep Libraries Focused

Each library should have single responsibility:

```bash
# Good - Focused libraries
libs/
  ui/
    buttons/
    forms/
  data-access/
    users/
    products/

# Avoid - Mixed concerns
libs/
  shared/  # Too broad
    everything.ts
```

### Use Affected Commands

Always test only what changed:

```bash
# In CI
nx affected -t test --base=main

# Not
nx run-many -t test --all
```

### Document Boundaries

Add README to explain module structure:

```markdown
# Library Architecture

## Type Tags
- `type:feature` - Business logic
- `type:ui` - Components
- `type:data-access` - API calls

## Scope Tags
- `scope:web` - Web app specific
- `scope:mobile` - Mobile app specific
- `scope:shared` - Shared across apps
```

### Always Use `nx show project`

Get full resolved configuration:

```bash
# Correct
nx show project my-app --json

# Wrong - incomplete config
cat apps/my-app/project.json
```

## Don'ts ❌

### Don't Create Circular Dependencies

Circular deps break build order:

```bash
# Bad
lib-a → lib-b → lib-a  # Circular!

# Good
lib-a → lib-b → lib-c  # Acyclic
```

Check with:

```bash
nx graph
```

### Don't Skip Affected in CI

Running all tests wastes resources:

```bash
# Wasteful in CI
nx run-many -t test --all  # ❌

# Efficient
nx affected -t test  # ✅
```

### Don't Ignore Boundary Rules

Boundary violations accumulate technical debt:

```bash
# Fix violations immediately
nx lint --fix

# Don't disable rules
"@nx/enforce-module-boundaries": "off"  # ❌
```

### Don't Over-Granularize

Too many small libraries creates overhead:

```bash
# Too granular
libs/
  utils/
    add/  # Just one function
    subtract/  # Just one function

# Better
libs/
  utils/
    math/  # Related functions together
```

### Don't Read project.json Directly

It contains only partial configuration:

```bash
# Wrong
cat project.json  # ❌

# Correct
nx show project my-app --json  # ✅
```

## Troubleshooting

### Package Manager Not Detected

**Problem**: Nx doesn't detect package manager

**Solution**: Ensure lockfile exists

- npm: `package-lock.json`
- yarn: `yarn.lock`
- pnpm: `pnpm-lock.yaml`

### Targets Not Showing

**Problem**: Targets missing in `nx show projects`

**Cause**: Reading project.json instead of resolved config

**Solution**:

```bash
nx show project <name> --json | jq '.targets'
```

### Affected Commands Not Working

**Problem**: All projects shown as affected

**Causes**:

1. Missing git history
2. Wrong base branch

**Solutions**:

```bash
# In CI: fetch full history
- uses: actions/checkout@v4
  with:
    fetch-depth: 0

# Specify correct base
nx affected -t test --base=origin/main
```

### Cache Not Working

**Problem**: Tasks always re-run

**Causes**:

1. Cache disabled
2. Inputs not configured
3. Cache corrupted

**Solutions**:

```bash
# Check if cache enabled
cat nx.json | jq '.targetDefaults.build.cache'

# Clear cache
nx reset

# Configure inputs
{
  "targetDefaults": {
    "build": {
      "cache": true,
      "inputs": ["production", "^production"]
    }
  }
}
```

### Circular Dependency Errors

**Problem**: Build fails with circular dependency

**Detection**:

```bash
nx graph
```

**Solution**:

1. Find the cycle in dependency graph
2. Extract shared code to new library
3. Update imports to break cycle

### Module Boundary Violations

**Problem**: Import violates boundary rules

**Error**:

```
A project tagged with "scope:web" can only depend on libs tagged with "scope:web", "scope:shared"
```

**Solutions**:

```bash
# Check current tags
nx show project my-lib --json | jq '.tags'

# Update tags in project.json
{
  "tags": ["scope:shared"]  # Allow cross-scope import
}

# Or move code to allowed scope
```

### Build Performance Issues

**Problem**: Builds are slow

**Solutions**:

1. Enable caching:

```json
{
  "targetDefaults": {
    "build": {
      "cache": true
    }
  }
}
```

1. Use affected:

```bash
nx affected -t build --base=main
```

1. Increase parallelization:

```bash
nx affected -t build --parallel=5
```

1. Enable Nx Cloud:

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx-cloud"
    }
  }
}
```

### Git Submodule Issues

**Problem**: Affected detection wrong with submodules

**Solution**: Configure affected in nx.json:

```json
{
  "affected": {
    "defaultBase": "main"
  }
}
```

## Performance Optimization

### Enable Remote Caching

Use Nx Cloud or self-hosted cache:

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx-cloud",
      "options": {
        "cacheableOperations": ["build", "lint", "test"],
        "accessToken": "your-token"
      }
    }
  }
}
```

### Configure Inputs Properly

Define what affects cache:

```json
{
  "namedInputs": {
    "default": ["{projectRoot}/**/*"],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?"
    ]
  }
}
```

### Use Parallel Execution

Leverage multi-core CPUs:

```bash
# Local development
nx affected -t test --parallel=3

# CI with more resources
nx affected -t test --parallel=5
```

### Optimize Bundle Size

Configure production builds:

```json
{
  "configurations": {
    "production": {
      "optimization": true,
      "sourceMap": false,
      "extractLicenses": true,
      "namedChunks": false
    }
  }
}
```

## Migration Guide

### From Lerna to Nx

```bash
# Add Nx to existing Lerna monorepo
npx nx@latest init

# Migrate Lerna commands
lerna run test → nx run-many -t test --all
lerna run test --since → nx affected -t test
```

### From Angular CLI to Nx

```bash
# Add Nx to Angular workspace
npx nx@latest init

# Continue using Angular CLI commands
ng build → nx build
ng serve → nx serve
```

### Updating Nx

```bash
# Check for updates
nx migrate latest

# Review migrations
cat migrations.json

# Run migrations
nx migrate --run-migrations

# Clean up
rm migrations.json
```
