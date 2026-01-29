# Phase 4a: Implement

**Goal**: Execute ONE task at a time. Use the right tools. Mark done.

## Process

### 1. Pick Task

Either user specifies ("implement T3") or you suggest next available.

### 2. Verify Dependencies

Check tasks.md - are all dependencies marked done?

❌ If not: "T3 depends on T2 which isn't done. Should I do T2 first?"

### 3. Use Specified Tools

**MUST** use the MCPs and Skills listed in the task.

### 4. Implement

Follow the "What" and "Where" exactly. Reference "Reuses" for patterns.

### 5. Verify "Done When"

Check all criteria are met before marking done.

### 6. Update Status

Mark task complete in tasks.md.

---

## Execution Template

```markdown
## Implementing T[X]: [Task Title]

**Reading**: task definition from tasks.md
**Dependencies**: [All done? ✅ | Blocked by: TY]
**Using**:

- MCP: [from task]
- Skill: [from task]
- Reusing: [from task]

### Implementation

[Do the work]

### Verification

- [x] Done when criterion 1
- [x] Done when criterion 2

**Status**: ✅ Complete | ❌ Blocked | ⚠️ Partial
```

---

## Tips

- **One task at a time** - Focus prevents errors
- **Tools matter** - Wrong MCP = wrong approach
- **Reuses save tokens** - Copy patterns, don't reinvent
- **Check before mark done** - Verify all criteria
