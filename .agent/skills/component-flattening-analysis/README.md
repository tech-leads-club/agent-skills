# Component Flattening Analysis Skill

A skill for identifying and fixing component hierarchy issues by detecting orphaned classes in root namespaces and ensuring components exist only as leaf nodes.

## What This Skill Does

This skill analyzes codebases to:

1. **Map component structure** to identify namespace hierarchies
2. **Detect orphaned classes** in root namespaces
3. **Identify component nesting** (components built on components)
4. **Analyze flattening options** (consolidate vs split vs extract shared)
5. **Create flattening plans** with refactoring steps
6. **Ensure components are leaf nodes** only
7. **Remove hierarchy violations** from component structure

## When to Use This Skill

This skill is applied when you:

- Ask to find orphaned classes in root namespaces
- Request component flattening analysis
- Need to identify component hierarchy issues
- Want to clean up component structure
- Ask about component nesting or hierarchy
- Plan to prepare components for domain grouping
- Discuss component structure cleanup

## Key Features

### Orphaned Class Detection

Identifies source files in root namespaces:

- Scans root namespaces for source files
- Classifies orphaned classes (shared/domain/mixed)
- Assesses impact and dependencies
- Flags hierarchy violations

### Flattening Strategy Analysis

Analyzes multiple flattening options:

1. **Consolidate Down**: Move leaf code into root namespace
2. **Split Up**: Move root code into new leaf nodes
3. **Extract Shared**: Move shared code to `.shared` component

### Component Structure Validation

Ensures components follow rules:

- Components exist only as leaf nodes
- No orphaned classes in root namespaces
- Clear component boundaries
- Proper namespace hierarchy

## Files Included

### SKILL.md (Main Skill)

The primary skill file containing:

- Component hierarchy detection methodology
- Orphaned class identification process
- Flattening strategy analysis
- Refactoring plan creation
- Output format templates
- Implementation notes for different languages
- Fitness function examples

### QUICK-REFERENCE.md (Quick Lookup)

Fast reference for common scenarios:

- Component definition rules
- Orphaned class detection
- Flattening strategies
- Common patterns
- Output template

### README.md (This File)

Complete documentation including:

- What the skill does
- When to use it
- Usage examples
- Core concepts
- Integration with other skills

## Usage Examples

### Example 1: Find Orphaned Classes

```
User: "Find orphaned classes in root namespaces"

The skill will:
1. Map component namespace structure
2. Identify root namespaces
3. Find source files in root namespaces
4. Classify orphaned classes
5. Create report with recommendations
```

**Output**:

```markdown
## Orphaned Classes Analysis

### Root Namespace: ss.survey

**Orphaned Files** (5 files):

- Survey.js (domain code)
- SurveyProcessor.js (domain code)
- SurveyValidator.js (shared code)

**Issue**: Root namespace contains code but is extended by leaf component

**Recommendation**: Consolidate templates into root namespace
```

### Example 2: Flatten Components

```
User: "Flatten component hierarchies"

The skill will:
1. Identify all hierarchy issues
2. Analyze flattening options
3. Select best strategy for each
4. Create refactoring plan
5. Estimate effort
```

**Output**:

```markdown
## Flattening Plan

### Priority: High

**ss.survey** → Consolidate Down

- Move 7 files from templates to root
- Effort: 2-3 days
- Risk: Low

**ss.ticket** → Split Up

- Create maintenance, completion, shared components
- Effort: 1 week
- Risk: Medium
```

### Example 3: Component Structure Analysis

```
User: "Analyze component structure for hierarchy issues"

The skill will:
1. Map namespace hierarchies
2. Identify root namespaces with code
3. Find components built on components
4. Flag violations
5. Provide recommendations
```

**Output**:

```markdown
## Component Hierarchy Issues

| Root Namespace | Orphaned Files | Leaf Components   | Issue                | Recommendation   |
| -------------- | -------------- | ----------------- | -------------------- | ---------------- |
| ss.survey      | 5              | 1 (templates)     | Has orphaned classes | Consolidate down |
| ss.ticket      | 45             | 2 (assign, route) | Large orphaned code  | Split up         |
```

## Core Concepts

### Component Definition

A **component** is identified by a **leaf node** in directory/namespace structure:

- **Leaf Node**: Deepest directory containing source files
- **Component**: Source code files in leaf node namespace
- **Subdomain**: Parent namespace that has been extended

**Key Rule**: Components exist only as leaf nodes. If a namespace is extended, the parent becomes a subdomain, not a component.

### Root Namespace

A **root namespace** is a namespace node that has been extended:

- **Extended**: Another namespace node added below it
- **Example**: `ss.survey` extended to `ss.survey.templates`
- **Result**: `ss.survey` becomes a root namespace (subdomain)

### Orphaned Classes

**Orphaned classes** are source files in root namespaces:

- **Location**: Root namespace (non-leaf node)
- **Problem**: No definable component associated with them
- **Solution**: Move to leaf node namespace (component)

### Flattening Strategies

**Consolidate Down**:

- Move code from leaf nodes into root namespace
- Makes root namespace the component
- **Use when**: Leaf nodes are small, related functionality

**Split Up**:

- Move code from root namespace into new leaf nodes
- Creates multiple components from root
- **Use when**: Root namespace has distinct functional areas

**Extract Shared**:

- Move shared code to `.shared` component
- Keep domain code in root or split
- **Use when**: Root namespace has shared utilities

## How to Use

### Quick Start

Request analysis of your codebase:

```
"Find orphaned classes in root namespaces"
"Flatten component hierarchies"
"Identify components that need flattening"
"Analyze component structure for hierarchy issues"
```

### Step-by-Step Usage

#### 1. Find Orphaned Classes

Start by identifying hierarchy issues:

```
User: "Find orphaned classes in root namespaces"
```

This will:

- Map component structure
- Identify root namespaces
- Find orphaned classes
- Classify and assess impact

#### 2. Analyze Flattening Options

Determine best strategy:

```
User: "What flattening strategy should I use for ss.survey?"
```

This will:

- Analyze consolidation option
- Analyze splitting option
- Analyze shared code extraction
- Recommend best approach

#### 3. Create Flattening Plan

Get actionable refactoring plan:

```
User: "Create a plan to flatten component hierarchies"
```

This will:

- Select flattening strategies
- Create refactoring steps
- Estimate effort and risk
- Prioritize work

#### 4. Execute Flattening

Perform the refactoring:

```
User: "Flatten the survey component hierarchy"
```

This will:

- Move files to target namespaces
- Update imports and references
- Update namespace declarations
- Verify changes

### Advanced Usage

#### Custom Flattening Rules

Specify flattening preferences:

```
User: "Flatten components, preferring consolidation over splitting"
```

#### Specific Namespace Analysis

Focus on specific namespace:

```
User: "Analyze ss.ticket namespace for flattening"
```

#### Shared Code Detection

Identify shared code patterns:

```
User: "Find shared code that should be extracted to .shared components"
```

## Output Format

The skill generates structured output:

### Orphaned Classes Report

```markdown
## Orphaned Classes Analysis

### Root Namespace: ss.survey

**Status**: ⚠️ Has Orphaned Classes

**Orphaned Files** (5 files):

- Survey.js (domain code)
- SurveyProcessor.js (domain code)
- SurveyValidator.js (shared code)

**Leaf Components**:

- ss.survey.templates (7 files)

**Recommendation**: Consolidate templates into root namespace
```

### Component Hierarchy Issues

```markdown
## Component Hierarchy Issues

| Root Namespace | Orphaned Files | Leaf Components   | Issue                | Recommendation   |
| -------------- | -------------- | ----------------- | -------------------- | ---------------- |
| ss.survey      | 5              | 1 (templates)     | Has orphaned classes | Consolidate down |
| ss.ticket      | 45             | 2 (assign, route) | Large orphaned code  | Split up         |
```

### Flattening Plan

```markdown
## Flattening Plan

### Priority: High

**ss.survey** → Consolidate Down

- Move 7 files from templates to root
- Update imports
- Remove templates directory
- Effort: 2-3 days
- Risk: Low
```

## Integration with Other Skills

This skill is part of a decomposition pattern sequence:

1. **Component Identification & Sizing** → Understand what you have
2. **Common Domain Component Detection** → Find duplicates
3. **Component Flattening** (this skill) → Clean structure
4. **Component Dependency Analysis** → Assess coupling
5. **Domain Identification & Grouping** → Group into domains
6. **Decomposition Planning** → Coordinate everything

Use this skill after gathering common components and before dependency analysis.

## Installation

This skill is installed at the project level:

```
skills/component-flattening-analysis/
```

This means it's:

- **Shared with the repository**: Anyone cloning this repo gets the skill
- **Version controlled**: Changes are tracked in git
- **Project-specific**: Can be customized for this codebase

The skill will be automatically discovered and used when appropriate based on the description in the frontmatter.

## Customization

### For Project-Specific Patterns

Document your project's component patterns:

```
skills/component-flattening-analysis/
└── project-patterns.md  # Document project-specific patterns
```

### For Framework-Specific Analysis

Add framework-specific patterns:

```markdown
## Framework: NestJS

**Component Pattern**: `@Injectable()` classes in modules
**Flattening**: Move nested module classes to parent module
**Shared Code**: Extract to `shared/` directory
```

### Custom Flattening Rules

Modify flattening preferences in SKILL.md:

```markdown
## Custom Flattening Rules

For this project:

- Always prefer consolidation over splitting
- Extract shared code to `.shared` components
- Maximum 10 files per component before splitting
```

## Fitness Functions

After flattening components, create automated checks:

### No Source Code in Root Namespaces

```javascript
// Alert if source code exists in root namespace
function checkRootNamespaceCode(namespaces, sourceFiles) {
  const violations = []

  namespaces.forEach((ns) => {
    const hasChildren = namespaces.some((n) => n.startsWith(ns + '.') || n.startsWith(ns + '/'))

    if (hasChildren) {
      const files = sourceFiles.filter((f) => f.namespace === ns)
      if (files.length > 0) {
        violations.push({
          namespace: ns,
          files: files.map((f) => f.name),
          issue: 'Root namespace contains source files',
        })
      }
    }
  })

  return violations
}
```

### Components Only as Leaf Nodes

```javascript
// Ensure components exist only as leaf nodes
function validateComponentStructure(namespaces, sourceFiles) {
  const violations = []

  const leafNodes = namespaces.filter((ns) => {
    return !namespaces.some((n) => n.startsWith(ns + '.') || n.startsWith(ns + '/'))
  })

  sourceFiles.forEach((file) => {
    if (!leafNodes.includes(file.namespace)) {
      violations.push({
        file: file.name,
        namespace: file.namespace,
        issue: 'Source file not in leaf node',
      })
    }
  })

  return violations
}
```

## Best Practices

### Do's ✅

- Ensure components exist only as leaf nodes
- Remove orphaned classes from root namespaces
- Choose flattening strategy based on functionality
- Consolidate when functionality is related
- Split when functionality is distinct
- Extract shared code to `.shared` components
- Update all references after flattening
- Verify changes with tests

### Don'ts ❌

- Don't leave orphaned classes in root namespaces
- Don't create components on top of other components
- Don't skip updating imports after moving files
- Don't flatten without analyzing impact
- Don't mix flattening strategies inconsistently
- Don't ignore shared code when flattening
- Don't skip testing after refactoring

## Common Patterns

### Pattern 1: Simple Consolidation

**Before**:

```
ss.survey/
├── Survey.js           ← Orphaned
└── templates/          ← Component
    └── Template.js
```

**After**:

```
ss.survey/              ← Component (leaf node)
├── Survey.js
└── Template.js
```

### Pattern 2: Functional Split

**Before**:

```
ss.ticket/              ← Root namespace
├── Ticket.js           ← Orphaned (45 files)
├── assign/             ← Component
└── route/              ← Component
```

**After**:

```
ss.ticket/              ← Subdomain
├── maintenance/        ← Component
├── completion/         ← Component
├── assign/             ← Component
└── route/              ← Component
```

### Pattern 3: Shared Code Extraction

**Before**:

```
ss.survey/              ← Root namespace
├── Survey.js           ← Domain code
├── SurveyValidator.js  ← Shared code
└── templates/          ← Component
```

**After**:

```
ss.survey/              ← Component
├── Survey.js
└── shared/             ← Component
    └── SurveyValidator.js
```

## Troubleshooting

### Too Many Orphaned Classes

**Issue**: Found many orphaned classes

**Solution**:

- Prioritize by impact
- Start with high-priority namespaces
- Flatten incrementally
- Consider splitting large root namespaces

### Unclear Flattening Strategy

**Issue**: Not sure which strategy to use

**Solution**:

- Analyze functionality similarity
- Consider component size
- Assess coupling impact
- Choose simplest approach that works

### Breaking References

**Issue**: Moving files breaks imports

**Solution**:

- Update all imports before moving
- Use IDE refactoring tools
- Run tests after each move
- Update namespace declarations

## References

This skill is based on:

- **Software Architecture: The Hard Parts** by Neal Ford, Mark Richards, Pramod Sadalage, Zhamak Dehghani
- **Flatten Components Pattern** (Chapter 5)
- **Fundamentals of Software Architecture** by Mark Richards & Neal Ford

## Contributing

To improve this skill:

1. Add language-specific flattening patterns
2. Expand framework-specific component detection
3. Add more flattening strategy examples
4. Document new anti-patterns or red flags
5. Share real-world case studies

## Version

**Version**: 1.0.0  
**Created**: 2026-02-05  
**Based on**: Flatten Components Pattern from "Software Architecture: The Hard Parts"

---

## Quick Start

To use this skill immediately:

```
User: "Find orphaned classes in root namespaces"
User: "Flatten component hierarchies"
User: "Identify components that need flattening"
User: "Analyze component structure for hierarchy issues"
```

This skill will automatically be applied to provide comprehensive component flattening analysis and recommendations.
