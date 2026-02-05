# Decomposition Planning and Roadmap Skill

A skill for creating structured decomposition plans and roadmaps to guide the migration from monolithic to distributed architectures.

## What This Skill Does

This skill analyzes codebases and decomposition progress to:

1. **Assess current state** of decomposition efforts
2. **Identify patterns to apply** based on what's been done
3. **Prioritize work** by risk, value, and dependencies
4. **Create phased roadmaps** with milestones and timelines
5. **Generate architecture stories** for tracking work
6. **Track progress** through decomposition phases
7. **Identify blockers** and dependencies

## When to Use This Skill

This skill is applied when you:

- Ask to create a decomposition roadmap
- Request migration planning or strategy
- Need help prioritizing decomposition work
- Want to track decomposition progress
- Ask about decomposition planning
- Discuss architectural roadmaps
- Need structured approach to decomposition

## Key Features

### Current State Assessment

Evaluates what's already been done:

- Checks component inventory completion
- Reviews common component analysis
- Assesses component structure
- Reviews dependency analysis
- Checks domain identification status
- Assesses service extraction progress

### Pattern-Based Planning

Plans based on the six decomposition patterns:

1. Identify and Size Components
2. Gather Common Domain Components
3. Flatten Components
4. Determine Component Dependencies
5. Create Component Domains
6. Create Domain Services

### Prioritization Framework

Prioritizes work using:

- **Risk Assessment**: Low/Medium/High risk
- **Value Assessment**: High/Medium/Low value
- **Dependency Analysis**: Independent/Dependent/Blocking
- **Priority Scoring**: Calculated priority scores

### Phased Roadmap Creation

Creates structured roadmaps with:

- **Phase Definition**: Analysis, Organization, Extraction
- **Milestone Setting**: Clear completion markers
- **Timeline Estimation**: Realistic timeframes
- **Deliverable Definition**: Expected outputs

## Files Included

### SKILL.md (Main Skill)

The primary skill file containing:

- Current state assessment methodology
- Pattern identification process
- Prioritization framework
- Roadmap creation techniques
- Architecture story generation
- Progress tracking approach
- Output format templates

### QUICK-REFERENCE.md (Quick Lookup)

Fast reference for common scenarios:

- Pattern sequence
- Prioritization matrix
- Roadmap templates
- Story templates
- Progress tracking checklist

### README.md (This File)

Complete documentation including:

- What the skill does
- When to use it
- Usage examples
- Core concepts
- Integration with other skills

## Usage Examples

### Example 1: Create Complete Roadmap

```
User: "Create a decomposition roadmap for this codebase"

The skill will:
1. Assess current state
2. Identify patterns to apply
3. Prioritize work
4. Create phased roadmap
5. Generate architecture stories
6. Estimate timeline
```

**Output**:

```markdown
# Decomposition Roadmap

## Current State Assessment

- ✅ Components identified and sized
- ⚠️ Common components detected (in progress)
- ❌ Component flattening (not started)
- ❌ Dependency analysis (not started)

## Phased Roadmap

### Phase 1: Analysis & Preparation (Weeks 1-4)

- Complete component flattening
- Perform dependency analysis
- Refactor oversized components

### Phase 2: Domain Organization (Weeks 5-8)

- Identify domains
- Group components
- Refactor namespaces

### Phase 3: Service Extraction (Weeks 9-16)

- Extract domain services
- Define API boundaries
- Deploy services
```

### Example 2: Prioritize Work

```
User: "Prioritize decomposition work based on component analysis"

The skill will:
1. Review component inventory
2. Assess risk and value
3. Calculate priority scores
4. Create prioritized plan
```

**Output**:

```markdown
## Prioritized Work Plan

### High Priority

1. Complete Component Flattening (Priority: 9/10)
   - Risk: Low, Value: High
   - Effort: 2 weeks

2. Dependency Analysis (Priority: 8/10)
   - Risk: Low, Value: High
   - Effort: 1 week
```

### Example 3: Track Progress

```
User: "Show decomposition progress"

The skill will:
1. Check pattern completion
2. Review story status
3. Calculate metrics
4. Identify blockers
```

**Output**:

```markdown
## Progress Dashboard

### Pattern Completion

- ✅ Pattern 1: Complete (100%)
- ✅ Pattern 2: Complete (100%)
- ⚠️ Pattern 3: In Progress (60%)
- ❌ Pattern 4: Not Started (0%)

### Key Metrics

- Components Identified: 75
- Components Refactored: 45 (60%)
- Domains Created: 0
- Services Extracted: 0
```

## Core Concepts

### Decomposition Pattern Sequence

The six patterns should be applied in sequence:

1. **Identify and Size Components** → Foundation
2. **Gather Common Domain Components** → Find duplicates
3. **Flatten Components** → Clean structure
4. **Determine Component Dependencies** → Assess feasibility
5. **Create Component Domains** → Group components
6. **Create Domain Services** → Extract services

### Phased Approach

Decomposition follows three main phases:

**Phase 1: Analysis & Preparation**

- Component identification and sizing
- Common component detection
- Component flattening
- Dependency analysis

**Phase 2: Domain Organization**

- Domain identification
- Component grouping
- Namespace refactoring

**Phase 3: Service Extraction**

- Domain service creation
- Service extraction
- API boundary definition

### Prioritization Factors

When prioritizing work, consider:

- **Risk**: How risky is this work?
- **Value**: How valuable is this work?
- **Dependencies**: What must be done first?
- **Complexity**: How complex is this work?

## How to Use

### Quick Start

Request creation of a plan:

```
"Create a decomposition roadmap for this codebase"
"Prioritize decomposition work based on component analysis"
"Create a phased decomposition plan"
"Show decomposition progress"
```

### Step-by-Step Usage

#### 1. Assess Current State

Start by understanding what's been done:

```
User: "What's the current state of decomposition?"
```

This will:

- Check what patterns are complete
- Identify what's in progress
- Find what hasn't started

#### 2. Create Roadmap

Build a structured plan:

```
User: "Create a decomposition roadmap"
```

This will:

- Identify patterns to apply
- Prioritize work
- Create phased roadmap
- Generate architecture stories

#### 3. Prioritize Work

Focus on high-priority items:

```
User: "Prioritize decomposition work"
```

This will:

- Assess risk and value
- Calculate priority scores
- Create prioritized plan

#### 4. Track Progress

Monitor progress over time:

```
User: "Show decomposition progress"
```

This will:

- Check pattern completion
- Review story status
- Calculate metrics
- Identify blockers

### Advanced Usage

#### Custom Phases

Define custom phases:

```
User: "Create roadmap with custom phases: Analysis, Refactoring, Extraction, Optimization"
```

#### Risk-Based Prioritization

Focus on risk:

```
User: "Prioritize work by risk, starting with lowest risk"
```

#### Timeline Estimation

Get time estimates:

```
User: "Estimate timeline for complete decomposition"
```

## Output Format

The skill generates structured output:

### Decomposition Roadmap

```markdown
# Decomposition Roadmap

## Current State Assessment

[What's been done, what's remaining]

## Phased Roadmap

### Phase 1: Analysis & Preparation

[Patterns, milestones, timeline]

### Phase 2: Domain Organization

[Patterns, milestones, timeline]

### Phase 3: Service Extraction

[Patterns, milestones, timeline]
```

### Prioritized Work Plan

```markdown
## Prioritized Work Plan

### High Priority

1. [Work item] (Priority: X/10)
   - Risk: Low/Medium/High
   - Value: High/Medium/Low
   - Effort: X weeks

### Medium Priority

[Similar format]
```

### Architecture Stories

```markdown
## Architecture Stories

### Story 1: [Title]

**As an architect**, I need to [action]
to support [architectural characteristic]
so that [benefit].

**Acceptance Criteria**:

- [ ] Criterion 1
- [ ] Criterion 2

**Estimate**: X story points
**Priority**: High/Medium/Low
**Dependencies**: [List]
```

### Progress Dashboard

```markdown
## Progress Dashboard

### Pattern Completion Status

[Table showing pattern status and progress]

### Story Completion Status

[Completed/In Progress/Not Started counts]

### Key Metrics

[Components, domains, services metrics]
```

## Integration with Other Skills

This skill coordinates the use of other decomposition skills:

1. **Component Identification & Sizing** → Provides foundation data
2. **Common Domain Component Detection** → Identifies consolidation work
3. **Component Flattening** → Prepares for domain grouping
4. **Component Dependency Analysis** → Validates feasibility
5. **Domain Identification & Grouping** → Enables service extraction
6. **Decomposition Planning & Roadmap** (this skill) → Coordinates everything

Use this skill to orchestrate the entire decomposition effort.

## Installation

This skill is installed at the project level:

```
skills/decomposition-planning-roadmap/
```

This means it's:

- **Shared with the repository**: Anyone cloning this repo gets the skill
- **Version controlled**: Changes are tracked in git
- **Project-specific**: Can be customized for this codebase

The skill will be automatically discovered and used when appropriate based on the description in the frontmatter.

## Customization

### For Project-Specific Patterns

Document your project's decomposition approach:

```
skills/decomposition-planning-roadmap/
└── project-approach.md  # Document project-specific patterns
```

### Custom Phases

Modify phase definitions in SKILL.md:

```markdown
## Custom Phases

For this project:

- Phase 1: Analysis (2 weeks)
- Phase 2: Refactoring (4 weeks)
- Phase 3: Extraction (8 weeks)
- Phase 4: Optimization (2 weeks)
```

### Custom Prioritization

Modify prioritization formula:

```markdown
## Custom Prioritization

For this project:
Priority = (Value × 4) - (Risk × 2) - (Dependencies × 1)
```

## Best Practices

### Do's ✅

- Start with analysis patterns (Patterns 1-4)
- Prioritize low-risk, high-value work
- Create architecture stories for tracking
- Set clear milestones and success criteria
- Track progress regularly
- Adjust roadmap based on learnings
- Collaborate with stakeholders on priorities
- Respect pattern dependencies

### Don'ts ❌

- Don't skip analysis patterns
- Don't start service extraction too early
- Don't ignore dependencies between patterns
- Don't create unrealistic timelines
- Don't skip progress tracking
- Don't forget to validate with stakeholders
- Don't proceed without feasibility assessment
- Don't create roadmap without current state assessment

## Common Patterns

### Typical Roadmap Structure

**Small Project** (3-6 months):

- Phase 1: Analysis (1 month)
- Phase 2: Refactoring (2 months)
- Phase 3: Extraction (2-3 months)

**Medium Project** (6-12 months):

- Phase 1: Analysis & Preparation (2 months)
- Phase 2: Domain Organization (2 months)
- Phase 3: Service Extraction (4-6 months)
- Phase 4: Optimization (2 months)

**Large Project** (12+ months):

- Phase 1: Analysis & Preparation (3-4 months)
- Phase 2: Domain Organization (3-4 months)
- Phase 3: Service Extraction (6-8 months)
- Phase 4: Optimization (2-3 months)

### Prioritization Matrix

```
High Value, Low Risk    | High Value, High Risk
(Do First)              | (Do Carefully)
────────────────────────┼──────────────────────
Low Value, Low Risk     | Low Value, High Risk
(Do Later)              | (Avoid/Defer)
```

## Troubleshooting

### Roadmap Too Aggressive

**Issue**: Timeline seems unrealistic

**Solution**:

- Add buffer time to estimates
- Break work into smaller chunks
- Reassess complexity
- Consider dependencies more carefully

### Unclear Priorities

**Issue**: Hard to prioritize work

**Solution**:

- Use prioritization matrix
- Assess risk and value objectively
- Get stakeholder input
- Consider dependencies

### Progress Stalled

**Issue**: Not making progress

**Solution**:

- Identify blockers
- Reassess priorities
- Break work into smaller pieces
- Get help with blockers

## References

This skill is based on:

- **Software Architecture: The Hard Parts** by Neal Ford, Mark Richards, Pramod Sadalage, Zhamak Dehghani
- **Component-Based Decomposition Patterns** (Chapter 5)
- **Fundamentals of Software Architecture** by Mark Richards & Neal Ford
- **Agile Project Management** principles

## Contributing

To improve this skill:

1. Add more roadmap templates
2. Expand prioritization frameworks
3. Add progress tracking examples
4. Document new patterns or approaches
5. Share real-world case studies

## Version

**Version**: 1.0.0  
**Created**: 2026-02-05  
**Based on**: Component-Based Decomposition Patterns from "Software Architecture: The Hard Parts"

---

## Quick Start

To use this skill immediately:

```
User: "Create a decomposition roadmap for this codebase"
User: "Prioritize decomposition work based on component analysis"
User: "Create a phased decomposition plan"
User: "Show decomposition progress"
```

This skill will automatically be applied to provide comprehensive decomposition planning and roadmap creation.
