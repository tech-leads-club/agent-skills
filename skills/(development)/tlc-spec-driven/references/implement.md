# Implement

**Goal**: Execute ONE task at a time. Surgical changes. Mark done.

---

## MANDATORY: Before Starting Any Implementation

**Read [coding-principles.md](coding-principles.md) and state:**

1. **Assumptions** - What am I assuming? Any uncertainty?
2. **Files to touch** - List ONLY files this task requires
3. **Success criteria** - How will I verify this works?

⚠️ **Do not proceed without stating these explicitly.**

---

## Process

### 1. Pick Task

User specifies ("implement T3") or suggest next available.

### 2. Verify Dependencies

Check tasks.md - are all dependencies marked done?

❌ If not: "T3 depends on T2 which isn't done. Should I do T2 first?"

### 3. State Implementation Plan

Before writing code:

```
Files: [list]
Approach: [brief description]
Success: [how to verify]
```

### 4. Implement

- Follow "What" and "Where" exactly
- Reference "Reuses" for patterns
- Apply [coding-principles.md](coding-principles.md):
  - Simplest code that works
  - Touch ONLY listed files
  - No scope creep

### 5. Verify "Done When"

Check all criteria before marking done.

### 6. Self-Check

Ask: "Would senior engineer flag this as overcomplicated?"

- Yes → Simplify before continuing
- No → Mark task complete in tasks.md

---

## Execution Template

```markdown
## Implementing T[X]: [Task Title]

**Reading**: task definition from tasks.md
**Dependencies**: [All done? ✅ | Blocked by: TY]

### Pre-Implementation (MANDATORY)

- **Assumptions**: [state explicitly]
- **Files to touch**: [list ONLY these]
- **Success criteria**: [how to verify]

### Implementation

[Do the work]

### Verification

- [x] Done when criterion 1
- [x] Done when criterion 2
- [x] No unnecessary changes made
- [x] Matches existing patterns

**Status**: ✅ Complete | ❌ Blocked | ⚠️ Partial
```

---

## Tips

- **One task at a time** - Focus prevents errors
- **Tools matter** - Wrong MCP = wrong approach
- **Reuses save tokens** - Copy patterns, don't reinvent
- **Check before mark done** - Verify all criteria
- **Stay surgical** - Touch only what's necessary
