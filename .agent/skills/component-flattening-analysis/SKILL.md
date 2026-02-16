---
name: component-flattening-analysis
description: Identifies and fixes component hierarchy issues by detecting orphaned classes in root namespaces and ensuring components exist only as leaf nodes. Use when analyzing component structure, finding orphaned classes, flattening component hierarchies, removing component nesting, or when the user asks about component flattening, orphaned classes, or component structure cleanup.
---

# Component Flattening Analysis

This skill identifies component hierarchy issues and ensures components exist only as leaf nodes in directory/namespace structures, removing orphaned classes from root namespaces.

## How to Use

### Quick Start

Request analysis of your codebase:

- **"Find orphaned classes in root namespaces"**
- **"Flatten component hierarchies"**
- **"Identify components that need flattening"**
- **"Analyze component structure for hierarchy issues"**

### Usage Examples

**Example 1: Find Orphaned Classes**

```
User: "Find orphaned classes in root namespaces"

The skill will:
1. Scan component namespaces for hierarchy issues
2. Identify orphaned classes in root namespaces
3. Detect components built on top of other components
4. Suggest flattening strategies
5. Create refactoring plan
```

**Example 2: Flatten Components**

```
User: "Flatten component hierarchies in this codebase"

The skill will:
1. Identify components with hierarchy issues
2. Analyze orphaned classes
3. Suggest consolidation or splitting strategies
4. Create refactoring plan
5. Estimate effort
```

**Example 3: Component Structure Analysis**

```
User: "Analyze component structure for hierarchy issues"

The skill will:
1. Map component namespace structure
2. Identify root namespaces with code
3. Find components built on components
4. Flag hierarchy violations
5. Provide recommendations
```

### Step-by-Step Process

1. **Scan Structure**: Map component namespace hierarchies
2. **Identify Issues**: Find orphaned classes and component nesting
3. **Analyze Options**: Determine flattening strategy (consolidate vs split)
4. **Create Plan**: Generate refactoring plan with steps
5. **Execute**: Refactor components to remove hierarchy

## When to Use

Apply this skill when:

- After gathering common domain components (Pattern 2)
- Before determining component dependencies (Pattern 4)
- When components have nested structures
- Finding orphaned classes in root namespaces
- Preparing for domain grouping
- Cleaning up component structure
- Ensuring components are leaf nodes only

## Core Concepts

### Component Definition

A **component** is identified by a **leaf node** in directory/namespace structure:

- **Leaf Node**: The deepest directory containing source files
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

**Example**:

```
ss.survey/              ← Root namespace (extended by .templates)
├── Survey.js           ← Orphaned class (in root namespace)
└── templates/          ← Component (leaf node)
    └── Template.js
```

### Flattening Strategies

**Strategy 1: Consolidate Down**

- Move code from leaf nodes into root namespace
- Makes root namespace the component
- Example: Move `ss.survey.templates` → `ss.survey`

**Strategy 2: Split Up**

- Move code from root namespace into new leaf nodes
- Creates new components from root namespace
- Example: Split `ss.survey` → `ss.survey.create` + `ss.survey.process`

**Strategy 3: Move Shared Code**

- Move shared code to dedicated component
- Creates `.shared` component
- Example: `ss.survey` shared code → `ss.survey.shared`

## Analysis Process

### Phase 1: Map Component Structure

Scan directory/namespace structure to identify hierarchy:

1. **Map Namespace Tree**
   - Build tree of all namespaces
   - Identify parent-child relationships
   - Mark leaf nodes (components)

2. **Identify Root Namespaces**
   - Find namespaces that have been extended
   - Mark as root namespaces (subdomains)
   - Note which namespaces extend them

3. **Locate Source Files**
   - Find all source files in each namespace
   - Map files to their namespace location
   - Identify files in root namespaces

**Example Structure Mapping**:

```markdown
## Component Structure Map
```

ss.survey/ ← Root namespace (extended)
├── Survey.js ← Orphaned class
├── SurveyProcessor.js ← Orphaned class
└── templates/ ← Component (leaf node)
├── EmailTemplate.js
└── SMSTemplate.js

ss.ticket/ ← Root namespace (extended)
├── Ticket.js ← Orphaned class
├── assign/ ← Component (leaf node)
│ └── TicketAssign.js
└── route/ ← Component (leaf node)
└── TicketRoute.js

```

```

### Phase 2: Identify Orphaned Classes

Find source files in root namespaces:

1. **Scan Root Namespaces**
   - Check each root namespace for source files
   - Identify files that are orphaned
   - Count orphaned files per root namespace

2. **Classify Orphaned Classes**
   - **Shared Code**: Common utilities, interfaces, abstract classes
   - **Domain Code**: Business logic that should be in component
   - **Mixed**: Combination of shared and domain code

3. **Assess Impact**
   - How many files are orphaned?
   - What functionality do they contain?
   - What components depend on them?

**Example Orphaned Class Detection**:

```markdown
## Orphaned Classes Found

### Root Namespace: ss.survey

**Orphaned Files** (5 files):

- Survey.js (domain code - survey creation)
- SurveyProcessor.js (domain code - survey processing)
- SurveyValidator.js (shared code - validation)
- SurveyFormatter.js (shared code - formatting)
- SurveyConstants.js (shared code - constants)

**Classification**:

- Domain Code: 2 files (should be in components)
- Shared Code: 3 files (should be in .shared component)

**Dependencies**: Used by ss.survey.templates component
```

### Phase 3: Analyze Flattening Options

Determine best flattening strategy for each root namespace:

1. **Option 1: Consolidate Down**
   - Move leaf node code into root namespace
   - Makes root namespace the component
   - **Use when**: Leaf nodes are small, related functionality

2. **Option 2: Split Up**
   - Move root namespace code into new leaf nodes
   - Creates multiple components from root
   - **Use when**: Root namespace has distinct functional areas

3. **Option 3: Move Shared Code**
   - Extract shared code to `.shared` component
   - Keep domain code in root or split
   - **Use when**: Root namespace has shared utilities

**Example Flattening Analysis**:

```markdown
## Flattening Options Analysis

### Root Namespace: ss.survey

**Current State**:

- Root namespace: 5 orphaned files
- Leaf component: ss.survey.templates (7 files)

**Option 1: Consolidate Down** ✅ Recommended

- Move templates code into ss.survey
- Result: Single component ss.survey
- Effort: Low (7 files to move)
- Rationale: Templates are small, related to survey functionality

**Option 2: Split Up**

- Create ss.survey.create (2 files)
- Create ss.survey.process (1 file)
- Create ss.survey.shared (3 files)
- Keep ss.survey.templates (7 files)
- Effort: High (multiple components to create)
- Rationale: More granular, but may be over-engineering

**Option 3: Move Shared Code**

- Create ss.survey.shared (3 shared files)
- Keep domain code in root (2 files)
- Keep ss.survey.templates (7 files)
- Effort: Medium
- Rationale: Separates shared from domain, but still has hierarchy
```

### Phase 4: Create Flattening Plan

Generate refactoring plan for each root namespace:

1. **Select Strategy**
   - Choose best flattening option
   - Consider effort, complexity, maintainability

2. **Plan Refactoring Steps**
   - List files to move
   - Identify target namespaces
   - Note dependencies to update

3. **Estimate Effort**
   - Time to refactor
   - Risk assessment
   - Testing requirements

**Example Flattening Plan**:

```markdown
## Flattening Plan

### Priority: High

**Root Namespace: ss.survey**

**Strategy**: Consolidate Down

**Steps**:

1. Move files from ss.survey.templates/ to ss.survey/
   - EmailTemplate.js
   - SMSTemplate.js
   - [5 more files]

2. Update imports in dependent components
   - Update references from ss.survey.templates._ to ss.survey._

3. Remove ss.survey.templates/ directory

4. Update namespace declarations
   - Change namespace from ss.survey.templates to ss.survey

5. Run tests to verify changes

**Effort**: 2-3 days
**Risk**: Low (templates are self-contained)
**Dependencies**: None
```

### Phase 5: Execute Flattening

Perform the refactoring:

1. **Move Files**
   - Move source files to target namespace
   - Update file paths and imports

2. **Update References**
   - Update imports in dependent components
   - Update namespace declarations
   - Update directory structure

3. **Verify Changes**
   - Run tests
   - Check for broken references
   - Validate component structure

## Output Format

### Orphaned Classes Report

```markdown
## Orphaned Classes Analysis

### Root Namespace: ss.survey

**Status**: ⚠️ Has Orphaned Classes

**Orphaned Files** (5 files):

- Survey.js (domain code)
- SurveyProcessor.js (domain code)
- SurveyValidator.js (shared code)
- SurveyFormatter.js (shared code)
- SurveyConstants.js (shared code)

**Leaf Components**:

- ss.survey.templates (7 files)

**Issue**: Root namespace contains code but is extended by leaf component

**Recommendation**: Consolidate templates into root namespace
```

### Component Hierarchy Issues

```markdown
## Component Hierarchy Issues

| Root Namespace | Orphaned Files | Leaf Components                 | Issue                | Recommendation   |
| -------------- | -------------- | ------------------------------- | -------------------- | ---------------- |
| ss.survey      | 5              | 1 (templates)                   | Has orphaned classes | Consolidate down |
| ss.ticket      | 45             | 2 (assign, route)               | Large orphaned code  | Split up         |
| ss.reporting   | 0              | 3 (tickets, experts, financial) | No issue             | ✅ OK            |
```

### Flattening Plan

```markdown
## Flattening Plan

### Priority: High

**ss.survey** → Consolidate Down

- Move 7 files from templates to root
- Effort: 2-3 days
- Risk: Low

### Priority: Medium

**ss.ticket** → Split Up

- Create ss.ticket.maintenance (30 files)
- Create ss.ticket.completion (10 files)
- Create ss.ticket.shared (5 files)
- Effort: 1 week
- Risk: Medium
```

## Analysis Checklist

**Structure Mapping**:

- [ ] Mapped all namespace hierarchies
- [ ] Identified root namespaces
- [ ] Located all source files
- [ ] Marked leaf nodes (components)

**Orphaned Class Detection**:

- [ ] Scanned root namespaces for source files
- [ ] Identified orphaned classes
- [ ] Classified orphaned classes (shared/domain/mixed)
- [ ] Assessed impact and dependencies

**Flattening Analysis**:

- [ ] Analyzed consolidation option
- [ ] Analyzed splitting option
- [ ] Analyzed shared code extraction option
- [ ] Selected best strategy for each root namespace

**Plan Creation**:

- [ ] Selected flattening strategy
- [ ] Created refactoring steps
- [ ] Estimated effort and risk
- [ ] Prioritized work

**Execution**:

- [ ] Moved files to target namespaces
- [ ] Updated imports and references
- [ ] Updated namespace declarations
- [ ] Verified changes with tests

## Implementation Notes

### For Node.js/Express Applications

Components typically in `services/` directory:

```
services/
├── survey/              ← Root namespace (extended)
│   ├── Survey.js       ← Orphaned class
│   └── templates/      ← Component (leaf node)
│       └── Template.js
```

**Flattening**:

- Consolidate: Move `templates/` files to `survey/`
- Split: Create `survey/create/` and `survey/process/`
- Shared: Create `survey/shared/` for utilities

### For Java Applications

Components identified by package structure:

```
com.company.survey       ← Root package (extended)
├── Survey.java         ← Orphaned class
└── templates/          ← Component (leaf package)
    └── Template.java
```

**Flattening**:

- Consolidate: Move `templates` classes to `survey` package
- Split: Create `survey.create` and `survey.process` packages
- Shared: Create `survey.shared` package

### Detection Strategies

**Find Root Namespaces with Code**:

```javascript
// Find root namespaces containing source files
function findRootNamespacesWithCode(namespaces, sourceFiles) {
  const rootNamespaces = namespaces.filter((ns) => {
    // Check if namespace has been extended
    const hasChildren = namespaces.some((n) => n.startsWith(ns + '.') || n.startsWith(ns + '/'))

    // Check if namespace contains source files
    const hasFiles = sourceFiles.some((f) => f.namespace === ns)

    return hasChildren && hasFiles
  })

  return rootNamespaces
}
```

**Find Orphaned Classes**:

```javascript
// Find orphaned classes in root namespaces
function findOrphanedClasses(rootNamespaces, sourceFiles) {
  const orphaned = []

  rootNamespaces.forEach((rootNs) => {
    const files = sourceFiles.filter((f) => f.namespace === rootNs)
    orphaned.push({
      rootNamespace: rootNs,
      files: files,
      count: files.length,
    })
  })

  return orphaned
}
```

## Fitness Functions

After flattening components, create automated checks:

### No Source Code in Root Namespaces

```javascript
// Alert if source code exists in root namespace
function checkRootNamespaceCode(namespaces, sourceFiles) {
  const violations = []

  namespaces.forEach((ns) => {
    // Check if namespace has been extended
    const hasChildren = namespaces.some((n) => n.startsWith(ns + '.') || n.startsWith(ns + '/'))

    if (hasChildren) {
      // Check if namespace contains source files
      const files = sourceFiles.filter((f) => f.namespace === ns)

      if (files.length > 0) {
        violations.push({
          namespace: ns,
          files: files.map((f) => f.name),
          issue: 'Root namespace contains source files (orphaned classes)',
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

  // Find all leaf nodes (components)
  const leafNodes = namespaces.filter((ns) => {
    return !namespaces.some((n) => n.startsWith(ns + '.') || n.startsWith(ns + '/'))
  })

  // Check that all source files are in leaf nodes
  sourceFiles.forEach((file) => {
    if (!leafNodes.includes(file.namespace)) {
      violations.push({
        file: file.name,
        namespace: file.namespace,
        issue: 'Source file not in leaf node (component)',
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
│   └── Ticket.js
├── completion/        ← Component
│   └── TicketCompletion.js
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

## Next Steps

After flattening components:

1. **Apply Determine Component Dependencies Pattern** - Analyze coupling
2. **Create Component Domains** - Group components into domains
3. **Create Domain Services** - Extract domains to services

## Notes

- Components must exist only as leaf nodes
- Root namespaces with code are problematic
- Flattening improves component clarity
- Choose flattening strategy based on functionality
- Shared code should be in dedicated components
- Always update references after moving files
- Test thoroughly after flattening
