---
name: seek-and-analyze-video
description: Search, import, and analyze video content using Memories.ai Large Visual Memory Model (LVMM) with persistent memory. Use when the user says "analyze this video", "search TikTok for", "find YouTube videos about", "summarize this meeting recording", "build a video knowledge base", "describe this image", or "remember this information". Do NOT use for general video playback, video editing, or downloading videos (those require different tools).
metadata:
  version: 1.0.0
  author: github.com/kennyzheng-builds
---

# Seek and Analyze Video

Find, analyze, and build knowledge from video content via the Memories.ai API with persistent memory across sessions.

## Overview

This skill enables AI agents to:
- Search and import videos from TikTok, YouTube, Instagram, and Vimeo
- Analyze and ask questions about video content
- Extract transcripts, summaries, and action items
- Build searchable knowledge bases from video content
- Store and retrieve text memories with semantic search
- Research social media trends and influencer patterns

Unlike general LLMs that lose context after each session, this skill maintains persistent video memory for cross-video semantic search.

## Setup

Require a Memories.ai API key before proceeding. If `MEMORIES_API_KEY` is not set, instruct the user:

1. Sign up at https://memories.ai (free tier: 100 credits available)
2. Get API key at https://memories.ai/app/service/key
3. Set environment variable: `export MEMORIES_API_KEY="your-key-here"`

Optionally set `MEMORIES_UNIQUE_ID` to isolate data by project (default: `"default"`).

All commands run via:
```bash
python scripts/memories_api.py <command> [args...]
```

## Workflow Router

Determine which workflow to follow based on user intent:

| User intent | Workflow | Action |
|---|---|---|
| Shares a video URL with a question, or asks to analyze/summarize a video | Video Q&A | Load [references/video_qa.md](references/video_qa.md) |
| Asks about trends on TikTok/YouTube/Instagram, or wants to analyze influencers | Social Research | Load [references/social_research.md](references/social_research.md) |
| Asks to summarize a meeting, take notes from a lecture, or extract action items | Video Notes | Load [references/video_notes.md](references/video_notes.md) |
| Asks to build a knowledge base, or query across multiple videos | Knowledge Base | Load [references/knowledge_base.md](references/knowledge_base.md) |
| Asks to describe an image or do a quick one-shot video analysis | Quick Caption | See below |
| Asks to remember/store something, or retrieve a previous note | Memory Management | See below |

Default to Video Q&A if a URL is present, or Memory Management if no media is involved.

## Quick Caption

Analyze a video or image without uploading to the library:

```bash
# Analyze video
python scripts/memories_api.py caption_video "<URL>" "<QUESTION>"

# Analyze image
python scripts/memories_api.py caption_image "<URL>" "<QUESTION>"

# Enable reasoning mode for complex analysis
python scripts/memories_api.py caption_video "<URL>" "<QUESTION>" --think
```

## Memory Management

Store and retrieve text knowledge with semantic search:

```bash
# Store a memory
python scripts/memories_api.py memory_add "content to remember" --tags "tag1,tag2"

# Search memories semantically
python scripts/memories_api.py memory_search "query"

# List all memories
python scripts/memories_api.py memory_list

# Query across all videos and memories simultaneously
python scripts/memories_api.py chat_personal "question about stored knowledge"
```

## Key Concepts

- **Video numbers** (`VI...`): Unique identifiers for indexed videos returned from upload/import operations.
- **`chat_personal`**: Query across ALL videos and memories simultaneously via MAG (Memory Augmented Generation). Prefer for cross-content questions.
- **`chat_video`**: Query a specific video. Use when the user refers to a particular video.
- **`caption_video`/`caption_image`**: One-shot analysis without uploading. Fast but not persistent.
- **Processing**: Videos require time to index after upload. Use `wait` to block or `video_info` to poll.
- **Tags**: Use consistently to organize content for filtered searches.
- **`--session-id`**: Pass the same integer across multiple chat calls to maintain conversation context.

## Error Handling

| Error | Meaning | Action |
|---|---|---|
| API Error 0402 | Out of credits | Inform user to check credits at memories.ai/app/service/key |
| API Error 0429 | Rate limited | Wait 3-5 seconds, retry once |
| No API key | MEMORIES_API_KEY not set | Guide user through setup above |
| Video stuck UNPARSE | Still processing | Use `wait` or check later; long videos need more time |
| Empty chat response | Usually credit issue | Check credits; try `chat_personal` as fallback |

## Full API Reference

See [references/api_reference.md](references/api_reference.md) for the complete command list with all flags and options.

## Requirements

- Python 3.8+
- Memories.ai API key (free tier available)
- Compatible with Claude Code, OpenClaw, HappyCapy, and other AI coding agents

## Source Repository

https://github.com/kennyzheng-builds/seek-and-analyze-video
