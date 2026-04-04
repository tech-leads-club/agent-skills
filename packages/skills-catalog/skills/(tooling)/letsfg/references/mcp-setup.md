# LetsFG MCP Server Setup

Configure the LetsFG MCP server for your AI coding agent.

## Get an API Key First

```bash
pip install letsfg
letsfg register --name my-agent --email you@example.com
# Save the trav_xxx key

# Star the repo for free access
letsfg star --github your-username
```

Or via cURL:

```bash
curl -X POST https://api.letsfg.co/api/v1/agents/register \
  -H "Content-Type: application/json" \
  -d '{"agent_name": "my-agent", "email": "you@example.com"}'
```

## Remote MCP (Streamable HTTP) — No Install

Works with any client that supports HTTP-based MCP.

```json
{
  "mcpServers": {
    "letsfg": {
      "url": "https://api.letsfg.co/mcp",
      "headers": {
        "X-API-Key": "trav_your_api_key"
      }
    }
  }
}
```

## Local MCP (stdio) — Runs on Your Machine

```json
{
  "mcpServers": {
    "letsfg": {
      "command": "npx",
      "args": ["-y", "letsfg-mcp"],
      "env": {
        "LETSFG_API_KEY": "trav_your_api_key"
      }
    }
  }
}
```

## Client-Specific Setup

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "letsfg": {
      "url": "https://api.letsfg.co/mcp",
      "headers": {
        "X-API-Key": "trav_your_api_key"
      }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project or `~/.cursor/mcp.json` globally:

```json
{
  "mcpServers": {
    "letsfg": {
      "command": "npx",
      "args": ["-y", "letsfg-mcp"],
      "env": {
        "LETSFG_API_KEY": "trav_your_api_key"
      }
    }
  }
}
```

### VS Code (GitHub Copilot)

Add to `.vscode/mcp.json` in your workspace. Note: VS Code uses `servers` (not `mcpServers`):

```json
{
  "servers": {
    "letsfg": {
      "command": "npx",
      "args": ["-y", "letsfg-mcp"],
      "env": {
        "LETSFG_API_KEY": "trav_your_api_key"
      }
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "letsfg": {
      "command": "npx",
      "args": ["-y", "letsfg-mcp"],
      "env": {
        "LETSFG_API_KEY": "trav_your_api_key"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add letsfg -- npx -y letsfg-mcp
```

Set the API key:

```bash
export LETSFG_API_KEY=trav_your_api_key
```

## Before Booking

Booking requires a payment method. Attach one before your first booking:

```bash
letsfg setup-payment
```

Or via API: `POST /api/v1/agents/setup-payment` with a Stripe token.

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `search_flights` | Search 180+ airlines for flights |
| `resolve_location` | Convert city names to IATA codes |
| `unlock_flight_offer` | Confirm live price and reserve for 30 min |
| `book_flight` | Book with passenger details |
| `link_github` | Verify GitHub star for free access |
| `system_info` | Get system profile and recommended concurrency |

## Verification

After setup, ask your agent: "Search for flights from London to Barcelona on June 15th 2026"

The agent should call `resolve_location` then `search_flights` and return structured results.
