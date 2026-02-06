---
name: component-identification-sizing
description: Identifies architectural components in codebases and calculates size metrics for decomposition planning. Use when analyzing codebase structure, planning monolithic decomposition, identifying oversized components, calculating component statistics, or when the user asks about component analysis, codebase sizing, or architectural decomposition.
---

# Component Identification and Sizing

This skill identifies architectural components (logical building blocks) in a codebase and calculates size metrics to assess decomposition feasibility and identify oversized components.

## How to Use

### Quick Start

Request analysis of your codebase:

- **"Identify and size all components in this codebase"**
- **"Find oversized components that need splitting"**
- **"Create a component inventory for decomposition planning"**
- **"Analyze component size distribution"**

### Usage Examples

**Example 1: Complete Analysis**

```
User: "Identify and size all components in this codebase"

The skill will:
1. Map directory/namespace structures
2. Identify all components (leaf nodes)
3. Calculate size metrics (statements, files, percentages)
4. Generate component inventory table
5. Flag oversized/undersized components
6. Provide recommendations
```

**Example 2: Find Oversized Components**

```
User: "Which components are too large?"

The skill will:
1. Calculate mean and standard deviation
2. Identify components >2 std dev or >10% threshold
3. Analyze functional areas within large components
4. Suggest specific splits with estimated sizes
```

**Example 3: Component Size Analysis**

```
User: "Analyze component sizes and distribution"

The skill will:
1. Calculate all size metrics
2. Generate size distribution summary
3. Identify outliers
4. Provide statistics and recommendations
```

### Step-by-Step Process

1. **Initial Analysis**: Start with complete component inventory
2. **Identify Issues**: Find components that need attention
3. **Get Recommendations**: Request actionable split/consolidation suggestions
4. **Monitor Progress**: Track component growth over time

## When to Use

Apply this skill when:

- Starting a monolithic decomposition effort
- Assessing codebase structure and organization
- Identifying components that are too large or too small
- Creating component inventory for migration planning
- Analyzing code distribution across components
- Preparing for component-based decomposition patterns

## Core Concepts

### Component Definition

A **component** is an architectural building block that:

- Has a well-defined role and responsibility
- Is identified by a namespace, package structure, or directory path
- Contains source code files (classes, functions, modules) grouped together
- Performs specific business or infrastructure functionality

**Key Rule**: Components are identified by **leaf nodes** in directory/namespace structures. If a namespace is extended (e.g., `services/billing` extended to `services/billing/payment`), the parent becomes a **subdomain**, not a component.

### Size Metrics

**Statements** (not lines of code):

- Count executable statements terminated by semicolons or newlines
- More accurate than lines of code for size comparison
- Accounts for code complexity, not formatting

**Component Size Indicators**:

- **Percent of codebase**: Component statements / Total statements
- **File count**: Number of source files in component
- **Standard deviation**: Distance from mean component size

## Analysis Process

### Phase 1: Identify Components

Scan the codebase directory structure:

1. **Map directory/namespace structure**
   - For Node.js: `services/`, `routes/`, `models/`, `utils/`
   - For Java: Package structure (e.g., `com.company.domain.service`)
   - For Python: Module paths (e.g., `app/billing/payment`)

2. **Identify leaf nodes**
   - Components are the deepest directories containing source files
   - Example: `services/BillingService/` is a component
   - Example: `services/BillingService/payment/` extends it, making `BillingService` a subdomain

3. **Create component inventory**
   - List each component with its namespace/path
   - Note any parent namespaces (subdomains)

### Phase 2: Calculate Size Metrics

For each component:

1. **Count statements**
   - Parse source files in component directory
   - Count executable statements (not comments, blank lines, or declarations alone)
   - Sum across all files in component

2. **Count files**
   - Total source files (`.js`, `.ts`, `.java`, `.py`, etc.)
   - Exclude test files, config files, documentation

3. **Calculate percentage**

   ```
   component_percent = (component_statements / total_statements) * 100
   ```

4. **Calculate statistics**
   - Mean component size: `total_statements / number_of_components`
   - Standard deviation: `sqrt(sum((size - mean)^2) / (n - 1))`
   - Component's deviation: `(component_size - mean) / std_dev`

### Phase 3: Identify Size Issues

**Oversized Components** (candidates for splitting):

- Exceeds 30% of total codebase (for small apps with <10 components)
- Exceeds 10% of total codebase (for large apps with >20 components)
- More than 2 standard deviations above mean
- Contains multiple distinct functional areas

**Undersized Components** (candidates for consolidation):

- Less than 1% of codebase (may be too granular)
- Less than 1 standard deviation below mean
- Contains only a few files with minimal functionality

**Well-Sized Components**:

- Between 1-2 standard deviations from mean
- Represents a single, cohesive functional area
- Appropriate percentage for application size

## Output Format

### Component Inventory Table

```markdown
## Component Inventory

| Component Name  | Namespace/Path               | Statements | Files | Percent | Status       |
| --------------- | ---------------------------- | ---------- | ----- | ------- | ------------ |
| Billing Payment | services/BillingService      | 4,312      | 23    | 5%      | ✅ OK        |
| Reporting       | services/ReportingService    | 27,765     | 162   | 33%     | ⚠️ Too Large |
| Notification    | services/NotificationService | 1,433      | 7     | 2%      | ✅ OK        |
```

**Status Legend**:

- ✅ OK: Well-sized (within 1-2 std dev from mean)
- ⚠️ Too Large: Exceeds size threshold or >2 std dev above mean
- 🔍 Too Small: <1% of codebase or <1 std dev below mean

### Size Analysis Summary

```markdown
## Size Analysis Summary

**Total Components**: 18
**Total Statements**: 82,931
**Mean Component Size**: 4,607 statements
**Standard Deviation**: 5,234 statements

**Oversized Components** (>2 std dev or >10%):

- Reporting (33% - 27,765 statements) - Consider splitting into:
  - Ticket Reports
  - Expert Reports
  - Financial Reports

**Well-Sized Components** (within 1-2 std dev):

- Billing Payment (5%)
- Customer Profile (5%)
- Ticket Assignment (9%)

**Undersized Components** (<1 std dev):

- Login (2% - 1,865 statements) - Consider consolidating with Authentication
```

### Component Size Distribution

```markdown
## Component Size Distribution
```

Component Size Distribution (by percent of codebase)

[Visual representation or histogram if possible]

Largest: ████████████████████████████████████ 33% (Reporting)
████████ 9% (Ticket Assign)
██████ 8% (Ticket)
██████ 6% (Expert Profile)
█████ 5% (Billing Payment)
████ 4% (Billing History)
...

````

### Recommendations

```markdown
## Recommendations

### High Priority: Split Large Components

**Reporting Component** (33% of codebase):
- **Current**: Single component with 27,765 statements
- **Issue**: Too large, contains multiple functional areas
- **Recommendation**: Split into:
  1. Reporting Shared (common utilities)
  2. Ticket Reports (ticket-related reports)
  3. Expert Reports (expert-related reports)
  4. Financial Reports (financial reports)
- **Expected Result**: Each component ~7-9% of codebase

### Medium Priority: Review Small Components

**Login Component** (2% of codebase):
- **Current**: 1,865 statements, 3 files
- **Consideration**: May be too granular if related to broader authentication
- **Recommendation**: Evaluate if should be consolidated with Authentication/User components

### Low Priority: Monitor Well-Sized Components

Most components are appropriately sized. Continue monitoring during decomposition.
````

## Analysis Checklist

**Component Identification**:

- [ ] Mapped all directory/namespace structures
- [ ] Identified leaf nodes (components) vs parent nodes (subdomains)
- [ ] Created complete component inventory
- [ ] Documented namespace/path for each component

**Size Calculation**:

- [ ] Counted statements (not lines) for each component
- [ ] Counted source files (excluding tests/configs)
- [ ] Calculated percentage of total codebase
- [ ] Calculated mean and standard deviation

**Size Assessment**:

- [ ] Identified oversized components (>threshold or >2 std dev)
- [ ] Identified undersized components (<1% or <1 std dev)
- [ ] Flagged components for splitting or consolidation
- [ ] Documented size distribution

**Recommendations**:

- [ ] Suggested splits for oversized components
- [ ] Suggested consolidations for undersized components
- [ ] Prioritized recommendations by impact
- [ ] Created architecture stories for refactoring

## Implementation Notes

### For Node.js/Express Applications

Components typically found in:

- `services/` - Business logic components
- `routes/` - API endpoint components
- `models/` - Data model components
- `utils/` - Utility components
- `middleware/` - Middleware components

**Example Component Identification**:

```
services/
├── BillingService/          ← Component (leaf node)
│   ├── index.js
│   └── BillingService.js
├── CustomerService/          ← Component (leaf node)
│   └── CustomerService.js
└── NotificationService/      ← Component (leaf node)
    └── NotificationService.js
```

### For Java Applications

Components identified by package structure:

- `com.company.domain.service` - Service components
- `com.company.domain.model` - Model components
- `com.company.domain.repository` - Repository components

**Example Component Identification**:

```
com.company.billing.payment   ← Component (leaf package)
com.company.billing.history   ← Component (leaf package)
com.company.billing           ← Subdomain (parent of payment/history)
```

### Statement Counting

**JavaScript/TypeScript**:

- Count statements terminated by `;` or newline
- Include: assignments, function calls, returns, conditionals, loops
- Exclude: comments, blank lines, declarations without assignment

**Java**:

- Count statements terminated by `;`
- Include: method calls, assignments, returns, conditionals
- Exclude: class/interface declarations, comments, blank lines

**Python**:

- Count executable statements (not comments or blank lines)
- Include: assignments, function calls, returns, conditionals
- Exclude: docstrings, comments, blank lines

## Fitness Functions

After identifying and sizing components, create automated checks:

### Component Size Threshold

```javascript
// Alert if any component exceeds 10% of codebase
function checkComponentSize(components, threshold = 0.1) {
  const totalStatements = components.reduce((sum, c) => sum + c.statements, 0)
  return components
    .filter((c) => c.statements / totalStatements > threshold)
    .map((c) => ({
      component: c.name,
      percent: ((c.statements / totalStatements) * 100).toFixed(1),
      issue: 'Exceeds size threshold',
    }))
}
```

### Standard Deviation Check

```javascript
// Alert if component is >2 standard deviations from mean
function checkStandardDeviation(components) {
  const sizes = components.map((c) => c.statements)
  const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length
  const stdDev = Math.sqrt(sizes.reduce((sum, size) => sum + Math.pow(size - mean, 2), 0) / (sizes.length - 1))

  return components
    .filter((c) => Math.abs(c.statements - mean) > 2 * stdDev)
    .map((c) => ({
      component: c.name,
      deviation: ((c.statements - mean) / stdDev).toFixed(2),
      issue: 'More than 2 standard deviations from mean',
    }))
}
```

## Best Practices

### Do's ✅

- Use statements, not lines of code
- Identify components as leaf nodes only
- Calculate both percentage and standard deviation
- Consider application size when setting thresholds
- Document namespace/path for each component
- Create visual size distribution if possible

### Don'ts ❌

- Don't count test files in component size
- Don't treat parent directories as components
- Don't use fixed thresholds without considering app size
- Don't ignore small components (may need consolidation)
- Don't skip standard deviation calculation
- Don't mix infrastructure and domain components in same analysis

## Next Steps

After completing component identification and sizing:

1. **Apply Gather Common Domain Components Pattern** - Identify duplicate functionality
2. **Apply Flatten Components Pattern** - Remove orphaned classes from root namespaces
3. **Apply Determine Component Dependencies Pattern** - Analyze coupling between components
4. **Create Component Domains** - Group components into logical domains

## Notes

- Component size thresholds vary by application size
- Small apps (<10 components): 30% threshold may be appropriate
- Large apps (>20 components): 10% threshold is more appropriate
- Standard deviation is more reliable than fixed percentages
- Well-sized components are 1-2 standard deviations from mean
- Oversized components often contain multiple functional areas that can be split
