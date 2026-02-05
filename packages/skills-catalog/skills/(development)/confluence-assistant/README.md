# Confluence Assistant Skill

This skill provides expert Confluence operations using Atlassian MCP tools. It automatically detects workspace Confluence configuration from context or prompts for site details.

## Configuration Requirements

The skill requires the following configuration values to be available in your workspace context:

### Required Values

- **Cloud ID** - Your Atlassian Cloud ID (UUID format or site URL)
- **URL** - Your Atlassian site URL (e.g., `https://example.atlassian.net/`)

### Cloud ID Format

The Cloud ID can be provided in two formats:

- **Site URL**: `https://your-site.atlassian.net/`
- **UUID**: A UUID obtained from `getAccessibleAtlassianResources`

Both formats are accepted and will work with all Confluence operations.

## Where to Configure

The skill detects configuration from multiple sources, making it compatible with different IDEs and setups:

### Option 1: Cursor Rules (`.cursor/rules/confluence-config.mdc`)

If you're using Cursor, create a rule file:

```yaml
---
alwaysApply: false
---

# Confluence Configuration

This workspace uses the following Confluence configuration:

- **Cloud ID:** your-cloud-id-uuid-or-url
- **URL:** https://your-site.atlassian.net/

The Cloud ID can be:
- A site URL (e.g., `https://your-site.atlassian.net/`)
- A UUID from `getAccessibleAtlassianResources`
```

### Option 2: AGENTS.md

If you're using another IDE or prefer AGENTS.md, add the configuration there:

```markdown
# Confluence Configuration

- **Cloud ID:** your-cloud-id-uuid-or-url
- **URL:** https://your-site.atlassian.net/

The Cloud ID can be:

- A site URL (e.g., `https://your-site.atlassian.net/`)
- A UUID from `getAccessibleAtlassianResources`
```

### Option 3: Other Context Sources

The skill will also detect configuration from:

- Workspace documentation files
- Project README files
- Any markdown files in your workspace that contain Confluence configuration

### Option 4: Interactive Prompt

If no configuration is found, the skill will:

1. Use MCP tools to discover available Confluence sites
2. Use `getAccessibleAtlassianResources` to list available resources
3. Prompt you to select your Confluence site
4. Store the selection for the current conversation

## Configuration Detection Flow

When the skill is activated, it follows this detection order:

1. **Check workspace context** - Looks for Confluence configuration in:

   - `.cursor/rules/confluence-config.mdc` (Cursor)
   - `AGENTS.md` (any IDE)
   - Other workspace documentation files

2. **If not found** - Uses MCP search to discover available Confluence sites:

   - `search("confluence sites I have access to")`
   - `getAccessibleAtlassianResources`

3. **If still unclear** - Prompts user to specify Cloud ID or URL

4. **Uses detected values** - Applies configuration for all operations

## Example Configuration

Here's a complete example configuration:

```markdown
# Confluence Configuration

- **Cloud ID:** d58e860b-469d-4463-8f46-684934a5a851
- **URL:** https://techleadsclub.atlassian.net/

The Cloud ID can be:

- A site URL (e.g., `https://techleadsclub.atlassian.net/`)
- A UUID from `getAccessibleAtlassianResources`
```

## Usage

Once configured, the skill automatically uses your site settings for:

- Searching pages and documentation
- Creating new pages
- Updating existing pages
- Listing and navigating spaces
- Adding comments to pages
- Getting page details

All operations will use your configured Cloud ID automatically.

## Troubleshooting

**Skill can't find configuration:**

- Ensure your configuration file is in the workspace root or `.cursor/rules/` directory
- Check that the file contains the required values (Cloud ID, URL)
- Verify the format matches the examples above

**Wrong site being used:**

- Check your configuration file for the correct Cloud ID or URL
- The skill uses the first valid configuration it finds
- You can override by specifying the site in your request

**Configuration not detected:**

- The skill will prompt you interactively if no configuration is found
- You can also specify site details directly in your request: "Search pages in https://example.atlassian.net/"

**Cloud ID format issues:**

- Both URL and UUID formats are accepted
- If using URL, ensure it includes the protocol (`https://`)
- If using UUID, ensure it's the correct format from `getAccessibleAtlassianResources`

## Compatibility

This skill works with:

- Cursor IDE (via `.cursor/rules/`)
- Any IDE supporting AGENTS.md
- Any workspace with accessible configuration files
- Interactive mode (prompts for configuration)
