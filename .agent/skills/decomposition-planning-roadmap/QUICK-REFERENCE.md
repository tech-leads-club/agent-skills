# Decomposition Planning & Roadmap - Quick Reference

## Pattern Sequence

```
1. Identify & Size Components      → Foundation
2. Gather Common Components        → Find duplicates
3. Flatten Components              → Clean structure
4. Determine Dependencies          → Assess feasibility
5. Create Component Domains        → Group components
6. Create Domain Services          → Extract services
```

## Phased Approach

### Phase 1: Analysis & Preparation

- Pattern 1: Identify & Size Components
- Pattern 2: Gather Common Components
- Pattern 3: Flatten Components
- Pattern 4: Determine Dependencies

### Phase 2: Domain Organization

- Pattern 5: Create Component Domains

### Phase 3: Service Extraction

- Pattern 6: Create Domain Services

## Prioritization Formula

```
Priority = (Value × 3) - (Risk × 2) - (Dependencies × 1)

Higher score = Higher priority
```

### Risk Levels

- **Low**: Infrastructure, standalone
- **Medium**: Domain components, some dependencies
- **High**: Core business logic, high coupling

### Value Levels

- **High**: Business-critical, high impact
- **Medium**: Important but not critical
- **Low**: Nice to have, low impact

## Prioritization Matrix

```
High Value, Low Risk    | High Value, High Risk
(Do First)              | (Do Carefully)
────────────────────────┼──────────────────────
Low Value, Low Risk     | Low Value, High Risk
(Do Later)              | (Avoid/Defer)
```

## Roadmap Templates

### Small Project (3-6 months)

- Phase 1: Analysis (1 month)
- Phase 2: Refactoring (2 months)
- Phase 3: Extraction (2-3 months)

### Medium Project (6-12 months)

- Phase 1: Analysis & Preparation (2 months)
- Phase 2: Domain Organization (2 months)
- Phase 3: Service Extraction (4-6 months)
- Phase 4: Optimization (2 months)

### Large Project (12+ months)

- Phase 1: Analysis & Preparation (3-4 months)
- Phase 2: Domain Organization (3-4 months)
- Phase 3: Service Extraction (6-8 months)
- Phase 4: Optimization (2-3 months)

## Architecture Story Template

```
As an architect, I need to [apply pattern/refactor component]
to support [architectural characteristic/business need]
so that [benefit/outcome]

Acceptance Criteria:
- [ ] Criterion 1
- [ ] Criterion 2

Estimate: X story points
Priority: High/Medium/Low
Dependencies: [List]
```

## Story Point Estimation

| Points | Effort    | Description |
| ------ | --------- | ----------- |
| 1      | Few hours | Trivial     |
| 2      | 1 day     | Simple      |
| 3      | 2-3 days  | Small       |
| 5      | 1 week    | Medium      |
| 8      | 2 weeks   | Large       |
| 13     | 3+ weeks  | Very Large  |

## Progress Tracking Checklist

### Pattern Status

- [ ] Pattern 1: Complete / In Progress / Not Started
- [ ] Pattern 2: Complete / In Progress / Not Started
- [ ] Pattern 3: Complete / In Progress / Not Started
- [ ] Pattern 4: Complete / In Progress / Not Started
- [ ] Pattern 5: Complete / In Progress / Not Started
- [ ] Pattern 6: Complete / In Progress / Not Started

### Key Metrics

- Components Identified: X
- Components Refactored: X (Y%)
- Domains Created: X
- Services Extracted: X

### Blockers

- [ ] List blockers
- [ ] Identify dependencies
- [ ] Plan mitigation

## Quick Analysis Steps

1. **Assess** → Check current state
2. **Identify** → Find patterns to apply
3. **Prioritize** → Rank by risk/value
4. **Plan** → Create phased roadmap
5. **Track** → Monitor progress

## Output Template

```markdown
# Decomposition Roadmap

## Current State Assessment

- ✅ [Completed patterns]
- ⚠️ [In progress patterns]
- ❌ [Not started patterns]

## Phased Roadmap

### Phase 1: [Name] (Timeline)

- [Patterns/work items]
- Milestones: [List]
- Deliverables: [List]

### Phase 2: [Name] (Timeline)

[Similar format]

## Prioritized Work Plan

### High Priority

1. [Work item] (Priority: X/10)
   - Risk: Low/Medium/High
   - Value: High/Medium/Low
   - Effort: X weeks

## Architecture Stories

[Story list]

## Progress Dashboard

[Status tables and metrics]
```
