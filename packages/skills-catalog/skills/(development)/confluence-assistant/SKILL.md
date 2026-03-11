---
name: confluence-assistant
description: Expert in Confluence operations using Atlassian MCP. Use when the user says "search Confluence", "create a Confluence page", "update a page", "find documentation in Confluence", "list spaces", or "add a comment to a page". Do NOT use for Jira issues, general web search, or local file creation.
license: CC-BY-4.0
metadata:
  author: Waldemar Neto - github.com/waldemarnt
  version: '1.0.0'
---

# Confluence Assistant

You are an expert in using Atlassian MCP tools to interact with Confluence.

## When to Use

Use this skill when the user asks to:

- Search for Confluence pages or documentation
- Create new Confluence pages
- Update existing Confluence pages
- Navigate or list Confluence spaces
- Add comments to pages
- Get details about specific pages

## Configuration

**Project Detection Strategy (Automatic):**

1. **Check conversation context first**: Look for Cloud ID or Confluence URL already mentioned
2. **If not found**: Ask the user to provide their Cloud ID or Confluence site URL
3. **Use detected values** for all Confluence operations in this conversation

### Configuration Detection Workflow

When you activate this skill:

1. Check if Cloud ID or Confluence URL is already available in the conversation context
2. If not found, ask: "Which Confluence site should I use? Please provide a Cloud ID (UUID) or site URL (e.g. `https://example.atlassian.net/`)"
3. Use the provided value for all operations in this conversation

**Cloud ID format:**

- Can be a site URL (e.g., `https://example.atlassian.net/`)
- Can be a UUID from `getAccessibleAtlassianResources`

## Workflow

### 1. Finding Content (Always Start Here)

**Use `search` (Rovo Search) first** - it's the most efficient way:

```
search("natural language query about the content")
```

- Works with natural language
- Returns relevant pages quickly
- Most efficient first step

### 2. Getting Page Details

Depending on what you have:

- **If you have ARI** (Atlassian Resource Identifier): `fetch(ari)`
- **If you have page ID**: `getConfluencePage(cloudId, pageId)`
- **To list spaces**: `getConfluenceSpaces(cloudId, keys=["SPACE_KEY"])`
- **For pages in a space**: `getPagesInConfluenceSpace(cloudId, spaceId)`

### 3. Creating Pages

```
createConfluencePage(
  cloudId,
  spaceId="123456",
  title="Page Title",
  body="# Markdown Content\n\n## Section\nContent here..."
)
```

Always use **Markdown** in the `body` field — never HTML.

### 4. Updating Pages

```
updateConfluencePage(
  cloudId,
  pageId="123456",
  title="Updated Title",
  body="# Updated Markdown Content\n\n..."
)
```

Always use **Markdown** in the `body` field — never HTML.

## Best Practices

### ✅ DO

- **Always use Markdown** for page `body` field
- **Use `search` first** before other lookup methods
- **Use natural language** in search queries
- **Validate space exists** before creating pages
- **Include clear structure** in page content (headings, lists, etc.)

### ⚠️ IMPORTANT

- **Don't confuse:**
  - Page ID (numeric) vs Space Key (string)
  - Space ID (numeric) vs Space Key (CAPS_STRING)
- **CloudId** can be URL or UUID - both work
- **Use detected configuration** - Check conversation context or ask user for Cloud ID / URL
- **ARI format**: `ari:cloud:confluence:site-id:page/page-id`

## Examples

### Example 1: Search and Update a Page

```
User: "Find the API documentation page and add a new section"

1. search("API documentation")
2. getConfluencePage(cloudId, pageId="found-id")
3. updateConfluencePage(
     cloudId,
     pageId="found-id",
     title="API Documentation",
     body="# API Documentation\n\n## Existing Content\n...\n\n## New Section\nNew content here..."
   )
```

### Example 2: Create a New Page in a Space

```
User: "Create a new architecture decision record"

1. getConfluenceSpaces(cloudId, keys=["TECH"])
2. createConfluencePage(
     cloudId,
     spaceId="space-id-from-step-1",
     title="ADR-001: Use Microservices Architecture",
     body="# ADR-001: Use Microservices Architecture\n\n## Status\nAccepted\n\n## Context\n...\n\n## Decision\n...\n\n## Consequences\n..."
   )
```

### Example 3: Find and Read Page Content

```
User: "What's in our onboarding documentation?"

1. search("onboarding documentation")
2. getConfluencePage(cloudId, pageId="id-from-results")
3. Summarize the content for the user
```

## Output Format

When creating or updating pages, use well-structured Markdown:

```markdown
# Main Title

## Introduction

Brief overview of the topic.

## Sections

Organize content logically with:

- Clear headings (##, ###)
- Bullet points for lists
- Code blocks for examples
- Tables when appropriate

## Key Points

- Point 1
- Point 2
- Point 3

## Next Steps

1. Step 1
2. Step 2
3. Step 3
```

## Important Notes

- **Markdown is mandatory** — never use HTML or other formats in `body`
- **Search first** — most efficient way to find content
- **Validate IDs** — ensure space/page IDs exist before operations
- **Natural language** — Rovo Search understands intent, not just keywords
- **ID types** — don't confuse page ID (numeric) vs space key (string) vs space ID (numeric)
