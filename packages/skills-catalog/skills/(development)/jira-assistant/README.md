# Jira Assistant Skill

This skill provides expert Jira operations using Atlassian MCP tools. It automatically detects workspace Jira configuration from context or prompts for project details.

## Configuration Requirements

The skill requires the following configuration values to be available in your workspace context:

### Required Values

- **Project Key** - The Jira project key (e.g., `KAN`, `PROJ`, `DEV`)
- **Cloud ID** - Your Atlassian Cloud ID (UUID format or site URL)
- **URL** - Your Atlassian site URL (e.g., `https://example.atlassian.net/`)

### Optional Values

- **Project Name** - Human-readable project name
- **Board URL** - Link to your Jira board (optional, for convenience)

## Where to Configure

The skill detects configuration from multiple sources, making it compatible with different IDEs and setups:

### Option 1: Cursor Rules (`.cursor/rules/jira-config.mdc`)

If you're using Cursor, create a rule file:

```yaml
---
alwaysApply: false
---

# Jira Project Configuration

This workspace uses the following Jira configuration:

- **Project Key:** YOUR_PROJECT_KEY
- **Cloud ID:** your-cloud-id-uuid-or-url
- **URL:** https://your-site.atlassian.net/
- **Project Name:** Your Project Name (optional)
- **Board URL:** https://your-site.atlassian.net/jira/software/projects/YOUR_PROJECT_KEY/boards/1 (optional)
```

### Option 2: AGENTS.md

If you're using another IDE or prefer AGENTS.md, add the configuration there:

```markdown
# Jira Configuration

- **Project Key:** YOUR_PROJECT_KEY
- **Cloud ID:** your-cloud-id-uuid-or-url
- **URL:** https://your-site.atlassian.net/
- **Project Name:** Your Project Name (optional)
- **Board URL:** https://your-site.atlassian.net/jira/software/projects/YOUR_PROJECT_KEY/boards/1 (optional)
```

### Option 3: Other Context Sources

The skill will also detect configuration from:

- Workspace documentation files
- Project README files
- Any markdown files in your workspace that contain Jira configuration

### Option 4: Interactive Prompt

If no configuration is found, the skill will:

1. Use MCP tools to discover available Jira projects
2. Prompt you to select your project
3. Store the selection for the current conversation

## Configuration Detection Flow

When the skill is activated, it follows this detection order:

1. **Check workspace context** - Looks for Jira configuration in:

   - `.cursor/rules/jira-config.mdc` (Cursor)
   - `AGENTS.md` (any IDE)
   - Other workspace documentation files

2. **If not found** - Uses MCP search to discover available projects

3. **If still unclear** - Prompts user to specify project key

4. **Uses detected values** - Applies configuration for all operations

## Example Configuration

Here's a complete example configuration:

```markdown
# Jira Project Configuration

- **Project Key:** KAN
- **Cloud ID:** d58e860b-469d-4463-8f46-684934a5a851
- **URL:** https://techleadsclub.atlassian.net/
- **Project Name:** Tech Leads Club
- **Board URL:** https://techleadsclub.atlassian.net/jira/software/projects/KAN/boards/1
```

## Usage

Once configured, the skill automatically uses your project settings for:

- Searching issues
- Creating tasks, epics, and subtasks
- Updating issues
- Transitioning issue status
- Adding comments
- Querying with JQL

All operations will use your configured project key and cloud ID automatically.

## Troubleshooting

**Skill can't find configuration:**

- Ensure your configuration file is in the workspace root or `.cursor/rules/` directory
- Check that the file contains the required values (Project Key, Cloud ID, URL)
- Verify the format matches the examples above

**Wrong project being used:**

- Check your configuration file for the correct project key
- The skill uses the first valid configuration it finds
- You can override by specifying the project in your request

**Configuration not detected:**

- The skill will prompt you interactively if no configuration is found
- You can also specify project details directly in your request: "Create a task in PROJECT_KEY project"

## Compatibility

This skill works with:

- Cursor IDE (via `.cursor/rules/`)
- Any IDE supporting AGENTS.md
- Any workspace with accessible configuration files
- Interactive mode (prompts for configuration)
