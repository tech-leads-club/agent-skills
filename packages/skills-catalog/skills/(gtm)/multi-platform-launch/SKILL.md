---
name: multi-platform-launch
description: "When the user wants to launch a product across multiple platforms, plan a Product Hunt launch, build a waitlist, or execute a multi-channel launch strategy. Also use when the user mentions 'product launch,' 'Product Hunt,' 'launch strategy,' 'waitlist,' 'beta launch,' 'BetaList,' 'Hacker News,' 'launch day,' 'AppSumo,' 'multi-channel launch.' This skill covers multi-platform launch execution from pre-launch through post-launch optimization. Do NOT use for technical implementation, code review, or software architecture."
metadata:
  original_author: Chad Boyda / agent-gtm-skills
  modified_by: Felipe Rodrigues - github.com/felipfr
  source: https://github.com/chadboyda/agent-gtm-skills
  version: '1.0.0'

---

# Multi-Platform Launch Skill

You are a product launch strategist who has studied hundreds of successful launches across
Product Hunt, Hacker News, BetaList, AppSumo, and 20+ directory/community platforms. You help
founders plan, sequence, and execute multi-channel launches that maximize first-week momentum
and long-tail discovery.

## Before Starting

Gather these inputs before producing a launch plan:

1. **Product type** - SaaS, dev tool, AI tool, marketplace, mobile app, physical product
2. **Target buyer** - developers, SMB owners, enterprise, creators, consumers
3. **Current assets** - existing audience size, email list, social following, community
4. **Launch goal** - signups, revenue, press, backlinks, community building, fundraising signal
5. **Timeline** - how many weeks until desired launch date
6. **Budget** - $0 bootstrap, <$500 indie, <$5K startup, $5K+ funded
7. **Team size** - solo founder, 2-3 person team, full team with marketing

If the user has not provided these, ask before building the plan. A launch plan without
audience context will produce generic advice.

---

## Platform Landscape (2025-2026)

### Discovery Platforms

| Platform | Audience | Best For | Effort | Timeline Impact |
|---|---|---|---|---|
| Product Hunt | Tech-savvy early adopters, 5M+ monthly | Launch day spike, press signal, investor signal | High | Day 0 |
| BetaList | Pre-launch beta testers, early adopters | Waitlist building, pre-launch validation | Low | Week -2 to -1 |
| What Launched Today | Casual tech browsers | Secondary launch day traffic | Low | Day 0 |
| Launching.io | Startup watchers | Supplementary visibility | Low | Day 0-1 |

### Developer Platforms

| Platform | Audience | Best For | Effort | Timeline Impact |
|---|---|---|---|---|
| Hacker News (Show HN) | Engineers, technical founders | Technical credibility, GitHub stars | High | Day 0-1 |
| Dev Hunt | Developer tool users | Dev-focused discovery | Low | Week -1 to 0 |
| GitHub Trending | Open-source developers | Stars, contributors, credibility | Medium | Ongoing |
| StackShare | Engineering teams evaluating tools | Enterprise dev tool discovery | Low | Week +1 |

### Indie/Founder Platforms

| Platform | Audience | Best For | Effort | Timeline Impact |
|---|---|---|---|---|
| Indie Hackers | Solo founders, indie makers | Community feedback, early revenue | Medium | Week -1 to +1 |
| Microlaunch | Micro-SaaS builders | Quiet pre/post-PH launch | Low | Week -1 or +1 |
| NextBigProduct | Startup watchers | Supplementary visibility | Low | Week 0-1 |
| Foundout.io | Long-tail product discovery | Persistent visibility post-launch | Low | Week +1 |

### AI/Tech Directories

| Platform | Monthly Users | Domain Authority | Best For |
|---|---|---|---|
| There's An AI For That (TAAFT) | 2M+ | High | AI tool discovery, SEO |
| Futurepedia | 1M+ | High | AI tool aggregation |
| Toolify | 500K+ | Medium | AI tool comparison |
| Uneed | Growing | Medium | Curated indie tools |
| AI Tool Directory (aitoolfor.org) | Growing | Medium | Broad AI tool listing |

### Social Channels

| Platform | Strategy | Timeline |
|---|---|---|
| X (Twitter) | Building in public, launch threads, engagement pods | Weeks -4 to +4 |
| LinkedIn | Professional launch posts, founder story | Week -1 to +2 |
| Reddit | Relevant subreddit posts (r/SaaS, r/startups, niche subs) | Day 0 to +7 |
| Discord/Slack communities | Targeted community seeding | Ongoing |

### Content Channels

| Platform | Content Type | SEO Value | Timeline |
|---|---|---|---|
| YouTube | Product demo, launch story video | Medium | Week -1 to +1 |
| Blog/personal site | Launch blog post, technical deep-dive | High | Week 0-1 |
| Podcasts | Founder interview circuit | Medium | Week +1 to +4 |
| Newsletter | Cross-promotions with aligned newsletters | Medium | Week -1 to +1 |

### Paid/Review Platforms

| Platform | Model | Best For | Timeline |
|---|---|---|---|
| AppSumo | Lifetime deal revenue split | Revenue boost, user acquisition at scale | Week +2 to +4 |
| G2 | Free listing + paid promotion | Enterprise social proof, SEO | Week +2 to +8 |
| Capterra | Free listing + paid placement | SMB discovery, comparison shopping | Week +2 to +8 |

Note: G2 is acquiring Capterra/GetApp/Software Advice from Gartner (closing Q1 2026).

---

## Launch Sequence Framework

```
Week -4 to -3: FOUNDATION
  |
  |-- Define positioning (use positioning-icp skill)
  |-- Build landing page with waitlist capture
  |-- Set up analytics and attribution tracking
  |-- Create asset library (screenshots, demo video, logo pack)
  |-- Draft Product Hunt page (do not publish)
  |-- Begin building in public content on X/LinkedIn
  |
Week -2: WAITLIST SEEDING
  |
  |-- Submit to BetaList
  |-- Submit to 10-15 free directories (batch submission day)
  |-- Start sharing waitlist link in relevant communities
  |-- Begin warm outreach to 20-50 people for launch day support
  |-- Post "building in public" updates daily on X
  |-- Cross-promote with aligned newsletter creators
  |
Week -1: LAUNCH PREP
  |
  |-- Finalize Product Hunt page (gallery, tagline, maker comment)
  |-- Prepare Hacker News Show HN post (if technical product)
  |-- Brief your launch day support crew with specific instructions
  |-- Schedule social media posts for launch day
  |-- Submit to Microlaunch, Dev Hunt, Indie Hackers
  |-- Pre-write launch thread for X (7-10 posts)
  |-- Record and edit YouTube demo video
  |
Day 0: LAUNCH DAY
  |
  |-- 12:01 AM PT: Product Hunt goes live
  |-- 8:00-10:00 AM PT: Post Show HN on Hacker News
  |-- Morning: Publish X launch thread
  |-- Morning: Post on LinkedIn
  |-- Morning: Share in Discord/Slack communities
  |-- All day: Respond to every PH comment within 30 minutes
  |-- All day: Engage with every HN comment authentically
  |-- Evening: Share progress update on X
  |
Week +1: AMPLIFICATION
  |
  |-- Publish YouTube deep-dive demo
  |-- Write launch retrospective blog post
  |-- Start podcast outreach circuit
  |-- Post on relevant Reddit communities
  |-- Submit to remaining directories
  |-- Collect and share launch metrics publicly
  |
Week +2 to +4: MONETIZATION & PROOF
  |
  |-- Launch AppSumo deal (if applicable)
  |-- Request G2/Capterra reviews from early users
  |-- Repurpose UGC from launch into social content
  |-- Begin SEO content strategy (use ai-seo skill)
  |-- Start building case studies from early adopters
```

---

## Product Hunt Deep Dive

### How the 2025-2026 Algorithm Works

Product Hunt's team manually curates which products appear on the homepage. They evaluate
products on four factors:

1. **Useful** - solves a real problem
2. **Distinctive** - clearly different from existing solutions
3. **User-Friendly** - polished, easy to try
4. **Complete** - feels like a finished product, not a landing page

The algorithm hides upvote counts for the first 4 hours to distribute exposure more fairly.
Early velocity still matters, but gaming is harder than before.

### Product Hunt Launch Page Anatomy

| Element | Requirements |
|---|---|
| Title | 60-70 chars, customer-focused, communicate value without context |
| Tagline | One sentence reinforcing the title's value proposition |
| Gallery | 4-6 images or GIF/video; first image is hero; show product in use |
| Description | What it does (1 sentence), who for (1 sentence), differentiator (1 sentence) |
| Maker Comment | Story behind building it, why this moment matters, invite feedback |

### Title Strategy: Three Variants

Prepare three title options with distinct angles:

| Angle | Example |
|---|---|
| Value-first | "Ship blog posts 10x faster with AI that matches your voice" |
| Social proof | "The writing tool 500 founders use to publish daily" |
| Curiosity | "What happens when you give your blog an AI co-writer" |

Test these with 5-10 people before launch. Pick the one with the strongest immediate reaction.

### Launch Day Execution Roles

For teams of 2+, assign these roles explicitly:

| Role | Responsibility |
|---|---|
| Thread Owner | Responds to every PH comment within 30 min |
| Social Driver | Posts updates on X, LinkedIn, communities |
| Support Lead | Handles signups, onboarding, bug reports |
| Metrics Tracker | Monitors upvotes, rank position, traffic |

Solo founders: prioritize Thread Owner and Social Driver. Let support queue until evening.

### Performance Benchmarks (2025)

| Metric | Good | Great | Top 5 |
|---|---|---|---|
| Upvotes | 150-300 | 300-600 | 600-900+ |
| Comments | 30-60 | 60-120 | 120+ |
| Launch day signups | 200-500 | 500-1500 | 1500+ |
| Traffic spike | 2K-5K visits | 5K-15K | 15K+ |

Products in the top 6 appear on the first page without scrolling. This is the target.

### What to Avoid on Product Hunt

Never ask for upvotes publicly (X, LinkedIn, email blasts) or use exchange groups (IPs get
flagged). Avoid Monday/Friday launches (low engagement). Do not launch a landing page with
no working product. Always respond to comments (responsiveness affects ranking).

---

## Hacker News (Show HN) Deep Dive

### What Works on HN

Show HN is for things people can run, use, or interact with. Blog posts, signup pages,
and newsletters are explicitly off-topic for Show HN.

**Ideal post types:**
- Live demo with no signup required
- Open-source tool with GitHub repo
- Technical deep-dive with benchmarks
- Novel approach to a known problem

**Title formula:**
Front-load a concrete benefit or intrigue. Use digits, version numbers, or specific results.
Avoid superlatives, listicle formats, and clickbait.

Good: "Show HN: Open-source tool that converts Figma designs to React in 30 seconds"
Bad: "Show HN: The Best Design-to-Code Tool Ever Made"

### Timing

| Window | Why |
|---|---|
| Tue-Thu, 8:00-10:00 AM PT | Engineers check news before standup |
| Sunday, 6:00-9:00 PM PT | Low competition, relaxed browsing |

Check hn.algolia.com before posting to verify your slot is not crowded by major stories.

### Algorithm Mechanics

HN uses time-decayed scoring. The gravity multiplier increases every ~45 minutes. A post
with 10 upvotes in 15 minutes outranks one with 50 upvotes over 6 hours. Early velocity
is everything.

### Early Upvote Sources (Legitimate)

Use: email list of technical HN-active subscribers, private Slack/Discord with members
holding 1+ year HN accounts, direct messages to founder friends on HN.

Never use: public X/LinkedIn upvote asks, "upvote party" groups, new account rings.
Shadow-banning is aggressive and permanent.

### HN Performance Benchmarks

| Result | Points | What You Get |
|---|---|---|
| Front page (1hr) | 10-20 | ~500 visits, 20-50 GitHub stars |
| Front page (4hrs) | 30-80 | ~2K-5K visits, 50-121 GitHub stars |
| Front page (12hrs+) | 100+ | 5K-20K visits, major credibility signal |

Expect brutally honest feedback. Respond to criticism thoughtfully and you earn respect.

---

## Waitlist Building Playbook

Waitlist-driven launches convert at 25-85% vs. 2-4% for cold launches, with near-zero
customer acquisition cost. AI-powered waitlist optimization adds ~30% to conversion rates.

### Waitlist Architecture

Landing Page (value prop + social proof) -> Email Capture (name, email, use case tag) ->
Thank You + Referral Loop (share to move up in line). Each stage feeds a different engine:
SEO/social traffic, segmentation for launch day personalization, and viral growth.

### Referral-Based Waitlist Growth

The highest-performing waitlists use tiered referral rewards:

| Referrals | Reward |
|---|---|
| 1 | Early access (move up the line) |
| 3 | Extended free trial or bonus feature |
| 5 | Lifetime discount or founding member status |
| 10 | Direct call with founder, input on roadmap |

Tools: LaunchList (getlaunchlist.com), Waitlister, Viral Loops, ReferralHero

### Waitlist Conversion Tactics

Use scarcity framing ("Onboarding 50 users per week"), show position in line, tag users
by role/use case at signup for personalized launch emails, send weekly build updates to
keep the list warm, and let top referrers in early for pre-launch testimonials.

### Waitlist Size Benchmarks

| Product Stage | Target Waitlist | Conversion Expectation |
|---|---|---|
| Pre-MVP validation | 100-500 | 40-60% to beta signup |
| MVP ready | 500-2000 | 30-50% to active user |
| Product-market fit | 2000-10000 | 25-40% to paid/active |
| Scaled launch | 10000+ | 15-30% to paid |

---


For directory submission, AppSumo, G2/Capterra, UGC scaling, budget framework, timing, success metrics, and common mistakes read `references/directories-timing-mistakes.md`.

## Examples

- **User says:** "Plan our Product Hunt launch" → **Result:** Agent asks timeline, audience size, and product state; recommends 2 weeks before (landing page, waitlist, PH draft, 20–50 supporters, assets, UTM); launch day (PH 12:01 AM PT, Show HN 8–10 AM, X thread, waitlist email); Week +1 (demo video, retro post, directories, reviews).
- **User says:** "We're launching on multiple channels" → **Result:** Agent maps 16+ channels (PH, HN, X, LinkedIn, BetaList, directories, community); prioritizes by audience; sets launch day order and post-launch cadence; warns on common mistakes (Friday launch, no demo, going silent after Day 0).
- **User says:** "We have no audience for launch" → **Result:** Agent suggests waitlist build first, 20+ supporters for Day 0, and community/outreach; recommends building in public and content pre-launch; ties to content-to-pipeline and solo-founder-gtm if needed.

## Troubleshooting

- **Low PH/HN traction** → **Cause:** Wrong day, weak tagline, or no supporters. **Fix:** Launch Tue–Thu; sharpen tagline and first comment; line up 20+ upvotes/comments in first hour; respond to every comment in 30 min.
- **Traffic spike but no signups** → **Cause:** No clear CTA or try-it-now. **Fix:** Offer instant demo or waitlist; one primary CTA above fold; UTM on all links to attribute.
- **Launch day then silence** → **Cause:** No Week +1 plan. **Fix:** Post daily updates Week +1; YouTube demo, retro post, directory batch, G2/Capterra reviews; compile metrics and 30-day plan.

---


For checklists, benchmarks, and discovery questions read `references/quick-reference.md` when you need detailed reference.

---

## Related Skills

- **positioning-icp** - Define your positioning and ICP before crafting launch messaging
- **ai-seo** - Build long-tail SEO strategy post-launch using directory backlinks
- **social-selling** - Convert launch buzz into pipeline and sales conversations
- **content-to-pipeline** - Turn launch content into ongoing lead generation
- **ai-ugc-ads** - Scale user-generated launch content into paid campaigns
- **solo-founder-gtm** - Adapted launch playbook for one-person teams
