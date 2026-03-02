---
name: skillboss-gateway
description: Access 100+ AI services through a unified OpenAI-compatible API. Use when switching between LLMs (Claude, GPT, Gemini), generating images (DALL-E, Midjourney, Flux), creating videos (Runway, Kling, Veo 2), or synthesizing voice (ElevenLabs). One API key for all services.
metadata:
  author: github.com/heeyo-life
  version: '1.0.0'
---

# SkillBoss AI Gateway

Access 100+ AI services through a single, OpenAI-compatible API. One API key for all services.

## Prerequisites

- Get your API key at https://skillboss.co/dashboard
- No vendor accounts needed - SkillBoss handles all provider authentication

## Quick Start

**Using OpenAI SDK (any language):**

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-skillboss-key",
    base_url="https://api.heybossai.com/v1"
)

response = client.chat.completions.create(
    model="claude-sonnet-4-5-20250929",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

**Using curl:**

```bash
curl https://api.heybossai.com/v1/chat/completions \
  -H "Authorization: Bearer $SKILLBOSS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-5", "messages": [{"role": "user", "content": "Hello"}]}'
```

## Available Services

| Category | Services |
|----------|----------|
| **LLMs** | Claude Opus 4.6, GPT-5, Gemini 3 Pro, DeepSeek R1 |
| **Images** | DALL-E, Midjourney, Flux 1.1 Pro, Stable Diffusion |
| **Videos** | Runway Gen-4, Kling, Veo 2 |
| **Voice** | ElevenLabs, OpenAI TTS/STT |
| **Scraping** | Firecrawl, Jina AI |

## MCP Server Installation

Add to your MCP settings (Claude Code, Cursor, Windsurf, Antigravity):

```json
{
  "mcpServers": {
    "skillboss": {
      "command": "npx",
      "args": ["-y", "@skillboss/mcp-server"],
      "env": { "SKILLBOSS_API_KEY": "your-key" }
    }
  }
}
```

## Examples

### Switch Between LLMs

```python
# Same code works with any model
models = ["claude-sonnet-4-5-20250929", "gpt-5", "gemini-3-pro"]
for model in models:
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": "Explain quantum computing"}]
    )
```

### Generate Images

```python
response = client.images.generate(
    model="flux-1.1-pro",
    prompt="A futuristic city at sunset",
    size="1024x1024"
)
print(response.data[0].url)
```

### Text-to-Speech

```python
response = client.audio.speech.create(
    model="elevenlabs/eleven_multilingual_v2",
    voice="rachel",
    input="Welcome to SkillBoss!"
)
response.stream_to_file("output.mp3")
```

## Troubleshooting

### Authentication Failed

Verify your API key at https://skillboss.co/dashboard

### Model Not Found

Check supported models at https://skillboss.co/docs/models

### Rate Limited

SkillBoss handles rate limiting across providers. If limited, wait a moment and retry.

## Resources

- **Website:** https://skillboss.co
- **Docs:** https://skillboss.co/docs
- **Models:** https://skillboss.co/docs/models
- **GitHub:** https://github.com/heeyo-life/skillboss-mcp
- **npm:** https://www.npmjs.com/package/@skillboss/mcp-server
