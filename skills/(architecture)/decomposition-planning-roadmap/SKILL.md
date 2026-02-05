---
name: decomposition-planning-roadmap
description: Creates structured decomposition plans and roadmaps for migrating monolithic applications. Use when planning decomposition, creating migration roadmaps, prioritizing decomposition work, tracking decomposition progress, or when the user asks about decomposition planning, migration strategy, or architectural roadmap.
---

# Decomposition Planning and Roadmap

This skill creates structured decomposition plans and roadmaps to guide the migration from monolithic to distributed architectures, prioritizing work and tracking progress through decomposition patterns.

## How to Use

### Quick Start

Request creation of a decomposition plan:

- **"Create a decomposition roadmap for this codebase"**
- **"Plan the decomposition migration strategy"**
- **"Prioritize decomposition work based on component analysis"**
- **"Create a step-by-step decomposition plan"**

### Usage Examples

**Example 1: Complete Roadmap**

```
User: "Create a decomposition roadmap for this codebase"

The skill will:
1. Analyze current codebase state
2. Identify decomposition patterns to apply
3. Prioritize work based on risk and value
4. Create phased roadmap
5. Generate architecture stories
6. Estimate effort and dependencies
```

**Example 2: Prioritized Plan**

```
User: "Prioritize decomposition work based on component analysis"

The skill will:
1. Review component inventory and dependencies
2. Assess risk and value for each pattern
3. Prioritize patterns by impact
4. Create prioritized work plan
```

**Example 3: Phase Planning**

```
User: "Create a phased decomposition plan"

The skill will:
1. Group decomposition patterns into phases
2. Identify dependencies between phases
3. Create phase timeline
4. Define phase success criteria
```

### Step-by-Step Process

1. **Assess Current State**: Analyze codebase and identify what's been done
2. **Identify Patterns**: Determine which decomposition patterns to apply
3. **Prioritize Work**: Rank patterns by risk, value, and dependencies
4. **Create Roadmap**: Build phased plan with milestones
5. **Generate Stories**: Create architecture stories for tracking
6. **Track Progress**: Monitor progress through decomposition phases

## When to Use

Apply this skill when:

- Starting a decomposition effort
- Planning migration from monolith to distributed architecture
- Prioritizing decomposition work
- Creating architecture stories for decomposition
- Tracking progress through decomposition patterns
- Need structured approach to decomposition
- Want to estimate effort and dependencies

## Core Concepts

### Decomposition Pattern Sequence

The six component-based decomposition patterns should be applied in sequence:

1. **Identify and Size Components** - Understand what you have
2. **Gather Common Domain Components** - Find duplicates
3. **Flatten Components** - Remove orphaned classes
4. **Determine Component Dependencies** - Assess coupling
5. **Create Component Domains** - Group into domains
6. **Create Domain Services** - Extract to services

### Phased Approach

Decomposition typically follows phases:

**Phase 1: Analysis & Preparation** (Patterns 1-4)

- Component identification and sizing
- Common component detection
- Component flattening
- Dependency analysis

**Phase 2: Domain Organization** (Pattern 5)

- Domain identification
- Component grouping
- Namespace refactoring

**Phase 3: Service Extraction** (Pattern 6)

- Domain service creation
- Service extraction
- API boundary definition

### Prioritization Factors

When prioritizing decomposition work, consider:

- **Risk**: Low risk = easier to extract, fewer dependencies
- **Value**: High value = business-critical, high impact
- **Dependencies**: Can this be done independently?
- **Complexity**: Simple = fewer components, clear boundaries
- **Coupling**: Low coupling = easier to extract

## Analysis Process

### Phase 1: Assess Current State

Analyze what's already been done:

1. **Check Component Inventory**
   - Have components been identified and sized?
   - Is there a component inventory document?
   - Are oversized components identified?

2. **Check Common Component Analysis**
   - Have common domain components been identified?
   - Are consolidation opportunities documented?
   - Has coupling impact been analyzed?

3. **Check Component Structure**
   - Have components been flattened?
   - Are there orphaned classes?
   - Is component structure clean?

4. **Check Dependency Analysis**
   - Have component dependencies been mapped?
   - Is coupling analysis complete?
   - Is feasibility assessed?

5. **Check Domain Identification**
   - Have domains been identified?
   - Are components grouped into domains?
   - Are namespaces aligned with domains?

6. **Check Service Extraction**
   - Have any services been extracted?
   - Are domain services created?
   - Is service-based architecture in place?

**Output**: Current state assessment showing what's done and what's remaining

### Phase 2: Identify Patterns to Apply

Determine which decomposition patterns need to be applied:

1. **Review Pattern Prerequisites**
   - Pattern 1: Always needed (foundation)
   - Pattern 2: Needed if common components exist
   - Pattern 3: Needed if components have hierarchy
   - Pattern 4: Always needed (feasibility check)
   - Pattern 5: Needed before service extraction
   - Pattern 6: Final step (service extraction)

2. **Check Pattern Completion**
   - Which patterns are complete?
   - Which patterns are in progress?
   - Which patterns haven't started?

3. **Identify Missing Patterns**
   - What patterns still need to be applied?
   - What's blocking pattern application?
   - What dependencies exist?

**Output**: List of patterns to apply with status

### Phase 3: Prioritize Work

Prioritize decomposition patterns and work items:

1. **Assess Risk**
   - Low Risk: Infrastructure components, standalone functionality
   - Medium Risk: Domain components with some dependencies
   - High Risk: Core business logic, high coupling

2. **Assess Value**
   - High Value: Business-critical, high impact, frequent changes
   - Medium Value: Important but not critical
   - Low Value: Nice to have, low impact

3. **Assess Dependencies**
   - Independent: Can be done without other work
   - Dependent: Requires other patterns/work first
   - Blocking: Blocks other work from proceeding

4. **Calculate Priority Score**

   ```
   Priority = (Value × 3) - (Risk × 2) - (Dependencies × 1)

   Higher score = Higher priority
   ```

**Output**: Prioritized list of patterns and work items

### Phase 4: Create Phased Roadmap

Build a phased roadmap with milestones:

1. **Define Phases**
   - Phase 1: Analysis & Preparation
   - Phase 2: Domain Organization
   - Phase 3: Service Extraction
   - Phase 4: Optimization & Refinement

2. **Assign Patterns to Phases**
   - Which patterns belong in which phase?
   - What's the sequence within each phase?
   - What are the phase dependencies?

3. **Set Milestones**
   - What marks completion of each phase?
   - What are the success criteria?
   - What deliverables are expected?

4. **Estimate Timeline**
   - How long will each phase take?
   - What are the dependencies?
   - What's the critical path?

**Output**: Phased roadmap with timeline and milestones

### Phase 5: Generate Architecture Stories

Create architecture stories for tracking work:

1. **Create Story Template**

   ```
   As an architect, I need to [apply pattern/refactor component]
   to support [architectural characteristic/business need]
   so that [benefit/outcome]
   ```

2. **Break Down Work**
   - One story per pattern application
   - One story per major refactoring
   - One story per domain grouping

3. **Add Acceptance Criteria**
   - What defines "done"?
   - What metrics validate success?
   - What tests verify completion?

4. **Estimate Effort**
   - Story points or time estimates
   - Complexity assessment
   - Risk factors

**Output**: List of architecture stories with estimates

### Phase 6: Track Progress

Monitor progress through decomposition:

1. **Track Pattern Completion**
   - Which patterns are complete?
   - Which are in progress?
   - Which are blocked?

2. **Track Story Completion**
   - Stories completed
   - Stories in progress
   - Stories not started

3. **Track Metrics**
   - Components identified
   - Components refactored
   - Domains created
   - Services extracted

4. **Identify Blockers**
   - What's blocking progress?
   - What dependencies are missing?
   - What risks have emerged?

**Output**: Progress dashboard and status report

## Output Format

### Decomposition Roadmap

```markdown
# Decomposition Roadmap

## Current State Assessment

**Completed Patterns**:

- ✅ Pattern 1: Identify and Size Components
- ✅ Pattern 2: Gather Common Domain Components
- ⚠️ Pattern 3: Flatten Components (in progress)
- ❌ Pattern 4: Determine Component Dependencies (not started)
- ❌ Pattern 5: Create Component Domains (not started)
- ❌ Pattern 6: Create Domain Services (not started)

**Key Findings**:

- 75 components identified
- 3 common domain components found
- 2 oversized components need splitting
- High database coupling detected

## Phased Roadmap

### Phase 1: Analysis & Preparation (Weeks 1-4)

**Goal**: Complete component analysis and refactoring

**Patterns**:

1. Complete Pattern 3: Flatten Components
2. Apply Pattern 4: Determine Component Dependencies
3. Refactor oversized components

**Milestones**:

- Week 2: Component flattening complete
- Week 4: Dependency analysis complete

**Deliverables**:

- Flattened component structure
- Dependency diagram
- Feasibility assessment

### Phase 2: Domain Organization (Weeks 5-8)

**Goal**: Organize components into domains

**Patterns**:

1. Apply Pattern 5: Create Component Domains
2. Refactor namespaces for domain alignment

**Milestones**:

- Week 6: Domains identified
- Week 8: Namespace refactoring complete

**Deliverables**:

- Domain map
- Refactored component namespaces
- Domain documentation

### Phase 3: Service Extraction (Weeks 9-16)

**Goal**: Extract domains to domain services

**Patterns**:

1. Apply Pattern 6: Create Domain Services
2. Extract services incrementally

**Milestones**:

- Week 12: First domain service extracted
- Week 16: All domain services extracted

**Deliverables**:

- Domain services deployed
- API boundaries defined
- Service documentation
```

### Prioritized Work Plan

```markdown
## Prioritized Work Plan

### High Priority (Do First)

1. **Complete Component Flattening** (Priority: 9/10)
   - Risk: Low
   - Value: High (enables domain grouping)
   - Dependencies: None
   - Effort: 2 weeks

2. **Dependency Analysis** (Priority: 8/10)
   - Risk: Low
   - Value: High (validates feasibility)
   - Dependencies: Component flattening
   - Effort: 1 week

### Medium Priority (Do Next)

3. **Domain Identification** (Priority: 7/10)
   - Risk: Medium
   - Value: High (enables service extraction)
   - Dependencies: Dependency analysis
   - Effort: 2 weeks

### Low Priority (Do Later)

4. **Service Extraction** (Priority: 5/10)
   - Risk: High
   - Value: High (final goal)
   - Dependencies: Domain identification
   - Effort: 8 weeks
```

### Architecture Stories

```markdown
## Architecture Stories

### Story 1: Flatten Ticket Components

**As an architect**, I need to flatten the Ticket component hierarchy
to support better component organization
so that components exist only as leaf nodes.

**Acceptance Criteria**:

- [ ] No orphaned classes in root namespaces
- [ ] All components are leaf nodes
- [ ] Component structure validated

**Estimate**: 5 story points
**Priority**: High
**Dependencies**: None

### Story 2: Identify Component Domains

**As an architect**, I need to group components into logical domains
to support service-based architecture
so that components can be extracted to domain services.

**Acceptance Criteria**:

- [ ] All components assigned to domains
- [ ] Domain boundaries validated with stakeholders
- [ ] Domain map created

**Estimate**: 8 story points
**Priority**: High
**Dependencies**: Component flattening complete
```

### Progress Dashboard

```markdown
## Decomposition Progress Dashboard

### Pattern Completion Status

| Pattern                    | Status         | Progress | Blocker                 |
| -------------------------- | -------------- | -------- | ----------------------- |
| Identify & Size Components | ✅ Complete    | 100%     | None                    |
| Gather Common Components   | ✅ Complete    | 100%     | None                    |
| Flatten Components         | ⚠️ In Progress | 60%      | None                    |
| Determine Dependencies     | ❌ Not Started | 0%       | Waiting on flattening   |
| Create Domains             | ❌ Not Started | 0%       | Waiting on dependencies |
| Create Domain Services     | ❌ Not Started | 0%       | Waiting on domains      |

### Story Completion Status

**Completed**: 5 stories (25%)
**In Progress**: 3 stories (15%)
**Not Started**: 12 stories (60%)

### Key Metrics

- Components Identified: 75
- Components Refactored: 45 (60%)
- Domains Created: 0
- Services Extracted: 0
```

## Analysis Checklist

**Current State Assessment**:

- [ ] Reviewed component inventory
- [ ] Checked common component analysis
- [ ] Assessed component structure
- [ ] Reviewed dependency analysis
- [ ] Checked domain identification
- [ ] Assessed service extraction status

**Pattern Identification**:

- [ ] Identified which patterns are complete
- [ ] Identified which patterns are in progress
- [ ] Identified which patterns need to be applied
- [ ] Checked pattern dependencies

**Prioritization**:

- [ ] Assessed risk for each pattern
- [ ] Assessed value for each pattern
- [ ] Assessed dependencies
- [ ] Calculated priority scores

**Roadmap Creation**:

- [ ] Defined phases
- [ ] Assigned patterns to phases
- [ ] Set milestones
- [ ] Estimated timeline

**Story Generation**:

- [ ] Created architecture stories
- [ ] Added acceptance criteria
- [ ] Estimated effort
- [ ] Prioritized stories

**Progress Tracking**:

- [ ] Set up tracking mechanism
- [ ] Defined metrics
- [ ] Created dashboard
- [ ] Identified blockers

## Implementation Notes

### Roadmap Templates

**Simple Roadmap** (for small projects):

- Phase 1: Analysis (2-4 weeks)
- Phase 2: Refactoring (4-6 weeks)
- Phase 3: Extraction (8-12 weeks)

**Detailed Roadmap** (for large projects):

- Phase 1: Analysis & Preparation (4-8 weeks)
- Phase 2: Domain Organization (4-6 weeks)
- Phase 3: Service Extraction (12-16 weeks)
- Phase 4: Optimization (4-8 weeks)

### Prioritization Matrix

Use a 2x2 matrix for prioritization:

```
High Value, Low Risk    | High Value, High Risk
(Do First)              | (Do Carefully)
────────────────────────┼──────────────────────
Low Value, Low Risk     | Low Value, High Risk
(Do Later)              | (Avoid/Defer)
```

### Story Estimation

Use story points or time estimates:

**Story Points** (Fibonacci):

- 1: Trivial (few hours)
- 2: Simple (1 day)
- 3: Small (2-3 days)
- 5: Medium (1 week)
- 8: Large (2 weeks)
- 13: Very Large (3+ weeks)

**Time Estimates**:

- Small: 1-3 days
- Medium: 1-2 weeks
- Large: 2-4 weeks
- Very Large: 1+ month

## Best Practices

### Do's ✅

- Start with analysis patterns (Patterns 1-4)
- Prioritize low-risk, high-value work
- Create architecture stories for tracking
- Set clear milestones and success criteria
- Track progress regularly
- Adjust roadmap based on learnings
- Collaborate with stakeholders on priorities

### Don'ts ❌

- Don't skip analysis patterns
- Don't start service extraction too early
- Don't ignore dependencies between patterns
- Don't create unrealistic timelines
- Don't skip progress tracking
- Don't forget to validate with stakeholders
- Don't proceed without feasibility assessment

## Integration with Other Skills

This skill coordinates the use of other decomposition skills:

1. **Component Identification & Sizing** → Foundation for planning
2. **Common Domain Component Detection** → Identifies consolidation work
3. **Component Flattening** → Prepares for domain grouping
4. **Component Dependency Analysis** → Validates feasibility
5. **Domain Identification & Grouping** → Enables service extraction
6. **Decomposition Planning & Roadmap** (this skill) → Coordinates everything

## Next Steps

After creating the roadmap:

1. **Review with Stakeholders** - Get buy-in on plan
2. **Start Phase 1** - Begin with analysis patterns
3. **Track Progress** - Monitor completion and blockers
4. **Adjust as Needed** - Update roadmap based on learnings
5. **Celebrate Milestones** - Recognize progress

## Notes

- Roadmaps should be living documents, updated regularly
- Prioritization may change as you learn more
- Dependencies between patterns must be respected
- Feasibility assessment is critical before proceeding
- Stakeholder collaboration is essential for success
- Progress tracking helps identify issues early
