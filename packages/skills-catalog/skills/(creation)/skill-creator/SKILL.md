---
name: skill-creator
description: Guide for creating effective AI agent skills. Use when users want to create a new skill (or update an existing skill) that extends an AI agent's capabilities with specialized knowledge, workflows, or tool integrations. Works with any agent that supports the SKILL.md format (Claude Code, Cursor, Roo, Cline, Windsurf, etc.). Triggers on "create skill", "new skill", "package knowledge", "skill for".
---

# Skill Creator

This skill provides guidance for creating effective, agent-agnostic skills.

## About Skills

Skills are modular, self-contained packages that extend AI agent capabilities by providing specialized knowledge, workflows, and tools. Think of them as "onboarding guides" for specific domains or tasks—they transform a general-purpose agent into a specialized agent equipped with procedural knowledge.

### What Skills Provide

1. **Specialized workflows** - Multi-step procedures for specific domains
2. **Tool integrations** - Instructions for working with specific file formats or APIs
3. **Domain expertise** - Company-specific knowledge, schemas, business logic
4. **Bundled resources** - Scripts, references, and assets for complex and repetitive tasks

## Core Principles

### Concise is Key

The context window is a public good. Skills share context with everything else the agent needs.

**Default assumption: The agent is already very smart.** Only add context it doesn't already have. Challenge each piece of information: "Does the agent really need this?" and "Does this paragraph justify its token cost?"

Prefer concise examples over verbose explanations.

### Anatomy of a Skill

Every skill consists of a required SKILL.md file and optional bundled resources:

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter metadata (required)
│   │   ├── name: (required)
│   │   └── description: (required)
│   └── Markdown instructions (required)
└── Bundled Resources (optional)
    ├── scripts/          - Executable code (Python/Bash/etc.)
    ├── references/       - Documentation loaded into context as needed
    └── assets/           - Files used in output (templates, icons, fonts, etc.)
```

#### SKILL.md (required)

Every SKILL.md consists of:

- **Frontmatter** (YAML): Contains `name` and `description` fields. These are the only fields read to determine when the skill gets used—be clear and comprehensive.
- **Body** (Markdown): Instructions and guidance for using the skill. Only loaded AFTER the skill triggers.

#### Bundled Resources (optional)

##### Scripts (`scripts/`)

Executable code for tasks that require deterministic reliability or are repeatedly rewritten.

- **When to include**: When the same code is being rewritten repeatedly
- **Example**: `scripts/rotate_pdf.py` for PDF rotation tasks
- **Benefits**: Token efficient, deterministic

##### References (`references/`)

Documentation and reference material loaded as needed into context.

- **When to include**: For documentation the agent should reference while working
- **Examples**: `references/schema.md` for database schemas, `references/api_docs.md` for API specifications
- **Benefits**: Keeps SKILL.md lean, loaded only when needed

##### Assets (`assets/`)

Files not intended to be loaded into context, but used within output.

- **When to include**: When the skill needs files for final output
- **Examples**: `assets/logo.png` for brand assets, `assets/template.html` for HTML boilerplate

### Progressive Disclosure

Skills use a three-level loading system:

1. **Metadata (name + description)** - Always in context (~100 words)
2. **SKILL.md body** - When skill triggers (<5k words)
3. **Bundled resources** - As needed (unlimited)

Keep SKILL.md body under 500 lines. Split content into separate files when approaching this limit.

## Skill Creation Process

### Step 1: Understand the Skill

Clarify with concrete examples:

- "What functionality should this skill support?"
- "Can you give examples of how this skill would be used?"
- "What would trigger this skill?"

### Step 2: Plan Reusable Contents

Analyze each example:

1. Consider how to execute from scratch
2. Identify helpful scripts, references, and assets

### Step 3: Create the Skill

Create the skill directory:

```
skill-name/
├── SKILL.md
├── scripts/     (if needed)
├── references/  (if needed)
└── assets/      (if needed)
```

### Step 4: Write SKILL.md

#### Frontmatter

```yaml
---
name: skill-name
description: What the skill does and when to use it. Include specific triggers and contexts. Max 1024 characters.
---
```

**Description guidelines:**
- Include both what the skill does AND when to use it
- Include trigger phrases
- Max 1024 characters, no XML tags
- Write in third person

#### Body

Write instructions for using the skill. Include:
- Quick start guide
- Step-by-step workflow
- Links to reference files when needed

### Step 5: Test and Iterate

1. Use the skill on real tasks
2. Notice struggles or inefficiencies
3. Update SKILL.md or resources accordingly
4. Test again

## Quality Checklist

Before finalizing:

- [ ] Description is specific about when to use (max 1024 chars)
- [ ] Folder name uses kebab-case
- [ ] Instructions are actionable and unambiguous
- [ ] Scope is focused (one responsibility)
- [ ] SKILL.md body < 500 lines
- [ ] References are one level deep from SKILL.md

## Output Messages

When creating a skill, inform the user:

```
✅ Skill created successfully!

📁 Location: .agent/skills/[name]/SKILL.md
🎯 Purpose: [brief description]
🔧 How to test: [example prompt that should trigger the skill]

💡 Tip: The agent will use this skill automatically when it detects [context].
```
