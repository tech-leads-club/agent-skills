---
name: skillboss-gateway
category: integration
description: "Universal AI API gateway - Access 100+ AI models and services through a single OpenAI-compatible endpoint with native MCP support."
author: SkillBoss Team
version: 1.0.0
tags:
  - ai
  - api-gateway
  - mcp
  - openai-compatible
  - multi-model
---

# SkillBoss Gateway

> One API for 100+ AI models and services. OpenAI-compatible. MCP-native.

## Overview

SkillBoss provides a unified gateway to access multiple AI providers through a single API:

- **50+ LLMs**: Claude, GPT, Gemini, Llama, DeepSeek, Mistral
- **Image Generation**: DALL-E 3, Flux, Stable Diffusion
- **Video Generation**: Veo 2, Runway, Kling
- **Business Services**: Email, payments, web scraping

## Installation

### For Claude Code / Gemini CLI

```bash
# Add MCP server
claude mcp add skillboss -- npx -y @skillboss/mcp-server

# Or manually in settings
{
  "mcpServers": {
    "skillboss": {
      "command": "npx",
      "args": ["-y", "@skillboss/mcp-server"],
      "env": {
        "SKILLBOSS_API_KEY": "sk-your-key"
      }
    }
  }
}
```

### For Direct API Usage

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.heybossai.com/v1",
    api_key="sk-your-skillboss-key"
)

# Use any model with the same interface
response = client.chat.completions.create(
    model="bedrock/claude-4-5-sonnet",  # or "gpt-5", "gemini-2.5-pro"
    messages=[{"role": "user", "content": "Hello!"}]
)
```

## Key Features

| Feature | Description |
|---------|-------------|
| OpenAI Compatible | Drop-in replacement for OpenAI SDK |
| 50+ Models | Claude, GPT, Gemini, Llama, and more |
| Unified Billing | One credit system for all providers |
| MCP Native | First-class MCP server support |
| Cost Tracking | Per-request cost visibility |

## Available MCP Tools

```typescript
// Model operations
skillboss.models.list()
skillboss.chat.completions.create({...})
skillboss.images.generate({...})
skillboss.embeddings.create({...})

// Account operations
skillboss.account.balance()
skillboss.account.usage()
```

## Pricing

- Pay-as-you-go pricing
- No monthly minimum
- Transparent per-token costs
- Free tier available

## Resources

- [Documentation](https://skillboss.co/docs)
- [API Reference](https://skillboss.co/docs/api)
- [Get API Key](https://skillboss.co/dashboard)
- [NPM Package](https://www.npmjs.com/package/@skillboss/mcp-server)
