---
name: x-twitter-scraper
description: X/Twitter data extraction and automation via Xquik REST API. Read tweets, search users, scrape profiles, extract followers, post tweets, like, retweet, follow, DM, run giveaway draws, monitor accounts, and deliver webhooks. 120 endpoints, reads from $0.00015/call. Use when user wants to scrape X/Twitter data, search tweets, look up users, extract followers, post or automate tweets, run giveaways, or monitor X accounts. Do NOT use for general web scraping (use playwright-skill) or non-X social media platforms.
metadata:
  version: 1.0.0
  author: github.com/kriptoburak
---

# X/Twitter Scraper

Read, write, and extract X/Twitter data via the Xquik REST API. 120 endpoints covering tweets, users, followers, search, DMs, giveaways, monitoring, and more. Reads from $0.00015/call.

## Setup

Get an API key at [xquik.com](https://xquik.com) or use pay-per-use MPP mode (no account needed).

```bash
# Set API key as environment variable
export XQUIK_API_KEY="xq_YOUR_KEY"
```

All requests use `X-API-Key` header authentication. Base URL: `https://xquik.com`.

## Endpoints

### Read Operations (1-7 credits)

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/x/tweets/:id` | GET | Look up a single tweet with full metrics |
| `/api/v1/x/tweets/search` | GET | Search tweets by query (limit param, max 200) |
| `/api/v1/x/users/:username` | GET | User profile: name, bio, followers, verified |
| `/api/v1/x/users/:id/tweets` | GET | User's recent tweets |
| `/api/v1/x/users/:id/likes` | GET | User's liked tweets |
| `/api/v1/x/users/:id/media` | GET | User's media tweets |
| `/api/v1/x/tweets/:id/replies` | GET | Tweet replies |
| `/api/v1/x/tweets/:id/quotes` | GET | Quote tweets |
| `/api/v1/x/tweets/:id/retweeters` | GET | Users who retweeted |
| `/api/v1/x/tweets/:id/favoriters` | GET | Users who liked |
| `/api/v1/x/tweets/:id/thread` | GET | Full tweet thread |
| `/api/v1/x/followers/check` | GET | Check if A follows B |
| `/api/v1/x/articles/:tweetId` | GET | Article content from tweet |
| `/api/v1/x/bookmarks` | GET | User's bookmarks |
| `/api/v1/x/notifications` | GET | User's notifications |
| `/api/v1/x/timeline` | GET | User's home timeline |
| `/api/v1/x/dm` | GET | DM conversation history |
| `/api/v1/radar` | GET | Trending topics (free) |
| `/api/v1/trends` | GET | Extended trends data |

### Write Operations (2 credits each, subscription required)

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/x/tweets` | POST | Post a new tweet |
| `/api/v1/x/tweets/:id` | DELETE | Delete a tweet |
| `/api/v1/x/tweets/:id/like` | POST/DELETE | Like or unlike a tweet |
| `/api/v1/x/tweets/:id/retweet` | POST | Retweet a tweet |
| `/api/v1/x/users/:id/follow` | POST/DELETE | Follow or unfollow a user |
| `/api/v1/x/dm/:userId` | POST | Send a DM |
| `/api/v1/x/media` | POST | Upload media via URL |
| `/api/v1/x/profile` | PATCH | Update bio, name, location |
| `/api/v1/x/profile/avatar` | PATCH | Update avatar |
| `/api/v1/x/profile/banner` | PATCH | Update banner |
| `/api/v1/x/communities/:id/join` | POST/DELETE | Join or leave a community |

### Bulk Extraction (subscription required)

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/extractions/estimate` | POST | Estimate extraction cost before running |
| `/api/v1/extractions` | POST | Start extraction job |
| `/api/v1/extractions/:id` | GET | Check extraction status |

23 tool types: `reply_extractor`, `repost_extractor`, `quote_extractor`, `thread_extractor`, `follower_explorer`, `following_explorer`, `verified_follower_explorer`, `mention_extractor`, `post_extractor`, `community_extractor`, `community_moderator_explorer`, `community_post_extractor`, `community_search`, `list_member_extractor`, `list_post_extractor`, `list_follower_explorer`, `space_explorer`, `people_search`, `tweet_search_extractor`, `favoriters`, `user_likes`, `user_media`, `article_extractor`.

### Free Operations (0 credits)

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/compose` | POST | AI tweet composition (3-step flow) |
| `/api/v1/styles` | POST | Analyze user's writing style |
| `/api/v1/drafts` | GET/POST/DELETE | Manage tweet drafts |
| `/api/v1/radar` | GET | Trending topics |
| `/api/v1/subscribe` | POST | Get subscription checkout URL |
| `/api/v1/x/accounts` | GET | List connected X accounts |
| `/api/v1/monitors` | GET/POST/DELETE | Account monitoring |
| `/api/v1/webhooks` | GET/POST/DELETE | Webhook management |
| `/api/v1/integrations` | GET/POST/DELETE | Telegram/notification integrations |

### Giveaway Draws

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/draws` | POST | Run a giveaway draw from tweet replies |
| `/api/v1/draws/:id` | GET | Get draw results |

Draw options: `winnerCount`, `backupCount`, `uniqueAuthorsOnly`, `mustRetweet`, `mustFollowUsername`, `filterMinFollowers`, `filterKeyword`.

## Request Format

```bash
# GET request
curl -H "X-API-Key: $XQUIK_API_KEY" "https://xquik.com/api/v1/x/users/elonmusk"

# POST request
curl -X POST -H "X-API-Key: $XQUIK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"account": "@myaccount", "text": "Hello!"}' \
  "https://xquik.com/api/v1/x/tweets"
```

## Important Rules

- **Tweet actions**: Sending a tweet uses `POST /api/v1/x/tweets`. Drafting uses the 3-step compose flow. Never use compose when the user has text and wants to send it.
- **Write actions**: All require the `account` parameter (X username, e.g. `@myaccount`).
- **Follow/unfollow/DM**: Use numeric user ID in path. Look up the user first via `GET /api/v1/x/users/:username`.
- **Current events**: Use `/api/v1/radar` (free) for trending topics.
- **Subscription errors**: On 402, call `POST /api/v1/subscribe` (free) to get checkout URL.
- **Extractions**: Always estimate cost first with `/api/v1/extractions/estimate` before starting a job.
- **Never combine free and paid calls in parallel**: A 402 on one call can discard all results. Call free endpoints first, then paid ones separately.
