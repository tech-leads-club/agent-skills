# Roadmap Creation

**Trigger:** "Create roadmap", "Plan features", "Map project phases"

## Process

Based on PROJECT.md, decompose vision into:

- Milestones (shippable increments)
- Features (user-facing capabilities)
- Status tracking (planned/in-progress/complete)

## Output: .specs/project/ROADMAP.md

**Structure:**

```markdown
# Roadmap

**Current Milestone:** [milestone name]
**Status:** Planning | In Progress | Complete

---

## [Milestone 1 Name]

**Goal:** [What makes this milestone shippable]
**Target:** [Date or completion criteria]

### Features

**[Feature Name]** - STATUS

- [Capability 1]
- [Capability 2]
- [Capability 3]

**[Feature Name]** - STATUS

- [Capability 1]
- [Capability 2]

---

## [Milestone 2 Name]

**Goal:** [What this milestone adds]

### Features

**[Feature Name]** - PLANNED
**[Feature Name]** - PLANNED

---

## Future Considerations

- [Potential future capability]
- [Potential future capability]
```

**Status values:**

- PLANNED: Not started
- IN PROGRESS: Currently implementing
- COMPLETE: Shipped and verified

**Size limit:** 3,000 tokens (~1,800 words)

**Update strategy:**

- Mark features PLANNED → IN PROGRESS when starting
- Mark IN PROGRESS → COMPLETE when verified
- Add new milestones as project evolves

**Validation:**

- Each milestone has clear shippable outcome?
- Features are user-facing capabilities?
- Status reflects current reality?
