---
name: cursor-skill-creator
description: Creates Cursor-specific AI agent skills with SKILL.md format. Use when creating skills for Cursor editor specifically, following Cursor's patterns and directories (.cursor/skills/). Triggers on "cursor skill", "create cursor skill".
---

# Cursor Skill Creator

You are an expert in creating Agent Skills following Cursor's pattern.

## When to Use This Skill

Use this skill when the user asks to:

- Create a new skill
- Package domain-specific knowledge
- Create reusable capabilities for the agent
- Transform a repetitive process into a skill
- Create quick, one-off actions (not complex tasks with multiple steps)

**DO NOT use for complex tasks that require multiple steps** - for those, use subagents.

## Skill Structure

A skill is a `SKILL.md` file inside a folder in `.cursor/skills/` (project) or `~/.cursor/skills/` (user).

### File Format

```markdown
---
description: Short and objective description of what the skill does and when to use it (appears in menus). This description is used by the agent to decide when to apply the skill.
name: Readable Skill Name (optional - if omitted, uses folder name)
---

# Skill Title

Detailed instructions for the agent on how to use this skill.

## When to Use

- Use this skill when...
- This skill is useful for...
- Apply in situations where...

## Step-by-Step Instructions

1. First do this...
2. Then do that...
3. Finish with...

## Conventions and Best Practices

- Always do X
- Never do Y
- Prefer Z when...

## Examples (optional)

### Example 1: Example Title

Input:
```

example input

```

Expected output:
```

example output

```

## Important Notes

- Important note 1
- Important note 2
```

## Skill Creation Process

When creating a skill, follow these steps:

### 1. Understand the Purpose

- What specific problem does the skill solve?
- When should the agent use this skill?
- Is it a one-off/quick task (skill) or complex/multi-step (subagent)?
- Who will use it (specific project or all projects)?

### 2. Choose the Location

- **Project**: `.cursor/skills/skill-name/SKILL.md` - only for the current project
- **User**: `~/.cursor/skills/skill-name/SKILL.md` - available in all projects

**Naming convention:**

- Use kebab-case (words-separated-by-hyphens)
- Be descriptive but concise
- Examples: `format-imports`, `generate-tests`, `review-security`

### 3. Write the Description

The description is CRITICAL - it determines when the agent uses the skill.

**Good descriptions:**

- "Formats TypeScript imports in alphabetical order and removes duplicates"
- "Generates Jest unit tests for React components following project patterns"
- "Reviews code for common security vulnerabilities (SQL injection, XSS, CSRF)"

**Bad descriptions (avoid):**

- "Helps with code" (too vague)
- "Does useful things" (not specific)
- "General skill" (no context of when to use)

**Formula for good descriptions:**

```
[Specific action] + [in which context] + [following which criteria/patterns]
```

### 4. Structure the Instructions

The instructions should be:

- **Specific**: Clear and unambiguous steps
- **Actionable**: The agent can execute directly
- **Focused**: One clear responsibility
- **Complete**: Include all necessary details

**Organize into sections:**

1. **When to Use**: Clear triggers for application
2. **Main Instructions**: Detailed step-by-step
3. **Conventions**: Domain-specific rules and patterns
4. **Examples**: Concrete use cases (optional but useful)
5. **Notes**: Warnings, limitations, special cases

### 5. Be Concise but Complete

- Avoid long, rambling prompts (dilute focus)
- Be direct and specific
- Use lists and clear structure
- Include concrete examples when useful

### 6. Test and Refine

After creating the skill:

1. Test by making a prompt that should trigger the skill
2. Verify that the agent uses the skill correctly
3. Refine the description if the skill isn't triggered when expected
4. Adjust instructions if behavior isn't as expected

## Best Practices

### ✅ DO

- **Be specific in scope**: One skill = one clear responsibility
- **Invest in the description**: It's how the agent decides to use the skill
- **Use clear structure**: Headers, lists, examples
- **Add to version control**: Share with the team
- **Start simple**: Add complexity as needed
- **Use concrete examples**: Demonstrate expected behavior

### ❌ AVOID

- **Generic skills**: "Helps with general tasks" is not useful
- **Long prompts**: 2000 words don't make the skill smarter
- **Duplicating slash commands**: If it's single-purpose, maybe a command is better
- **Too many skills**: Start with 2-3 focused ones, add when needed
- **Vague descriptions**: "Use for general tasks" gives no signal to the agent
- **Complex tasks**: If it requires multiple steps and isolated context, use subagent

## Skills vs Subagents vs Slash Commands

Use this decision tree:

```
Is task single-purpose and instant?
├─ YES → Is it a custom command?
│         ├─ YES → Use slash command
│         └─ NO → Use skill
│
└─ NO → Does it require multiple steps and isolated context?
          ├─ YES → Use subagent
          └─ NO → Use skill
```

**Examples:**

- **Skill**: "Generate a changelog based on commits since last tag"
- **Skill**: "Format all imports following the style guide"
- **Subagent**: "Implement complete OAuth authentication with tests"
- **Subagent**: "Investigate and fix all failing tests"
- **Slash Command**: `/fix` to fix linter errors

## Quick Template

Use this template when creating a skill:

```markdown
---
description: [Specific action] for [context] following [pattern/criteria]
---

# [Skill Name]

You are an expert in [specific domain].

## When to Use

Use this skill when:

- [Trigger 1]
- [Trigger 2]
- [Trigger 3]

## Process

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Criteria and Conventions

- [Rule 1]
- [Rule 2]
- [Rule 3]

## Output Format (if applicable)

[Describe the expected output format]
```

## Well-Structured Skill Examples

### Example 1: Import Formatter

````markdown
---
description: Organizes and formats JavaScript/TypeScript imports in alphabetical order, groups by type (external, internal, types) and removes duplicates.
---

# Import Formatter

## When to Use

- When finishing a file with disorganized imports
- When asked to "organize imports"
- Before commits to maintain consistency

## Process

1. Identify all import statements
2. Classify into groups:
   - External (node_modules)
   - Internal (relative paths and aliases)
   - Types (import type)
3. Sort alphabetically within each group
4. Remove duplicates
5. Add blank line between groups

## Expected Format

```typescript
// External
import { useState } from "react";
import axios from "axios";

// Internal
import { Button } from "@/components/Button";
import { utils } from "../utils";

// Types
import type { User } from "@/types";
```
````

````

### Example 2: Changelog Generator

```markdown
---
description: Generates formatted changelog based on Git commits since last tag, categorizing by type (feat, fix, docs, etc.) following Conventional Commits.
---

# Changelog Generator

## When to Use

- When preparing a release
- When asked to "generate changelog"
- To document changes between versions

## Process

1. Fetch commits since last git tag
2. Parse messages following Conventional Commits
3. Categorize by type:
   - ✨ Features (feat:)
   - 🐛 Fixes (fix:)
   - 📚 Docs (docs:)
   - 🔧 Chore (chore:)
   - ♻️ Refactor (refactor:)
4. Format in markdown with bullet points
5. Include breaking changes in separate section

## Output Format

```markdown
## [Version] - [Date]

### ✨ Features
- feat(auth): add OAuth login
- feat(api): endpoint for file upload

### 🐛 Fixes
- fix(ui): fix responsive menu
- fix(db): resolve race condition in transactions

### 📚 Documentation
- docs: update README with new endpoints

### ⚠️ BREAKING CHANGES
- feat(api)!: remove endpoint /v1/legacy
````

```

## Creation Outputs

When creating a skill, you should:

1. **Create the directory**: `.cursor/skills/[skill-name]/`
2. **Create the file**: `SKILL.md` inside the directory
3. **Confirm location**: Inform where the skill was created
4. **Explain usage**: How to test/use the skill
5. **Suggest improvements**: If relevant, suggest refinements

## Quality Checklist

Before finalizing a skill, verify:

- [ ] Description is specific and clear about when to use
- [ ] Folder name uses kebab-case
- [ ] Instructions are actionable and unambiguous
- [ ] Scope is focused (one responsibility)
- [ ] Concrete examples are included (if applicable)
- [ ] Sections are well organized
- [ ] It's not a complex task (that should be a subagent)
- [ ] Output format is clear (if applicable)

## Output Messages

When creating a skill, inform the user:

```

✅ Skill created successfully!

📁 Location: .cursor/skills/[name]/SKILL.md
🎯 Purpose: [brief description]
🔧 How to test: [example prompt that should trigger the skill]

💡 Tip: The agent will use this skill automatically when it detects [context].
You can also mention it explicitly in prompts.

```

---

## Remember

Skills are for **reusable knowledge and one-off actions**. For complex tasks with multiple steps, delegation, and isolated context, use **subagents** instead of skills.
```
