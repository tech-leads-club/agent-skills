# Confluence Assistant Skill

This skill provides expert Confluence operations using Atlassian MCP tools. It checks the conversation context for site details and prompts the user if they are not available.

## Configuration

No configuration files are required. The skill resolves your Confluence site in this order:

1. **Conversation context** — if you've already mentioned a Cloud ID or site URL, it uses that
2. **Interactive prompt** — if not found, it asks: "Which Confluence site should I use? Please provide a Cloud ID (UUID) or site URL (e.g. `https://example.atlassian.net/`)"

### Cloud ID Format

The Cloud ID can be provided in two formats:

- **Site URL**: `https://your-site.atlassian.net/`
- **UUID**: A UUID obtained from `getAccessibleAtlassianResources`

Both formats are accepted and work with all Confluence operations.

## Usage

Simply start a request and the skill handles site resolution automatically:

> "Find the onboarding documentation page"
> "Create a new ADR in the TECH space"
> "Update the API docs with the new endpoints"

You can also include the site URL directly in your request to skip the prompt:

> "Search pages in https://example.atlassian.net/ about onboarding"

Once resolved, the Cloud ID is reused for all operations in the conversation.

## Supported Operations

- Searching pages and documentation
- Creating new pages
- Updating existing pages
- Listing and navigating spaces
- Adding comments to pages
- Getting page details

## Troubleshooting

**Wrong site being used:**

- Specify the correct site URL or Cloud ID directly in your next message to override

**Cloud ID format issues:**

- Both URL and UUID formats are accepted
- If using a URL, ensure it includes the protocol (`https://`)
- If using a UUID, ensure it's the correct format from `getAccessibleAtlassianResources`
