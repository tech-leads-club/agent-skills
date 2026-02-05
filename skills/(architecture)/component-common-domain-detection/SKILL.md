---
name: component-common-domain-detection
description: Identifies duplicate domain functionality across components and suggests consolidation opportunities. Use when finding common domain logic, detecting duplicate functionality, analyzing shared classes, planning component consolidation, or when the user asks about common components, duplicate code, or domain consolidation.
---

# Common Domain Component Detection

This skill identifies common domain functionality that is duplicated across multiple components and suggests consolidation opportunities to reduce duplication and improve maintainability.

## How to Use

### Quick Start

Request analysis of your codebase:

- **"Find common domain functionality across components"**
- **"Identify duplicate domain logic that should be consolidated"**
- **"Detect shared classes used across multiple components"**
- **"Analyze consolidation opportunities for common components"**

### Usage Examples

**Example 1: Find Common Functionality**

```
User: "Find common domain functionality across components"

The skill will:
1. Scan component namespaces for common patterns
2. Detect shared classes used across components
3. Identify duplicate domain logic
4. Analyze coupling impact of consolidation
5. Suggest consolidation opportunities
```

**Example 2: Detect Duplicate Notification Logic**

```
User: "Are there multiple notification components that should be consolidated?"

The skill will:
1. Find all components with notification-related names
2. Analyze their functionality and dependencies
3. Calculate coupling impact if consolidated
4. Recommend consolidation approach
```

**Example 3: Analyze Shared Classes**

```
User: "Find classes that are shared across multiple components"

The skill will:
1. Identify classes imported/used by multiple components
2. Classify as domain vs infrastructure functionality
3. Suggest consolidation or shared library approach
4. Assess impact on coupling
```

### Step-by-Step Process

1. **Scan Components**: Identify components with common namespace patterns
2. **Detect Shared Code**: Find classes/files used across components
3. **Analyze Functionality**: Determine if functionality is truly common
4. **Assess Coupling**: Calculate coupling impact before consolidation
5. **Recommend Actions**: Suggest consolidation or shared library approach

## When to Use

Apply this skill when:

- After identifying and sizing components (Pattern 1)
- Before flattening components (Pattern 3)
- When planning to reduce code duplication
- Analyzing shared domain logic across the codebase
- Preparing for component consolidation
- Identifying candidates for shared services or libraries

## Core Concepts

### Domain vs Infrastructure Functionality

**Domain Functionality** (candidates for consolidation):

- Business processing logic (notification, validation, auditing, formatting)
- Common to **some** processes, not all
- Examples: Customer notification, ticket auditing, data validation

**Infrastructure Functionality** (usually not consolidated here):

- Operational concerns (logging, metrics, security)
- Common to **all** processes
- Examples: Logging, authentication, database connections

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
- Good for: Frequently changing logic, complex operations

**Shared Library**:

- Common code packaged as library (JAR, DLL, npm package)
- Components import and use the library
- Good for: Stable functionality, simple utilities

**Component Consolidation**:

- Merge multiple components into one
- Good for: Highly related functionality, low coupling impact

## Analysis Process

### Phase 1: Identify Common Namespace Patterns

Scan component namespaces for common leaf node names:

1. **Extract leaf nodes** from all component namespaces
   - Example: `services/billing/notification` → `notification`
   - Example: `services/ticket/notification` → `notification`

2. **Group by common leaf nodes**
   - Find components with same leaf node name
   - Example: All components ending in `.notification`

3. **Filter out infrastructure patterns**
   - Exclude: `.util`, `.helper`, `.common` (usually infrastructure)
   - Focus on: `.notification`, `.audit`, `.validation`, `.formatting`

**Example Output**:

```markdown
## Common Namespace Patterns Found

**Notification Components**:

- services/customer/notification
- services/ticket/notification
- services/survey/notification

**Audit Components**:

- services/billing/audit
- services/ticket/audit
- services/survey/audit
```

### Phase 2: Detect Shared Classes

Find classes/files used across multiple components:

1. **Scan imports/dependencies** in each component
   - Track which classes are imported from where
   - Note classes used by multiple components

2. **Identify shared classes**
   - Classes imported by 2+ components
   - Exclude infrastructure classes (Logger, Config, etc.)

3. **Classify as domain vs infrastructure**
   - Domain: Business logic classes (SMTPConnection, AuditLogger)
   - Infrastructure: Technical utilities (Logger, DatabaseConnection)

**Example Output**:

```markdown
## Shared Classes Found

**Domain Classes**:

- `SMTPConnection` - Used by 5 components (notification-related)
- `AuditLogger` - Used by 8 components (audit-related)
- `DataFormatter` - Used by 3 components (formatting-related)

**Infrastructure Classes** (exclude from consolidation):

- `Logger` - Used by all components (infrastructure)
- `Config` - Used by all components (infrastructure)
```

### Phase 3: Analyze Functionality Similarity

For each group of common components:

1. **Examine functionality**
   - Read source code of each component
   - Identify what each component does
   - Note similarities and differences

2. **Assess consolidation feasibility**
   - Are differences minor (configurable)?
   - Can differences be abstracted?
   - Is functionality truly the same?

3. **Calculate coupling impact**
   - Count incoming dependencies (afferent coupling) before consolidation
   - Estimate incoming dependencies after consolidation
   - Compare total coupling levels

**Example Analysis**:

```markdown
## Functionality Analysis

**Notification Components**:

- CustomerNotification: Sends billing notifications
- TicketNotification: Sends ticket assignment notifications
- SurveyNotification: Sends survey emails

**Similarities**: All send emails to customers
**Differences**: Email content/templates, triggers

**Consolidation Feasibility**: ✅ High

- Differences are in content, not mechanism
- Can be abstracted with templates/context
```

### Phase 4: Assess Coupling Impact

Before recommending consolidation, analyze coupling:

1. **Calculate current coupling**
   - Count components using each notification component
   - Sum total incoming dependencies

2. **Estimate consolidated coupling**
   - Count components that would use consolidated component
   - Compare to current total

3. **Evaluate coupling increase**
   - Is consolidated component too coupled?
   - Does it create a bottleneck?
   - Is coupling increase acceptable?

**Example Coupling Analysis**:

```markdown
## Coupling Impact Analysis

**Before Consolidation**:

- CustomerNotification: Used by 2 components (CA = 2)
- TicketNotification: Used by 2 components (CA = 2)
- SurveyNotification: Used by 1 component (CA = 1)
- **Total CA**: 5

**After Consolidation**:

- Notification: Used by 5 components (CA = 5)
- **Total CA**: 5 (same!)

**Verdict**: ✅ No coupling increase, safe to consolidate
```

### Phase 5: Recommend Consolidation Approach

Based on analysis, recommend approach:

**Shared Service** (if):

- Functionality changes frequently
- Complex operations
- Needs independent scaling
- Multiple deployment units will use it

**Shared Library** (if):

- Stable functionality
- Simple utilities
- Compile-time dependency acceptable
- No need for independent deployment

**Component Consolidation** (if):

- Highly related functionality
- Low coupling impact
- Same deployment unit acceptable

## Output Format

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

- Approach: Shared Service
- Expected Size: ~4,500 statements (5% of codebase)
- Benefits: Reduced duplication, easier maintenance
```

### Consolidation Opportunities Table

```markdown
## Consolidation Opportunities

| Common Functionality | Components   | Current CA | After CA | Feasibility | Recommendation                |
| -------------------- | ------------ | ---------- | -------- | ----------- | ----------------------------- |
| Notification         | 3 components | 5          | 5        | ✅ High     | Consolidate to shared service |
| Audit                | 3 components | 8          | 12       | ⚠️ Medium   | Consolidate, monitor coupling |
| Validation           | 2 components | 3          | 3        | ✅ High     | Consolidate to shared library |
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
4. Update dependent components to use new service
5. Remove old notification components

**Expected Impact**:

- Reduced code: ~4,500 statements consolidated
- Reduced duplication: 3 components → 1
- Coupling: No increase (CA stays at 5)
- Maintenance: Easier to maintain single component

### Priority: Medium

**Audit Components** → `services/audit`

**Steps**:
[Similar format]

**Expected Impact**:

- Coupling increase: CA 8 → 12 (monitor)
- Benefits: Reduced duplication
```

## Analysis Checklist

**Common Pattern Detection**:

- [ ] Scanned all component namespaces for common leaf nodes
- [ ] Identified components with same ending names
- [ ] Filtered out infrastructure patterns
- [ ] Grouped similar components

**Shared Class Detection**:

- [ ] Scanned imports/dependencies in each component
- [ ] Identified classes used by multiple components
- [ ] Classified as domain vs infrastructure
- [ ] Documented shared class usage

**Functionality Analysis**:

- [ ] Examined source code of common components
- [ ] Identified similarities and differences
- [ ] Assessed consolidation feasibility
- [ ] Determined if differences can be abstracted

**Coupling Assessment**:

- [ ] Calculated current coupling (CA) for each component
- [ ] Estimated consolidated coupling
- [ ] Compared total coupling levels
- [ ] Evaluated if coupling increase is acceptable

**Recommendations**:

- [ ] Suggested consolidation approach (service/library/merge)
- [ ] Prioritized recommendations by impact
- [ ] Created consolidation plan with steps
- [ ] Estimated expected benefits and risks

## Implementation Notes

### For Node.js/Express Applications

Common patterns to look for:

```
services/
├── CustomerService/
│   └── notification.js      ← Common pattern
├── TicketService/
│   └── notification.js     ← Common pattern
└── SurveyService/
    └── notification.js      ← Common pattern
```

**Shared Classes**:

- Check `require()` statements
- Look for classes imported from other components
- Example: `const SMTPConnection = require('../shared/SMTPConnection')`

### For Java Applications

Common patterns:

```
com.company.billing.audit     ← Common pattern
com.company.ticket.audit      ← Common pattern
com.company.survey.audit      ← Common pattern
```

**Shared Classes**:

- Check `import` statements
- Look for classes in common packages
- Example: `import com.company.shared.AuditLogger`

### Detection Strategies

**Namespace Pattern Detection**:

```javascript
// Extract leaf nodes from namespaces
function extractLeafNode(namespace) {
  const parts = namespace.split('/')
  return parts[parts.length - 1]
}

// Group by common leaf nodes
function groupByLeafNode(components) {
  const groups = {}
  components.forEach((comp) => {
    const leaf = extractLeafNode(comp.namespace)
    if (!groups[leaf]) groups[leaf] = []
    groups[leaf].push(comp)
  })
  return groups
}
```

**Shared Class Detection**:

```javascript
// Find classes used by multiple components
function findSharedClasses(components) {
  const classUsage = {}
  components.forEach((comp) => {
    comp.imports.forEach((imp) => {
      if (!classUsage[imp]) classUsage[imp] = []
      classUsage[imp].push(comp.name)
    })
  })

  return Object.entries(classUsage)
    .filter(([cls, users]) => users.length > 1)
    .map(([cls, users]) => ({ class: cls, usedBy: users }))
}
```

## Fitness Functions

After identifying common components, create automated checks:

### Common Namespace Pattern Detection

```javascript
// Alert if new components with common patterns are created
function checkCommonPatterns(components, exclusionList = []) {
  const leafNodes = {}
  components.forEach((comp) => {
    const leaf = extractLeafNode(comp.namespace)
    if (!exclusionList.includes(leaf)) {
      if (!leafNodes[leaf]) leafNodes[leaf] = []
      leafNodes[leaf].push(comp.name)
    }
  })

  return Object.entries(leafNodes)
    .filter(([leaf, comps]) => comps.length > 1)
    .map(([leaf, comps]) => ({
      pattern: leaf,
      components: comps,
      suggestion: 'Consider consolidating these components',
    }))
}
```

### Shared Class Usage Alert

```javascript
// Alert if class is used by multiple components
function checkSharedClasses(components, exclusionList = []) {
  const classUsage = {}
  components.forEach((comp) => {
    comp.imports.forEach((imp) => {
      if (!exclusionList.includes(imp)) {
        if (!classUsage[imp]) classUsage[imp] = []
        classUsage[imp].push(comp.name)
      }
    })
  })

  return Object.entries(classUsage)
    .filter(([cls, users]) => users.length > 1)
    .map(([cls, users]) => ({
      class: cls,
      usedBy: users,
      suggestion: 'Consider extracting to shared component or library',
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

### Don'ts ❌

- Don't consolidate infrastructure functionality (handled separately)
- Don't consolidate without analyzing coupling impact
- Don't assume all common patterns should be consolidated
- Don't ignore differences in functionality
- Don't consolidate if coupling increase is too high
- Don't mix domain and infrastructure in same analysis

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

## Next Steps

After identifying common domain components:

1. **Apply Flatten Components Pattern** - Remove orphaned classes
2. **Apply Determine Component Dependencies Pattern** - Analyze coupling
3. **Create Component Domains** - Group components into domains
4. **Plan Consolidation** - Execute consolidation recommendations

## Notes

- Common domain functionality is different from infrastructure functionality
- Consolidation reduces duplication but may increase coupling
- Always analyze coupling impact before consolidating
- Shared services vs shared libraries have different trade-offs
- Some duplication is acceptable if it reduces coupling
- Not all common patterns should be consolidated
