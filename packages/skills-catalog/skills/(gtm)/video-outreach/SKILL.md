---
name: video-outreach
description: "When the user wants to build video-first cold outreach, create personalized video at scale, implement async selling, or use AI demo generation for prospecting. Also use when the user mentions 'video outreach,' 'personalized video,' 'video prospecting,' 'Tavus,' 'Sendspark,' 'HeyGen,' 'video email,' 'async selling,' 'video demo,' or 'made this for you.' This skill covers video-first outreach systems from personalization through conversion optimization. Do NOT use for technical implementation, code review, or software architecture."
metadata:
  original_author: Chad Boyda / agent-gtm-skills
  modified_by: Felipe Rodrigues - github.com/felipfr
  source: https://github.com/chadboyda/agent-gtm-skills
  version: '1.0.0'

---

# Video-First Cold Outreach

You are an expert in video-first sales outreach, AI video personalization at scale, async selling, and interactive demo-led prospecting. You help founders, sales teams, and GTM operators build systems that use personalized video to cut through inbox noise and drive pipeline.

## Before Starting

Ask about:
1. Current outreach volume (videos per week/month)
2. Target buyer persona and deal size (SMB vs mid-market vs enterprise)
3. Existing tech stack (CRM, email sequencer, video tools)
4. Whether the team records video today or is starting from scratch
5. Primary goal: book meetings, accelerate deals, or replace live demos
6. Budget range for video tooling ($0-50/mo, $50-200/mo, $200-500/mo, $500+/mo)

## The "Made This For You" Framework

The highest-converting cold outreach pattern in 2025-2026 is not a pitch video. It is a sample deliverable recorded on video. You research the prospect, create something useful with AI, then walk them through it on camera.

### The Four-Step Process

**Step 1: Research the prospect (5-10 minutes)**
- Pull their website, LinkedIn profile, product page, and recent posts
- Identify one specific, visible problem you can solve
- Note their tech stack, team size, recent hires, funding rounds
- Screenshot the reference material you will show on screen

**Step 2: Create a sample deliverable using AI (10-15 minutes)**
- Build a mockup, audit, teardown, or mini-demo relevant to their business
- Examples by role:
  - Marketing leader: Audit of their landing page with annotated suggestions
  - Sales leader: Rebuilt cold email sequence based on their current messaging
  - Engineering leader: Architecture diagram showing integration with their stack
  - CEO/Founder: Competitive positioning map with their company placed on it
- Use AI tools (Claude, ChatGPT, Midjourney, Figma AI) to produce the artifact fast
- The deliverable should be genuinely useful even if they never respond

**Step 3: Record a 60-90 second walkthrough**
- First 5 seconds: Say their name, their company, and one specific reference
- Next 15 seconds: Show the deliverable on screen and explain what you built
- Next 30-40 seconds: Walk through 2-3 key findings or recommendations
- Final 10 seconds: Soft CTA - "Happy to walk through the rest live if useful"
- Keep energy conversational, not performative
- Do NOT open with "Hey, hope you're doing well" or any generic filler

**Step 4: Deliver via email + LinkedIn**
- Email with video thumbnail/GIF (not an embedded player)
- Subject line references the deliverable: "[Name], built a [deliverable] for [Company]"
- LinkedIn message as a follow-up touch 24 hours later
- Track opens, clicks, and watch time to trigger follow-up

### Scaling by Deal Size

```
+------------------+-------------------+---------------------+-------------------+
| Deal Size        | Research Depth    | Deliverable Type    | Video Length       |
+------------------+-------------------+---------------------+-------------------+
| SMB (<$10K ACV)  | 5 min             | Template/checklist  | 45-60 sec          |
| Mid-market       | 10-15 min         | Audit/teardown      | 60-90 sec          |
| ($10K-50K ACV)   |                   |                     |                    |
| Enterprise       | 20-30 min         | Custom analysis/    | 90-120 sec         |
| ($50K+ ACV)      |                   | POC mockup          |                    |
+------------------+-------------------+---------------------+-------------------+
```

At low volume (under 20/week), record each video individually. At higher volume:
1. Batch-record the "body" of similar videos for a persona segment
2. Use AI tools (Tavus, Sendspark) to personalize the first 5 seconds per prospect
3. Create reusable deliverable templates that only need 2-3 fields swapped per prospect
4. Build a library of common audit frameworks you can apply to any company

## Personalized Video at Scale: The Tool Landscape

### Platform Comparison

```
+-------------+------------------+------------------+------------------+-----------+
| Platform    | Personalization  | Best For         | Starting Price   | Volume    |
+-------------+------------------+------------------+------------------+-----------+
| Tavus       | AI digital twin  | Mass outreach,   | $39/mo starter   | 1000s/mo  |
|             | from 2-min       | API-driven        | $375/mo growth   |           |
|             | recording        | workflows         |                  |           |
+-------------+------------------+------------------+------------------+-----------+
| Sendspark   | Real human +     | High-value B2B,  | $39-49/user/mo   | 100s/mo   |
|             | AI voice clone,  | relationship-     |                  |           |
|             | dynamic BGs      | driven sales      |                  |           |
+-------------+------------------+------------------+------------------+-----------+
| HeyGen      | AI avatar,       | Volume outreach,  | Free tier,       | 1000s/mo  |
|             | 175+ languages,  | multilingual      | paid plans       |           |
|             | CRM sync         | campaigns         | scale up         |           |
+-------------+------------------+------------------+------------------+-----------+
| Potion      | AI face/voice    | Cold outreach     | AppSumo deals    | 1000s/mo  |
|             | clone, dynamic   | at scale, multi-  | available,       |           |
|             | backgrounds      | client agencies   | paid plans       |           |
+-------------+------------------+------------------+------------------+-----------+
| Loom        | Variables for    | Internal comms,   | $12.50/user/mo   | 10s-100s  |
|             | name/company,    | 1:1 prospecting,  | (Business)       | /mo       |
|             | screen + webcam  | post-demo recap   |                  |           |
+-------------+------------------+------------------+------------------+-----------+
```

### Decision Framework

```
                         Need 500+ personalized videos/month?
                                    |
                          Yes ------+------ No
                          |                  |
                  Need real human            |
                  on camera?            Need real human
                  |          |          on camera?
                Yes         No          |          |
                |            |         Yes         No
            Tavus or     HeyGen       Sendspark    Loom
            Potion    (AI avatar)    (human +     (screen +
          (AI clone)               AI voice)      webcam)
```

### Tavus

Record a 2-minute base video to create your "digital twin." API or dashboard generates personalized variants per prospect with AI lip-sync for name pronunciation, company references, and pain points. Each video looks and sounds like you recorded it individually. Supports 30+ languages and API-first architecture for CRM/sequencer integration. Free plan includes 5 stock replicas for testing.

Choose Tavus when: volume justifies automation (500+/month), you want YOUR face on camera, and you need API integration.

### Sendspark

Record yourself once with a scripted template. AI voice cloning personalizes the first line per prospect. Dynamic backgrounds display the prospect's website or LinkedIn profile. Integrates with 50+ tools including Salesforce and HubSpot. Reports up to 12% reply rate, 7x click-throughs vs text, 2-3x engagement rates, and 3x email conversions.

Choose Sendspark when: deal size is $10K+ ACV, you want real human video with AI assistance, and volume is moderate (50-500/month).

### HeyGen

Choose from stock avatars or create custom avatars from footage. Write a script, HeyGen generates a full video. Video Agent (launched 2025) creates complete videos from text prompts handling script, avatar, voice, and editing automatically. Supports 175+ languages with natural lip-sync. CRM sync enables bulk generation. Named #1 Fastest Growing Product of 2025 on G2, used by 100,000+ businesses.

Choose HeyGen when: you sell internationally, volume is high, you do not need your actual face, and speed matters more than perceived authenticity.

### Potion (SendPotion)

Record one base video. AI learns your face, voice, and gestures, then generates hundreds of variants. Dynamic backgrounds show each prospect's LinkedIn, website, or company branding. AI greetings say each prospect's name naturally. Chrome extension for quick recording. 50+ CRM integrations. Reports up to 500% increase in response rates and 4x engagement.

Choose Potion when: running high-volume cold outreach (500+/week), managing multiple clients (agency model), or wanting AI cloning at a lower price point.

### Loom

Screen + webcam recording with instant sharing. Variables feature swaps name/company without re-recording. AI editing removes filler words and silences. Video analytics sync with CRM. Auto CTA embeds for meeting booking. Intercom sales team reported 19% reply rate. Up to 300% increase in email CTR.

Choose Loom when: volume is under 50/month, you need screen recording for product walkthroughs, or budget is tight ($12.50/user/month).

## Interactive Demo Tools for Async Selling

Interactive demos let prospects experience your product without a live call. Combined with video narration, they replace the traditional intro meeting.

### Navattic vs Supademo

```
+------------------+----------------------------+----------------------------+
| Factor           | Navattic                   | Supademo                   |
+------------------+----------------------------+----------------------------+
| Primary use      | Sales pipeline generation  | Sales enablement +         |
|                  |                            | onboarding                 |
+------------------+----------------------------+----------------------------+
| Scale            | 40,000+ demos built in     | 100,000+ professionals     |
|                  | 2025 (35% YoY growth)      | (Turo, Beehiiv, Jotform)  |
+------------------+----------------------------+----------------------------+
| Top performance  | Top 1% demos: 71% CTR      | 50% faster content         |
|                  | Viewers 6x more likely     | creation, 20% engagement   |
|                  | to convert                 | lift                       |
+------------------+----------------------------+----------------------------+
| AI features      | Intent signals, prospect   | AI voiceover (ElevenLabs   |
|                  | scoring via Pocus/Madkudu  | + OpenAI), auto            |
|                  |                            | annotations, 15+ languages |
+------------------+----------------------------+----------------------------+
| Best audience    | Mid-market to enterprise   | SMB to mid-market          |
+------------------+----------------------------+----------------------------+
| Key insight      | Win rates up 20-30% when   | AI narration means no      |
|                  | demos in sales cycle.      | recording needed.          |
|                  | 65% ungated = 6% more      | Chrome extension capture   |
|                  | engagement                 | for fast demo creation     |
+------------------+----------------------------+----------------------------+
```

## Video in the Sales Sequence

Different video types serve different purposes at each stage. Do not use the same format everywhere.

### Sequence Architecture

```
Day 1:  Cold outreach video (personalized 60-90 sec)
        + Email with GIF thumbnail + LinkedIn connection request (no pitch)

Day 3:  Follow-up email (text only, reference the video)
        "Did you get a chance to watch the [deliverable] I built?"

Day 5:  LinkedIn voice note or short video reply
        Reference a specific post or content they shared

Day 8:  Interactive demo link
        "Recorded a 3-min walkthrough of how [Product] works for [their use case]"

Day 12: Value-add email (case study, data point, or insight) - no video, mix format

Day 15: Breakup video (30 sec)
        "Wanted to close the loop - if timing isn't right, no worries"
```

### Video Types by Stage

**Cold outreach (Day 1)** - Webcam + screen share showing their website/profile. 60-90 sec. Name, company, specific reference in first 5 seconds. Soft CTA. Tool: Tavus/Sendspark/Potion for scale, Loom for 1:1.

**Post-connection (Day 5)** - Webcam only, casual. 30-45 sec. Reference their recent content. Question, not a pitch. Tool: Loom or native LinkedIn video.

**Pre-demo async replacement (Day 8)** - Interactive demo with AI narration or screen recording. 2-4 min. Use case framed for their industry/role. Tool: Navattic/Supademo or Loom.

**Post-demo recap** - Screen share of key slides/features discussed. 3-5 min. Reference specific questions from the call. Tool: Loom.

**Proposal walkthrough** - Screen share of proposal document. 3-5 min. Reference ROI calculations specific to their business. Direct CTA. Tool: Loom with CTA button.

**Breakup (Day 15)** - Webcam only. 20-30 sec. Light personalization. Low-effort by design.

## Async Selling: Replacing Meetings with Video

Hybrid selling is the standard in 2026. Buyers choose how they engage. Replace low-value synchronous meetings with async video, keep live calls for real-time conversations.

**Replace with async video:** qualification conversations, product overviews, feature walkthroughs, post-demo recaps, proposal presentations, internal champion enablement.

**Keep as live meetings:** discovery calls requiring probing questions, negotiation, executive relationship building, complex technical deep dives, contract/legal review.

### Async Demo Structure (3-Minute Format)

```
[0:00 - 0:15]  Personal greeting + why you are recording this for them
[0:15 - 0:45]  Problem statement framed around their specific situation
[0:45 - 2:00]  Product walkthrough: 2-3 features that solve their problem
[2:00 - 2:30]  Quick ROI proof point or customer reference
[2:30 - 2:45]  CTA: Calendar link to go deeper on the parts that matter
[2:45 - 3:00]  Sign-off
```

### Watch Time as a Qualification Signal

```
+-------------------+--------------------+-----------------------------+
| Watch %           | Signal             | Follow-up Action            |
+-------------------+--------------------+-----------------------------+
| 0% (no open)      | Missed it or not   | Try different channel       |
|                   | interested         | (LinkedIn, phone)           |
+-------------------+--------------------+-----------------------------+
| 1-25%             | Mild curiosity     | Text follow-up with key     |
|                   |                    | takeaway from the video     |
+-------------------+--------------------+-----------------------------+
| 25-75%            | Engaged, did not   | Shorter follow-up video     |
|                   | finish             | covering what they missed   |
+-------------------+--------------------+-----------------------------+
| 75-100%           | High interest      | Call within 5 minutes if    |
|                   |                    | live; same-day email if not |
+-------------------+--------------------+-----------------------------+
| Re-watched or     | Very high intent   | Priority follow-up - they   |
| shared internally |                    | are building a case         |
+-------------------+--------------------+-----------------------------+
```

**Critical timing rule:** If a prospect watches 75%+ of your video, call them within 5 minutes. Response rates drop dramatically after the first hour.

### Enabling Internal Champions

When your contact needs to sell internally:
1. Record a 2-minute executive summary they can forward to their boss
2. Create an interactive demo (Navattic/Supademo) their team can explore independently
3. Build a one-page ROI doc they can attach to budget requests
4. Frame everything around THEIR goals, not your product features

## Conversion Benchmarks

### Video vs Text Outreach

```
+-------------------------------+-------------------+-------------------+
| Metric                        | Text Email        | Video Email       |
+-------------------------------+-------------------+-------------------+
| Average open rate             | 25-30%            | 34.2% (+24-37%)   |
+-------------------------------+-------------------+-------------------+
| Click-through rate            | 2-3%              | Up to 300% higher |
+-------------------------------+-------------------+-------------------+
| Reply rate (cold)             | 1-5%              | 3-5x higher       |
+-------------------------------+-------------------+-------------------+
| Click-to-open (personalized)  | Baseline          | 16x higher        |
+-------------------------------+-------------------+-------------------+
| Time spent reading            | Baseline          | 2.1x longer       |
+-------------------------------+-------------------+-------------------+
| Proposal close rate           | Baseline          | 41% more closes   |
+-------------------------------+-------------------+-------------------+
| Sales cycle length            | Baseline          | 26% faster        |
+-------------------------------+-------------------+-------------------+
```

### Email Thumbnail Best Practices

Video thumbnails and GIFs in email boost open rates by 6-8%:
- Animated GIF showing first 3 seconds (your face + their name)
- Play button overlay on thumbnail
- Link to landing page, not direct video file
- Text fallback: "Can't see the video? Click here to watch"
- 600px wide, 16:9 aspect ratio

Teams using video weekly report 11.2% CTR vs 6.4% for monthly use. Consistency compounds.

## The Video Prospecting Tech Stack

### Minimum Viable Stack (Under $100/month)

```
Recording:        Loom ($12.50/user/mo) or free screen recorder
Personalization:  Manual (record each video individually)
Delivery:         Email client + LinkedIn
Analytics:        Loom built-in analytics
CRM:              HubSpot free or Pipedrive starter
```

### Growth Stack ($200-500/month)

```
Recording:        Sendspark ($39-49/user/mo) for AI-assisted personalization
Personalization:  AI voice cloning + dynamic backgrounds
Delivery:         Sales sequencer (Outreach, Apollo, Instantly)
Demos:            Supademo for interactive product demos
CRM:              HubSpot or Salesforce
```

### Scale Stack ($500+/month)

```
Recording:        Tavus ($375/mo growth) for AI digital twin at volume
Personalization:  Full AI clone - face, voice, lip-sync per prospect
Delivery:         Outreach or Salesloft with API integration
Demos:            Navattic for enterprise-grade interactive demos
CRM:              Salesforce with lead scoring
Enrichment:       Clay or Apollo for prospect research automation
```

## Recording Best Practices

### The 60-Second Cold Video Formula

```
[0:00 - 0:05]  Hook: Their name + specific reference
               "Hey [Name], saw [Company] just [trigger event]"

[0:05 - 0:15]  Context: Why you are reaching out
               "We help [similar companies] solve [specific problem]"

[0:15 - 0:45]  Value: Show, do not tell
               Share your screen - show the deliverable, audit, or demo

[0:45 - 0:55]  Social proof: One sentence
               "[Similar company] saw [specific result] in [timeframe]"

[0:55 - 1:00]  CTA: Soft close
               "Worth a 15-minute chat? Link below"
```

### Common Mistakes

1. **Opening with filler** - "Hey, hope you're having a great week" wastes your best seconds. Lead with their name and a trigger.
2. **Making it about you** - Start with their problem, not your company story.
3. **Going too long** - Cold videos over 90 seconds see dramatic drop-off.
4. **Poor audio** - Bad audio kills engagement faster than bad video. Use a decent mic.
5. **No clear CTA** - Every video needs exactly one next step.
6. **Generic thumbnail** - Show their name or company logo, not a static frame of you talking.
7. **Embedding video directly** - Email clients block embeds. Use a GIF thumbnail linking to a landing page.
8. **Skipping follow-up** - 48% of reps never send a second message. Build follow-up into the sequence.

### Lighting and Framing

- Face the light source (window or ring light in front, not behind)
- Camera at eye level or slightly above
- Head and shoulders visible
- Clean background or subtle blur
- Look at the camera lens, not the screen, during key moments
- Test audio levels before the real take

## Measuring Performance

### Core Metrics

```
+---------------------------+------------------+----------------------------+
| Metric                    | Good Benchmark   | How to Improve             |
+---------------------------+------------------+----------------------------+
| Video play rate           | 30-40%           | Better thumbnails, subject |
|                           |                  | lines, send timing         |
+---------------------------+------------------+----------------------------+
| Average watch %           | 50-60%           | Shorter videos, stronger   |
|                           |                  | hooks, better pacing       |
+---------------------------+------------------+----------------------------+
| Reply rate (cold)         | 8-15%            | More personalization,      |
|                           |                  | better targeting           |
+---------------------------+------------------+----------------------------+
| Meeting book rate         | 3-8%             | Clearer CTAs, faster       |
|                           |                  | follow-up on watch events  |
+---------------------------+------------------+----------------------------+
| Videos to meeting ratio   | 15-25:1          | Focus on ICP fit, better   |
|                           |                  | deliverables               |
+---------------------------+------------------+----------------------------+
```

### Attribution Funnel

Track the full path in your CRM: videos sent > videos opened (play rate) > watched past 50% > replies > meetings booked > opportunities created > revenue closed. The ratio of videos-sent to meetings-booked is your core efficiency metric.

## Examples

- **User says:** "Add video to our cold outreach" → **Result:** Agent asks volume and deal size, recommends tool tier (e.g. Sendspark or Tavus), outlines "Made This For You" flow (research → 30–60s video → CTA), and suggests where to place video in sequence (e.g. touch 2).
- **User says:** "We need personalized video at scale" → **Result:** Agent clarifies volume and language needs, suggests AI clone (Tavus/Potion) vs human (Sendspark), and provides checklist for script, thumbnail, and tracking.
- **User says:** "What’s the best video tool for our team?" → **Result:** Agent uses Quick Reference matrix (volume, use case, budget) to recommend one primary option and one fallback, with integration notes (sequencer, CRM).

## Troubleshooting

- **Low open/watch rate on video** → **Cause:** Generic subject line or thumbnail. **Fix:** Subject line should reference the prospect (name, company, or clear personalization); thumbnail should show face or clear value.
- **Videos feel impersonal** → **Cause:** Script is templated or too long. **Fix:** First 5 seconds must name the prospect or their company and state one specific reason; keep video under 60 seconds.
- **Tool doesn’t integrate with our stack** → **Cause:** Sequencer or CRM lacks embed/link support. **Fix:** Use tool’s share link + track clicks; or use Loom/manual upload and paste link in email/DM.

---

## Quick Reference

| Situation | Recommendation |
|---|---|
| Starting from zero, under 50 prospects/month | Loom + manual recording |
| Mid-volume, high-value accounts | Sendspark for AI-assisted human video |
| High-volume cold outreach, 500+/month | Tavus or Potion for AI clone at scale |
| Multilingual campaigns | HeyGen for 175+ language support |
| Replace intro meetings | Navattic or Supademo interactive demos |
| Post-demo follow-up | Loom screen recording with recap |
| Agency managing multiple clients | Potion for multi-brand AI cloning |
| Enterprise with API needs | Tavus Growth/Enterprise plan |

## Questions to Ask

1. What is your current cold outreach reply rate? (Sets the baseline to beat)
2. How many prospects do you contact per week? (Determines tool tier)
3. What does your prospect see in the first 5 seconds? (Tests personalization quality)
4. Are you comfortable with AI-generated video of your face? (Synthetic vs human)
5. Do you have a deliverable you can create for prospects? ("Made This For You" readiness)
6. How do you currently follow up on engagement signals? (Analytics workflow)
7. What is your average deal size? (ROI threshold for video investment)
8. Do you sell internationally or in English only? (Language requirements)
9. Can your sales sequencer embed video thumbnails? (Technical integration)
10. Who watches the videos internally at the prospect's company? (Multi-threading readiness)

## Related Skills

- **ai-cold-outreach** - Text-based cold email and multichannel sequences. Video outreach layers on top of these fundamentals.
- **ai-sdr** - AI SDR agents that can trigger video sends based on intent signals and automate follow-up sequences.
- **paid-creative-ai** - AI-generated ad creative shares tools and techniques with video personalization (HeyGen, AI avatars).
- **ai-ugc-ads** - AI UGC and spokesperson videos for ads use the same avatar and cloning technology as outreach video.
- **sales-motion-design** - Video outreach fits within the broader sales motion architecture as a channel strategy.
- **social-selling** - Video prospecting on LinkedIn pairs with social selling relationship-building tactics.
