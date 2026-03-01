# Brownfield Mapping

**Trigger:** "Map codebase", "Analyze existing code", "Document current architecture"

**Purpose:** Understand existing project structure before adding features.

## Process

**High-level approach:**

1. Explore directory structure systematically
2. Identify technology stack from dependency manifests
3. Extract patterns from representative code samples
4. Document observed conventions and architectures
5. Catalog external integrations

**Analysis depth:**

- Sample 5-10 representative files per category
- Focus on consistency and patterns, not exhaustive coverage
- Extract actual examples, not assumptions

## Output: 6 Files in .specs/codebase/

---

### 1. STACK.md

**Purpose:** Document technology stack and dependencies.

**Size limit:** 2,000 tokens (~1,200 words)

**Extract from:**

- Dependency manifest files
- Build configuration
- Runtime configuration

**Document:**

```markdown
# Tech Stack

**Analyzed:** [date]

## Core

- Framework: [detected name + version]
- Language: [detected name + version]
- Runtime: [detected name + version]
- Package manager: [detected manager]

## Frontend (if applicable)

- UI Framework: [name + version]
- Styling: [approach + tools]
- State Management: [library/pattern]
- Form Handling: [library if present]

## Backend (if applicable)

- API Style: [REST/GraphQL/gRPC + framework]
- Database: [ORM/query builder + database system]
- Authentication: [library/approach]

## Testing

- Unit: [framework]
- Integration: [framework]
- E2E: [framework if present]

## External Services

- [Category]: [Service name]
- [Category]: [Service name]

## Development Tools

- [Tool category]: [Tool name]
```

**Instructions:**

- Extract from actual dependency files
- Include versions for major dependencies
- Categorize by purpose
- Note testing frameworks explicitly

---

### 2. ARCHITECTURE.md

**Purpose:** Document architectural patterns and data flow.

**Size limit:** 4,000 tokens (~2,400 words)

**Extract from:**

- Directory organization
- Code structure analysis
- Repeated patterns across files

**Document:**

```markdown
# Architecture

**Pattern:** [Identified pattern - monolith/microservices/modular/etc]

## High-Level Structure

[Create diagram/description based on actual organization]

## Identified Patterns

### [Pattern Name]

**Location:** [where this pattern lives]
**Purpose:** [what this achieves]
**Implementation:** [how it's structured]
**Example:** [reference to actual file/function]

### [Pattern Name]

[Same structure]

## Data Flow

### [Key Flow - e.g., Authentication/Payment/etc]

[Map actual flow from code analysis]

### [Key Flow]

[Map actual flow]

## Code Organization

**Approach:** [feature-based/layer-based/domain-driven/etc]

**Structure:**
[Document actual directory organization]

**Module boundaries:**
[How code is divided into modules/packages]
```

**Instructions:**

- Identify patterns from actual code, not assumptions
- Document observed architectural decisions
- Create flow diagrams for critical paths
- Reference concrete examples from codebase

---

### 3. CONVENTIONS.md

**Purpose:** Document code style and naming conventions.

**Size limit:** 3,000 tokens (~1,800 words)

**Extract from:**

- Analyzing 5-10 representative files
- Identifying consistent patterns
- Observing actual conventions in use

**Document:**

```markdown
# Code Conventions

## Naming Conventions

**Files:**
[Observed pattern - document actual approach]
Examples: [actual filenames from codebase]

**Functions/Methods:**
[Observed pattern]
Examples: [actual function names]

**Variables:**
[Observed pattern]
Examples: [actual variable names]

**Constants:**
[Observed pattern]
Examples: [actual constant names]

## Code Organization

**Import/Dependency Declaration:**
[Observed ordering pattern]
[Example from actual file]

**File Structure:**
[Observed organization within files]
[Example from actual file]

## Type Safety/Documentation

**Approach:** [Type system/documentation approach used]
[Example from actual code]

## Error Handling

**Pattern:** [Observed error handling approach]
[Example from actual code]

## Comments/Documentation

**Style:** [When/how comments are used]
[Example from actual code]
```

**Instructions:**

- Extract patterns from actual code samples
- Document observed conventions, not ideal conventions
- Include concrete examples from codebase
- Note exceptions or variations where found

---

### 4. STRUCTURE.md

**Purpose:** Document directory layout and file organization.

**Size limit:** 2,000 tokens (~1,200 words)

**Document:**

```markdown
# Project Structure

**Root:** [project root path]

## Directory Tree

[Visual tree representation - max 3 levels deep]

## Module Organization

### [Module/Area Name]

**Purpose:** [what this area handles]
**Location:** [where files live]
**Key files:** [important files in this area]

### [Module/Area Name]

[Same structure]

## Where Things Live

**[Capability/Feature]:**

- UI/Interface: [location]
- Business Logic: [location]
- Data Access: [location]
- Configuration: [location]

**[Capability/Feature]:**
[Same structure]

## Special Directories

**[Directory name]:**
**Purpose:** [what belongs here]
**Examples:** [key files in this directory]
```

**Instructions:**

- Create tree view of actual directory structure
- Limit depth to maintain readability
- Document purpose of key directories
- Map capabilities to physical locations

---

### 5. TESTING.md

**Purpose:** Document testing infrastructure and patterns.

**Size limit:** 4,000 tokens (~2,400 words)

**Document:**

```markdown
# Testing Infrastructure

## Test Frameworks

**Unit/Integration:** [framework name + version]
**E2E:** [framework name + version]
**Coverage:** [tool if used]

## Test Organization

**Location:** [where tests live]
**Naming:** [test file naming pattern]
**Structure:** [how tests are organized]

## Testing Patterns

### Unit Tests

**Approach:** [observed pattern]
**Location:** [where unit tests live]
[Description of actual pattern used]

### Integration Tests

**Approach:** [observed pattern]
**Location:** [where integration tests live]
[Description of actual pattern used]

### E2E Tests

**Approach:** [observed pattern if present]
**Location:** [where E2E tests live]
[Description of actual pattern used]

## Test Execution

**Commands:** [how to run tests]
**Configuration:** [test configuration approach]

## Coverage Targets

**Current:** [if measurable]
**Goals:** [if documented]
**Enforcement:** [if automated]
```

**Instructions:**

- Identify test frameworks from dependencies and code
- Document actual testing patterns observed
- Note test organization approach
- Include execution instructions

---

### 6. INTEGRATIONS.md

**Purpose:** Document external service integrations.

**Size limit:** 5,000 tokens (~3,000 words)

**Document:**

```markdown
# External Integrations

## [Service Category]

**Service:** [service name]
**Purpose:** [what this integration provides]
**Implementation:** [where integration lives in code]
**Configuration:** [how service is configured]
**Authentication:** [auth approach if applicable]

## [Service Category]

[Same structure]

## API Integrations

### [API Name]

**Purpose:** [what this API provides]
**Location:** [where API client/code lives]
**Authentication:** [auth method]
**Key endpoints:** [major endpoints used]

## Webhooks

### [Webhook Source]

**Purpose:** [what events are handled]
**Location:** [webhook handler location]
**Events:** [event types processed]

## Background Jobs

**Queue system:** [system if used]
**Location:** [where job definitions live]
**Jobs:** [key background jobs]
```

**Instructions:**

- Identify integrations from code and configuration
- Document authentication approaches
- Note webhook handlers if present
- Include background job infrastructure

---

## Total Context Budget

**Combined:** ~14,000 tokens (7% of context window)
**Acceptable for:** Brownfield projects requiring codebase understanding
**Loading strategy:** Load relevant docs on-demand based on task
