# Common Domain Component Detection Skill

A skill for identifying duplicate domain functionality across components and suggesting consolidation opportunities to reduce duplication and improve maintainability.

## What This Skill Does

This skill analyzes codebases to:

1. **Identify common namespace patterns** (e.g., `*.notification`, `*.audit`)
2. **Detect shared classes** used across multiple components
3. **Analyze functionality similarity** between components
4. **Assess coupling impact** before recommending consolidation
5. **Suggest consolidation approaches** (shared service, shared library, or merge)
6. **Provide consolidation plans** with step-by-step guidance
7. **Calculate coupling metrics** to evaluate consolidation safety

## When to Use This Skill

This skill is applied when you:

- Ask to find common domain functionality
- Request identification of duplicate domain logic
- Need help detecting shared classes across components
- Want to analyze consolidation opportunities
- Ask about reducing code duplication
- Discuss component consolidation strategies
- Plan to merge similar components

## Key Features

### Domain vs Infrastructure Distinction

This skill focuses on **domain functionality** (business logic), not infrastructure:

- **Domain**: Notification, auditing, validation, formatting (common to some processes)
- **Infrastructure**: Logging, metrics, security (common to all processes)

### Multiple Detection Strategies

Uses multiple approaches to find common functionality:

1. **Namespace Pattern Detection**: Finds components with common leaf node names
2. **Shared Class Detection**: Identifies classes used across multiple components
3. **Functionality Analysis**: Examines code to verify similarity

### Coupling Impact Analysis

Before recommending consolidation, analyzes:

- Current coupling levels (afferent coupling - CA)
- Estimated coupling after consolidation
- Whether consolidation creates coupling bottlenecks
- Safety of consolidation from coupling perspective

### Multiple Consolidation Approaches

Recommends appropriate approach based on context:

- **Shared Service**: For frequently changing, complex operations
- **Shared Library**: For stable, simple utilities
- **Component Merge**: For highly related functionality

## Files Included

### SKILL.md (Main Skill)

The primary skill file containing:

- Common domain pattern detection methodology
- Shared class detection process
- Functionality similarity analysis
- Coupling impact assessment framework
- Consolidation approach recommendations
- Output format templates
- Implementation notes for different languages
- Fitness function examples

### QUICK-REFERENCE.md (Quick Lookup)

Fast reference for common scenarios:

- Common patterns to look for
- Detection strategies
- Coupling analysis quick check
- Consolidation decision tree
- Output template

### README.md (This File)

Complete documentation including:

- What the skill does
- When to use it
- Usage examples
- Core concepts
- Integration with other skills

## Usage Examples

### Example 1: Find Common Functionality

```
User: "Find common domain functionality across components"

The skill will:
1. Scan component namespaces for common patterns
2. Detect shared classes used across components
3. Analyze functionality similarity
4. Calculate coupling impact
5. Suggest consolidation opportunities
```

**Output**:

```markdown
## Common Domain Components Found

### Notification Functionality

**Components**:

- services/customer/notification
- services/ticket/notification
- services/survey/notification

**Functionality**: All send emails to customers
**Consolidation Feasibility**: ✅ High
**Coupling Impact**: No increase (CA: 5 → 5)

**Recommendation**: Consolidate into `services/notification`
```

### Example 2: Detect Duplicate Notification Logic

```
User: "Are there multiple notification components that should be consolidated?"

The skill will:
1. Find all notification-related components
2. Analyze their functionality and dependencies
3. Calculate coupling impact if consolidated
4. Recommend consolidation approach
```

**Output**:

```markdown
## Notification Components Analysis

**Found 3 notification components**:

- CustomerNotification (used by 2 components)
- TicketNotification (used by 2 components)
- SurveyNotification (used by 1 component)

**Coupling Analysis**:

- Before consolidation: CA = 5 total
- After consolidation: CA = 5 (no increase)
- Verdict: ✅ Safe to consolidate

**Recommendation**: Merge into single NotificationService
```

### Example 3: Analyze Shared Classes

```
User: "Find classes that are shared across multiple components"

The skill will:
1. Scan imports/dependencies in all components
2. Identify classes used by multiple components
3. Classify as domain vs infrastructure
4. Suggest consolidation or shared library approach
```

**Output**:

```markdown
## Shared Classes Found

**Domain Classes** (candidates for consolidation):

- SMTPConnection: Used by 5 components
- AuditLogger: Used by 8 components
- DataFormatter: Used by 3 components

**Recommendation**: Extract to shared service or library
```

## Core Concepts

### Domain vs Infrastructure Functionality

**Domain Functionality** (candidates for consolidation):

- Business processing logic
- Common to **some** processes, not all
- Examples: Customer notification, ticket auditing, data validation
- Usually has business context

**Infrastructure Functionality** (not consolidated here):

- Operational concerns
- Common to **all** processes
- Examples: Logging, authentication, database connections
- Usually technical, not business-focused

### Common Domain Patterns

Common domain functionality often appears as:

1. **Namespace Patterns**: Components ending in same leaf node
   - `*.notification`, `*.audit`, `*.validation`, `*.formatting`
   - Example: `TicketNotification`, `BillingNotification`, `SurveyNotification`

2. **Shared Classes**: Same class used across multiple components
   - Example: `SMTPConnection` used by 5 different components
   - Example: `AuditLogger` used by multiple domain components

3. **Similar Functionality**: Different components doing similar things
   - Example: Multiple components sending emails with slight variations
   - Example: Multiple components writing audit logs

### Consolidation Approaches

**Shared Service**:

- Common functionality becomes a separate service
- Other components call this service
- **Use when**: Frequently changing logic, complex operations, needs independent scaling

**Shared Library**:

- Common code packaged as library (JAR, DLL, npm package)
- Components import and use the library
- **Use when**: Stable functionality, simple utilities, compile-time dependency acceptable

**Component Consolidation**:

- Merge multiple components into one
- **Use when**: Highly related functionality, low coupling impact

### Coupling Analysis

**Afferent Coupling (CA)**: Number of components that depend on this component

**Before Consolidation**:

- Component A: CA = 2
- Component B: CA = 2
- Component C: CA = 1
- **Total CA**: 5

**After Consolidation**:

- Consolidated Component: CA = 5
- **Total CA**: 5 (same!)

**Verdict**: ✅ Safe to consolidate (no coupling increase)

## How to Use

### Quick Start

Request analysis of your codebase:

```
"Find common domain functionality across components"
"Identify duplicate domain logic that should be consolidated"
"Detect shared classes used across multiple components"
"Analyze consolidation opportunities for common components"
```

### Step-by-Step Usage

#### 1. Find Common Patterns

Start by identifying common namespace patterns:

```
User: "Find components with common functionality patterns"
```

This will:

- Scan all component namespaces
- Identify common leaf node names
- Group similar components
- Filter out infrastructure patterns

#### 2. Analyze Functionality

Examine if components are truly similar:

```
User: "Are the notification components similar enough to consolidate?"
```

This will:

- Examine source code of each component
- Identify similarities and differences
- Assess if differences can be abstracted
- Determine consolidation feasibility

#### 3. Assess Coupling Impact

Before consolidating, check coupling impact:

```
User: "What's the coupling impact of consolidating notification components?"
```

This will:

- Calculate current coupling (CA) for each component
- Estimate consolidated coupling
- Compare total coupling levels
- Evaluate if consolidation is safe

#### 4. Get Consolidation Plan

Request actionable consolidation plan:

```
User: "Create a plan to consolidate the notification components"
```

This will:

- Recommend consolidation approach
- Provide step-by-step plan
- Estimate expected benefits
- Identify risks and mitigation

### Advanced Usage

#### Custom Exclusion List

Exclude certain patterns from analysis:

```
User: "Find common domain components, but exclude audit components"
```

#### Language-Specific Analysis

For framework-specific analysis:

```
User: "Find shared classes in the services/ directory"
```

#### Coupling Threshold

Set custom coupling thresholds:

```
User: "Only suggest consolidation if coupling increase is less than 3"
```

## Output Format

The skill generates structured output:

### Common Domain Components Report

```markdown
## Common Domain Components Found

### Notification Functionality

**Components**:

- services/customer/notification (2% - 1,433 statements)
- services/ticket/notification (2% - 1,765 statements)
- services/survey/notification (2% - 1,299 statements)

**Shared Classes**: SMTPConnection (used by all 3)

**Functionality Analysis**:

- All send emails to customers
- Differences: Content/templates, triggers
- Consolidation Feasibility: ✅ High

**Coupling Analysis**:

- Before: CA = 2 + 2 + 1 = 5
- After: CA = 5 (no increase)
- Verdict: ✅ Safe to consolidate

**Recommendation**: Consolidate into `services/notification`
```

### Consolidation Opportunities Table

```markdown
## Consolidation Opportunities

| Common Functionality | Components   | Current CA | After CA | Feasibility | Recommendation                |
| -------------------- | ------------ | ---------- | -------- | ----------- | ----------------------------- |
| Notification         | 3 components | 5          | 5        | ✅ High     | Consolidate to shared service |
| Audit                | 3 components | 8          | 12       | ⚠️ Medium   | Consolidate, monitor coupling |
```

### Detailed Consolidation Plan

```markdown
## Consolidation Plan

### Priority: High

**Notification Components** → `services/notification`

**Steps**:

1. Create new `services/notification` component
2. Move common functionality from 3 components
3. Create abstraction for content/templates
4. Update dependent components
5. Remove old notification components

**Expected Impact**:

- Reduced duplication: 3 components → 1
- Coupling: No increase
- Maintenance: Easier
```

## Integration with Other Skills

This skill is part of a decomposition pattern sequence:

1. **Component Identification & Sizing** → Understand what you have
2. **Component Dependency Analysis** → Assess coupling
3. **Common Domain Component Detection** (this skill) → Find duplicates
4. **Component Flattening** → Remove orphaned classes
5. **Domain Identification** → Group components into domains
6. **Service Boundary Recommendation** → Plan service extraction

Use this skill after identifying components and before flattening.

## Installation

This skill is installed at the project level:

```
skills/common-domain-component-detection/
```

This means it's:

- **Shared with the repository**: Anyone cloning this repo gets the skill
- **Version controlled**: Changes are tracked in git
- **Project-specific**: Can be customized for this codebase

The skill will be automatically discovered and used when appropriate based on the description in the frontmatter.

## Customization

### For Project-Specific Patterns

Document your project's common patterns:

```
skills/common-domain-component-detection/
└── project-patterns.md  # Document project-specific patterns
```

### For Framework-Specific Analysis

Add framework-specific detection patterns:

```markdown
## Framework: NestJS

**Common Patterns**:

- `*NotificationService` - Notification components
- `*AuditService` - Audit components
- `*ValidationService` - Validation components
```

### Custom Exclusion Lists

Modify exclusion lists in SKILL.md:

```markdown
## Custom Exclusions

For this project, exclude:

- `*.util` (infrastructure)
- `*.helper` (infrastructure)
- `*.common` (infrastructure)
```

## Fitness Functions

After identifying common components, create automated checks:

### Common Pattern Detection

```javascript
// Alert if new components with common patterns are created
function checkCommonPatterns(components) {
  const leafNodes = {}
  components.forEach((comp) => {
    const leaf = extractLeafNode(comp.namespace)
    if (!leafNodes[leaf]) leafNodes[leaf] = []
    leafNodes[leaf].push(comp.name)
  })

  return Object.entries(leafNodes)
    .filter(([leaf, comps]) => comps.length > 1)
    .map(([leaf, comps]) => ({
      pattern: leaf,
      components: comps,
      suggestion: 'Consider consolidating',
    }))
}
```

### Shared Class Usage Alert

```javascript
// Alert if class is used by multiple components
function checkSharedClasses(components) {
  const classUsage = {}
  components.forEach((comp) => {
    comp.imports.forEach((imp) => {
      if (!classUsage[imp]) classUsage[imp] = []
      classUsage[imp].push(comp.name)
    })
  })

  return Object.entries(classUsage)
    .filter(([cls, users]) => users.length > 1)
    .map(([cls, users]) => ({
      class: cls,
      usedBy: users,
      suggestion: 'Consider extracting to shared component',
    }))
}
```

## Best Practices

### Do's ✅

- Distinguish domain from infrastructure functionality
- Analyze coupling impact before consolidating
- Consider both shared service and shared library approaches
- Look for namespace patterns AND shared classes
- Verify functionality is truly similar before consolidating
- Calculate coupling metrics (CA) before and after
- Monitor coupling after consolidation

### Don'ts ❌

- Don't consolidate infrastructure functionality (handled separately)
- Don't consolidate without analyzing coupling impact
- Don't assume all common patterns should be consolidated
- Don't ignore differences in functionality
- Don't consolidate if coupling increase is too high
- Don't mix domain and infrastructure in same analysis
- Don't consolidate just because names are similar

## Common Patterns to Look For

### High Consolidation Candidates

- **Notification**: `*.notification`, `*.notify`, `*.email`
- **Audit**: `*.audit`, `*.auditing`, `*.log`
- **Validation**: `*.validation`, `*.validate`, `*.validator`
- **Formatting**: `*.format`, `*.formatter`, `*.formatting`
- **Reporting**: `*.report`, `*.reporting` (if similar functionality)

### Low Consolidation Candidates

- **Infrastructure**: `*.util`, `*.helper`, `*.common` (usually infrastructure)
- **Different contexts**: Same name, different business meaning
- **High coupling risk**: Consolidation would create bottleneck

## Troubleshooting

### No Common Patterns Found

**Issue**: Skill doesn't find common patterns

**Solution**:

- Check if components follow expected naming patterns
- Verify leaf nodes are being extracted correctly
- Consider that your codebase may already be well-consolidated

### Too Many Consolidation Suggestions

**Issue**: Skill suggests consolidating everything

**Solution**:

- Review coupling impact analysis
- Check if suggestions account for coupling increase
- Verify infrastructure vs domain classification

### Consolidation Increases Coupling Too Much

**Issue**: Consolidation creates coupling bottleneck

**Solution**:

- Consider shared library instead of shared service
- Split consolidation into smaller steps
- Keep some duplication if it reduces coupling

## References

This skill is based on:

- **Software Architecture: The Hard Parts** by Neal Ford, Mark Richards, Pramod Sadalage, Zhamak Dehghani
- **Gather Common Domain Components Pattern** (Chapter 5)
- **Fundamentals of Software Architecture** by Mark Richards & Neal Ford

## Contributing

To improve this skill:

1. Add language-specific detection patterns
2. Expand framework-specific component detection
3. Add more consolidation approach examples
4. Document new anti-patterns or red flags
5. Share real-world case studies

## Version

**Version**: 1.0.0  
**Created**: 2026-02-05  
**Based on**: Gather Common Domain Components Pattern from "Software Architecture: The Hard Parts"

---

## Quick Start

To use this skill immediately:

```
User: "Find common domain functionality across components"
User: "Identify duplicate domain logic that should be consolidated"
User: "Detect shared classes used across multiple components"
User: "Analyze consolidation opportunities for common components"
```

This skill will automatically be applied to provide comprehensive analysis with actionable consolidation recommendations.
