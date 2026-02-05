---
name: subagent-creator
description: Guide for creating AI subagents with isolated context for complex multi-step workflows. Use when users want to create a subagent, specialized agent, verifier, debugger, or orchestrator that requires isolated context and deep specialization. Works with any agent that supports subagent delegation. Triggers on "create subagent", "new agent", "specialized assistant", "create verifier".
---

# Subagent Creator

This skill provides guidance for creating effective, agent-agnostic subagents.

## What are Subagents?

Subagents are specialized assistants that an AI agent can delegate tasks to. Characteristics:

- **Isolated context**: Each subagent has its own context window
- **Parallel execution**: Multiple subagents can run simultaneously
- **Specialization**: Configured with specific prompts and expertise
- **Reusable**: Defined once, used in multiple contexts

### When to Use Subagents vs Skills

```
Is the task complex with multiple steps?
├─ YES → Does it require isolated context?
│         ├─ YES → Use SUBAGENT
│         └─ NO → Use SKILL
│
└─ NO → Use SKILL
```

**Use Subagents for:**
- Complex workflows requiring isolated context
- Long-running tasks that benefit from specialization
- Verification and auditing (independent perspective)
- Parallel workstreams

**Use Skills for:**
- Quick, one-off actions
- Domain knowledge without context isolation
- Reusable procedures that don't need isolation

## Subagent Structure

A subagent is typically a markdown file with frontmatter metadata:

```markdown
---
name: agent-name
description: Description of when to use this subagent.
model: inherit  # or fast, or specific model ID
readonly: false  # true to restrict write permissions
---

You are an [expert in X].

When invoked:
1. [Step 1]
2. [Step 2]
3. [Step 3]

[Detailed instructions about expected behavior]

Report [type of expected result]:
- [Output format]
- [Metrics or specific information]
```

## Subagent Creation Process

### 1. Define the Purpose

- What specific responsibility does the subagent have?
- Why does it need isolated context?
- Does it involve multiple complex steps?
- Does it require deep specialization?

### 2. Configure the Metadata

#### name (required)
Unique identifier. Use kebab-case.

```yaml
name: security-auditor
```

#### description (critical)
CRITICAL for automatic delegation. Explains when to use this subagent.

**Good descriptions:**
- "Security specialist. Use when implementing auth, payments, or handling sensitive data."
- "Debugging specialist for errors and test failures. Use when encountering issues."
- "Validates completed work. Use after tasks are marked done."

**Phrases that encourage automatic delegation:**
- "Use proactively when..."
- "Always use for..."
- "Automatically delegate when..."

#### model (optional)
```yaml
model: inherit  # Uses same model as parent (default)
model: fast     # Uses fast model for quick tasks
```

#### readonly (optional)
```yaml
readonly: true  # Restricts write permissions
```

### 3. Write the Subagent Prompt

Define:
1. **Identity**: "You are an [expert]..."
2. **When invoked**: Context of use
3. **Process**: Specific steps to follow
4. **Expected output**: Format and content

**Template:**

```markdown
You are an [expert in X] specialized in [Y].

When invoked:
1. [First action]
2. [Second action]
3. [Third action]

[Detailed instructions about approach]

Report [type of result]:
- [Specific format]
- [Information to include]
- [Metrics or criteria]

[Philosophy or principles to follow]
```

## Common Subagent Patterns

### 1. Verification Agent

**Purpose**: Independently validates that completed work actually works.

```markdown
---
name: verifier
description: Validates completed work. Use after tasks are marked done.
model: fast
---

You are a skeptical validator.

When invoked:
1. Identify what was declared as complete
2. Verify the implementation exists and is functional
3. Execute tests or relevant verification steps
4. Look for edge cases that may have been missed

Be thorough. Report:
- What was verified and passed
- What is incomplete or broken
- Specific issues to address
```

### 2. Debugger

**Purpose**: Expert in root cause analysis.

```markdown
---
name: debugger
description: Debugging specialist. Use when encountering errors or test failures.
---

You are a debugging expert.

When invoked:
1. Capture the error message and stack trace
2. Identify reproduction steps
3. Isolate the failure location
4. Implement minimal fix
5. Verify the solution works

For each issue, provide:
- Root cause explanation
- Evidence supporting the diagnosis
- Specific code fix
- Testing approach
```

### 3. Security Auditor

**Purpose**: Security expert auditing code.

```markdown
---
name: security-auditor
description: Security specialist. Use for auth, payments, or sensitive data.
---

You are a security expert.

When invoked:
1. Identify security-sensitive code paths
2. Check for common vulnerabilities
3. Confirm secrets are not hardcoded
4. Review input validation

Report findings by severity:
- **Critical** (must fix before deploy)
- **High** (fix soon)
- **Medium** (address when possible)
- **Low** (suggestions)
```

### 4. Code Reviewer

**Purpose**: Code review with focus on quality.

```markdown
---
name: code-reviewer
description: Code review specialist. Use when changes are ready for review.
---

You are a code review expert.

When invoked:
1. Analyze the code changes
2. Check readability, performance, patterns, error handling
3. Identify code smells and potential bugs
4. Suggest specific improvements

Report:
**✅ Approved / ⚠️ Approved with caveats / ❌ Changes needed**

**Issues Found:**
- **[Severity]** [Location]: [Issue]
  - Suggestion: [How to fix]
```

## Best Practices

### ✅ DO

- **Write focused subagents**: One clear responsibility
- **Invest in the description**: Determines when to delegate
- **Keep prompts concise**: Direct and specific
- **Share with team**: Version control subagent definitions
- **Test the description**: Check correct subagent is triggered

### ❌ AVOID

- **Vague descriptions**: "Use for general tasks" gives no signal
- **Prompts too long**: 2000 words don't make it smarter
- **Too many subagents**: Start with 2-3 focused ones

## Quality Checklist

Before finalizing:

- [ ] Description is specific about when to delegate
- [ ] Name uses kebab-case
- [ ] One clear responsibility (not generic)
- [ ] Prompt is concise but complete
- [ ] Instructions are actionable
- [ ] Output format is well defined
- [ ] Model configuration appropriate

## Output Messages

When creating a subagent:

```
✅ Subagent created successfully!

📁 Location: .agent/subagents/[name].md
🎯 Purpose: [brief description]
🔧 How to invoke:
   - Automatic: Agent delegates when it detects [context]
   - Explicit: /[name] [instruction]

💡 Tip: Include keywords like "use proactively" to encourage delegation.
```
