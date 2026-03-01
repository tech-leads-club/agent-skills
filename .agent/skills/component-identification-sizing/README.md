# Component Identification and Sizing Skill

A skill for identifying architectural components in codebases and calculating size metrics to support decomposition planning and migration efforts.

## What This Skill Does

This skill analyzes codebases to:

1. **Identify architectural components** (logical building blocks) from directory/namespace structures
2. **Calculate size metrics** using statements (not lines of code) for accurate comparison
3. **Detect oversized components** that exceed thresholds or standard deviations
4. **Identify undersized components** that may need consolidation
5. **Generate component inventory tables** with size statistics
6. **Provide recommendations** for splitting large components or consolidating small ones
7. **Assess decomposition feasibility** based on component size distribution

## When to Use This Skill

This skill is applied when you:

- Ask to analyze codebase structure or organization
- Request component identification or sizing analysis
- Need help planning monolithic decomposition
- Want to find oversized components that need splitting
- Ask about architectural decomposition patterns
- Request component inventory for migration planning
- Discuss codebase metrics or statistics

## Key Features

### Language & Framework Agnostic

This skill works with **any codebase** in any language:

- **Node.js/Express**: Analyzes `services/`, `routes/`, `models/` directories
- **Java**: Analyzes package structures (e.g., `com.company.domain.service`)
- **Python**: Analyzes module paths (e.g., `app/billing/payment`)
- **C#/.NET**: Analyzes namespace structures
- **Any language**: Works with directory/namespace patterns

### Accurate Size Metrics

Uses **statements** (not lines of code) for accurate size comparison:

- Accounts for code complexity, not formatting
- More reliable than line counts
- Consistent across different coding styles
- Standard deviation analysis for outlier detection

### Actionable Output

Provides concrete, actionable analysis:

- Component inventory tables with size metrics
- Size distribution visualizations
- Oversized component identification with split recommendations
- Undersized component identification with consolidation suggestions
- Fitness function code for automated governance

## Files Included

### SKILL.md (Main Skill)

The primary skill file containing:

- Component identification methodology
- Size calculation process (statements, files, percentages)
- Standard deviation analysis framework
- Output format templates
- Implementation notes for different languages
- Fitness function examples
- Complete analysis checklist

### QUICK-REFERENCE.md (Quick Lookup)

Fast reference for common scenarios:

- Component definition rules
- Size threshold guidelines
- Quick analysis steps
- Common directory patterns
- Output template

### README.md (This File)

Complete documentation including:

- What the skill does
- When to use it
- Usage examples
- Core concepts
- Installation and customization

## Usage Examples

### Example 1: Identify All Components

```
User: "Identify and size all components in this codebase"

The skill will:
1. Map directory/namespace structures
2. Identify leaf nodes (components)
3. Count statements and files per component
4. Calculate percentages and statistics
5. Generate component inventory table
6. Flag oversized/undersized components
```

**Output**:

```markdown
## Component Inventory

| Component Name      | Namespace                    | Statements | Files | Percent | Status       |
| ------------------- | ---------------------------- | ---------- | ----- | ------- | ------------ |
| BillingService      | services/BillingService      | 4,312      | 23    | 5%      | ✅ OK        |
| ReportingService    | services/ReportingService    | 27,765     | 162   | 33%     | ⚠️ Too Large |
| NotificationService | services/NotificationService | 1,433      | 7     | 2%      | ✅ OK        |

## Recommendations

- ReportingService (33%) should be split into smaller components
```

### Example 2: Find Oversized Components

```
User: "Find components that are too large and need splitting"

The skill will:
1. Calculate mean and standard deviation
2. Identify components >2 std dev or >10% threshold
3. Analyze functional areas within large components
4. Suggest specific splits
5. Estimate resulting component sizes
```

**Output**:

```markdown
## Oversized Components

**ReportingService** (33% - 27,765 statements)

- Exceeds 10% threshold
- Contains multiple functional areas:
  - Ticket Reports (8,000 statements)
  - Expert Reports (9,000 statements)
  - Financial Reports (10,000 statements)
  - Shared utilities (765 statements)

**Recommendation**: Split into:

1. ReportingShared (shared utilities)
2. TicketReportsService
3. ExpertReportsService
4. FinancialReportsService
```

### Example 3: Component Size Analysis

```
User: "Analyze component sizes and distribution"

The skill will:
1. Calculate all size metrics
2. Generate size distribution
3. Identify outliers
4. Provide summary statistics
5. Create recommendations
```

**Output**:

```markdown
## Size Analysis Summary

**Total Components**: 18
**Total Statements**: 82,931
**Mean Component Size**: 4,607 statements
**Standard Deviation**: 5,234 statements

**Distribution**:

- Oversized (>2 std dev): 1 component
- Well-sized (within 1-2 std dev): 15 components
- Undersized (<1 std dev): 2 components
```

## Core Concepts

### Component Definition

A **component** is an architectural building block that:

- Has a well-defined role and responsibility
- Is identified by a **leaf node** in directory/namespace structure
- Contains source code files grouped together
- Performs specific business or infrastructure functionality

**Key Rule**: Components are **leaf nodes only**. If a namespace is extended (e.g., `services/billing` → `services/billing/payment`), the parent becomes a **subdomain**, not a component.

### Size Metrics

| Metric         | Description                                                | Purpose                                        |
| -------------- | ---------------------------------------------------------- | ---------------------------------------------- |
| **Statements** | Count executable statements (terminated by `;` or newline) | Accurate size measure, accounts for complexity |
| **Files**      | Count source files in component                            | Complexity indicator                           |
| **Percent**    | `(component_statements / total_statements) * 100`          | Relative size in codebase                      |
| **Std Dev**    | Standard deviation from mean component size                | Outlier detection                              |

### Size Thresholds

Thresholds vary by application size:

| App Size                  | Oversized Threshold | Notes                                        |
| ------------------------- | ------------------- | -------------------------------------------- |
| Small (<10 components)    | >30% of codebase    | Fewer components, higher variance acceptable |
| Medium (10-20 components) | >15% of codebase    | Balanced threshold                           |
| Large (>20 components)    | >10% of codebase    | More components, lower variance expected     |

**Standard Deviation Rule**: Components >2 standard deviations from mean are considered oversized.

### Component Status

- ✅ **OK**: Within 1-2 std dev from mean, appropriately sized
- ⚠️ **Too Large**: >2 std dev above mean or exceeds percentage threshold
- 🔍 **Too Small**: <1 std dev below mean or <1% of codebase

## How to Use

### Quick Start

Request analysis of your codebase:

```
"Identify and size all components in this codebase"
"Find oversized components that need splitting"
"Create a component inventory for decomposition planning"
"Analyze component size distribution"
```

### Step-by-Step Usage

#### 1. Initial Analysis

Start with a complete component inventory:

```
User: "Identify all components and calculate their sizes"
```

This will:

- Map your directory structure
- Identify all components (leaf nodes)
- Calculate size metrics
- Generate inventory table

#### 2. Identify Issues

Find components that need attention:

```
User: "Which components are too large and need splitting?"
```

This will:

- Calculate statistics (mean, std dev)
- Flag oversized components
- Analyze functional areas
- Suggest specific splits

#### 3. Get Recommendations

Request actionable recommendations:

```
User: "What should I do about oversized components?"
```

This will:

- Prioritize recommendations
- Suggest component splits
- Estimate resulting sizes
- Create architecture stories

#### 4. Monitor Progress

Track changes over time:

```
User: "Has component X grown too large since last analysis?"
```

This will:

- Compare current vs. previous sizes
- Check against thresholds
- Alert if thresholds exceeded

### Advanced Usage

#### Custom Thresholds

If you have specific size requirements:

```
User: "Identify components larger than 15% of the codebase"
```

#### Language-Specific Analysis

For framework-specific analysis:

```
User: "Analyze components in the services/ directory"
```

#### Component Grouping

Analyze specific domains:

```
User: "Size all components in the billing domain"
```

## Output Format

The skill generates structured output:

### Component Inventory Table

```markdown
## Component Inventory

| Component Name   | Namespace/Path            | Statements | Files | Percent | Status       |
| ---------------- | ------------------------- | ---------- | ----- | ------- | ------------ |
| BillingService   | services/BillingService   | 4,312      | 23    | 5%      | ✅ OK        |
| ReportingService | services/ReportingService | 27,765     | 162   | 33%     | ⚠️ Too Large |
```

### Size Analysis Summary

```markdown
## Size Analysis Summary

**Total Components**: 18
**Total Statements**: 82,931
**Mean Component Size**: 4,607 statements
**Standard Deviation**: 5,234 statements

**Oversized Components** (>2 std dev or >10%):

- ReportingService (33% - 27,765 statements)
```

### Recommendations

```markdown
## Recommendations

### High Priority: Split Large Components

**ReportingService** (33% of codebase):

- **Current**: Single component with 27,765 statements
- **Issue**: Too large, contains multiple functional areas
- **Recommendation**: Split into:
  1. ReportingShared (common utilities)
  2. TicketReportsService
  3. ExpertReportsService
  4. FinancialReportsService
- **Expected Result**: Each component ~7-9% of codebase
```

## Integration with Other Skills

This skill is part of a decomposition pattern sequence:

1. **Component Identification & Sizing** (this skill) → Understand what you have
2. **Component Dependency Analysis** → Assess coupling and feasibility
3. **Common Domain Component Detection** → Find duplicate functionality
4. **Component Flattening** → Remove orphaned classes
5. **Domain Identification** → Group components into domains
6. **Service Boundary Recommendation** → Plan service extraction

Use this skill first to establish a baseline before applying other decomposition patterns.

## Installation

This skill is installed at the project level:

```
skills/component-identification-sizing/
```

This means it's:

- **Shared with the repository**: Anyone cloning this repo gets the skill
- **Version controlled**: Changes are tracked in git
- **Project-specific**: Can be customized for this codebase

The skill will be automatically discovered and used when appropriate based on the description in the frontmatter.

## Customization

### For Project-Specific Patterns

If your project has specific component patterns, document them:

```
skills/component-identification-sizing/
└── project-patterns.md  # Document project-specific component patterns
```

### For Framework-Specific Analysis

Add framework-specific detection patterns:

```markdown
## Framework: NestJS

**Component Pattern**: `@Injectable()` classes in `services/` directory
**Module Pattern**: `@Module()` decorator groups components
**Controller Pattern**: `@Controller()` in `controllers/` directory
```

### Custom Thresholds

Modify thresholds in SKILL.md for your project:

```markdown
## Custom Thresholds

For this project:

- Oversized: >12% of codebase (instead of default 10%)
- Undersized: <0.5% of codebase (instead of default 1%)
```

## Fitness Functions

After identifying components, create automated checks:

### Component Size Check

```javascript
// Alert if component exceeds threshold
function checkComponentSize(component, totalStatements, threshold = 0.1) {
  const percent = component.statements / totalStatements
  if (percent > threshold) {
    return {
      component: component.name,
      percent: (percent * 100).toFixed(1),
      issue: 'Exceeds size threshold',
    }
  }
}
```

### Standard Deviation Check

```javascript
// Alert if component is >2 std dev from mean
function checkStandardDeviation(component, mean, stdDev) {
  const deviation = Math.abs(component.statements - mean) / stdDev
  if (deviation > 2) {
    return {
      component: component.name,
      deviation: deviation.toFixed(2),
      issue: 'More than 2 standard deviations from mean',
    }
  }
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
- Monitor component growth over time

### Don'ts ❌

- Don't count test files in component size
- Don't treat parent directories as components
- Don't use fixed thresholds without considering app size
- Don't ignore small components (may need consolidation)
- Don't skip standard deviation calculation
- Don't mix infrastructure and domain components in same analysis

## Validation

To verify the skill works correctly, try:

```
User: "Identify and size all components in this codebase"
```

The skill should:

1. Read the SKILL.md file
2. Map directory/namespace structures
3. Identify leaf nodes (components)
4. Calculate size metrics
5. Generate component inventory table
6. Flag oversized/undersized components
7. Provide recommendations

## Troubleshooting

### Components Not Identified

**Issue**: Components are not found in your structure

**Solution**:

- Check if directories follow expected patterns
- Verify source files exist in component directories
- Ensure leaf nodes contain actual code files

### Incorrect Size Calculations

**Issue**: Size metrics seem wrong

**Solution**:

- Verify statement counting logic matches your language
- Check if test files are being excluded
- Ensure all source files are being counted

### Thresholds Too Strict/Loose

**Issue**: Too many/few components flagged

**Solution**:

- Adjust thresholds in SKILL.md for your app size
- Use standard deviation instead of fixed percentages
- Consider your specific decomposition goals

## References

This skill is based on:

- **Software Architecture: The Hard Parts** by Neal Ford, Mark Richards, Pramod Sadalage, Zhamak Dehghani
- **Component-Based Decomposition Patterns** (Chapter 5)
- **Fundamentals of Software Architecture** by Mark Richards & Neal Ford

## Contributing

To improve this skill:

1. Add language-specific statement counting patterns
2. Expand framework-specific component detection
3. Add more size distribution visualization options
4. Document new anti-patterns or red flags
5. Share real-world case studies

## Version

**Version**: 1.0.0  
**Created**: 2026-02-05  
**Based on**: Component-Based Decomposition Patterns from "Software Architecture: The Hard Parts"

---

## Quick Start

To use this skill immediately:

```
User: "Identify and size all components in my codebase"
User: "Find oversized components that need splitting"
User: "Create a component inventory for decomposition planning"
User: "Analyze component size distribution"
```

This skill will automatically be applied to provide comprehensive analysis with actionable recommendations.
