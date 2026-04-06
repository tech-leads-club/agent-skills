# Review Patterns

## Blast-Radius-First Review
- Always assess impact radius before reading any file
- Use git diff to identify changed files, then trace callers/importers/inheritors
- Changed functions → who calls them → who calls those → blast radius
- Flag wide blast radius (>20 impacted areas) for extra scrutiny
- Inheritance/Liskov concerns when base classes change

## Structural Query Vocabulary
When structural analysis tools are available (code-review-graph MCP, or manual tracing):
- `callers_of` / `callees_of` — call chain tracing
- `imports_of` / `importers_of` — dependency chain
- `children_of` — members of a class/file
- `tests_for` — test coverage lookup
- `inheritors_of` — Liskov substitution checks
- `file_summary` — all exported symbols in a file

## Test Coverage Gap Detection
- Cross-reference changed functions against existing tests
- Flag untested changed functions explicitly
- Check if new public APIs have corresponding test files
- Pattern: for each changed function, search for test files containing its name

## Structured Review Output Template
Always output reviews in this format:
```
## Summary
[1-2 sentence overview of the change]

## Risk Assessment
- **Risk Level**: Low / Medium / High / Critical
- **Blast Radius**: X files directly impacted, Y transitively
- **Test Coverage**: X/Y changed functions have tests

## File-by-File Review
### path/to/file.ts
- **Changes**: [what changed]
- **Impact**: [what this affects]
- **Issues**: [bugs, concerns] (confidence: X/100)

## Missing Tests
- [ ] function_name in file.ts has no test coverage
- [ ] new API endpoint /api/foo lacks integration test

## Recommendations
1. [Actionable recommendation]
2. [Actionable recommendation]
```

## Token-Efficient Review Patterns
- Read only changed files + their direct callers (2-hop max)
- For large PRs (>20 files), group by module and review module-by-module
- Skip auto-generated files, lockfiles, and migration files unless explicitly relevant
- Use section-tagged docs: load only the reference section you need, not the whole doc

## Anti-Patterns in Code Review
- Don't nitpick style when there's a bug to find
- Don't flag things the linter should catch
- Don't repeat what the PR description already says
- Focus on: correctness > security > performance > maintainability > style
