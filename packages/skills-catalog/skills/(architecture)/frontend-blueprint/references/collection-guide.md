# Reference Collection Guide

Read this file during Phase 2 (Reference Collection) when you need structured
approaches to extract visual direction from users who struggle to articulate
their preferences.

## Table of Contents

1. Question Strategies by User Confidence (line ~15)
2. Reference Extraction Techniques (line ~55)
3. Contrast Pairs for Quick Alignment (line ~90)
4. Brand Analysis Checklist (line ~140)
5. Design Direction Templates (line ~165)

---

## 1. Question Strategies by User Confidence

### User knows exactly what they want

Signs: shares multiple references, uses design terminology, has brand guidelines.

Strategy: Validate and refine.

- "Great references. Let me confirm what I'm taking from each..."
- "I notice [ref A] and [ref B] have different approaches to [X]. Which
  direction do you prefer for that specific element?"
- "Your brand guidelines specify [X] — do you want to follow them strictly
  or is there room to evolve?"

### User has a vague sense

Signs: says "modern", "clean", "professional" without specifics.

Strategy: Anchor to known examples.

- "When you say 'modern,' help me calibrate — is it more Linear/Vercel
  modern (minimal, lots of whitespace) or more Notion modern (friendly,
  illustrated, warmer)?"
- "Think of 2-3 apps or sites you use daily and enjoy looking at. What
  draws you to them visually?"
- "Is there a competitor or similar product whose design you admire?"

### User has no idea

Signs: "just make it look good", "I trust you", "whatever works."

Strategy: Elimination + binary choices.

- Start with: "Let me narrow it down fast. I'll give you pairs — just pick
  which one feels closer to right."
- Use contrast pairs (see section 3)
- After 3-4 choices, you'll have enough signal to propose a direction
- Never proceed with "I'll just pick something" — even 2 minutes of
  alignment prevents hours of rework

---

## 2. Reference Extraction Techniques

### The "What Specifically" Technique

When a user shares a reference, ALWAYS ask what specifically they like.
"I like this site" is not actionable. Drill down:

- "What catches your eye first?" (layout? color? typography?)
- "If you could steal just ONE element from this design, what would it be?"
- "What would you change about it if you could?"

### The Screenshot Markup Technique

If the user shares a screenshot or image:

- Analyze it thoroughly — identify the design system choices visible
- Name what you observe: "I see they're using a 4-column card grid, a
  monospace font for data, a muted blue palette with orange accents..."
- Ask: "Is this assessment of what you like accurate? Anything I'm
  reading wrong?"

### The Competitor Analysis Technique

For product/business UIs:

- "Who are your 2-3 direct competitors?"
- "Which one has the best design in your opinion? What makes it better?"
- "Is there anything about their design you want to intentionally
  differentiate from?"

### The Mood Board Technique

For complex or creative projects, suggest the user create a quick
collection:

- "Drop 5-10 images/screenshots that feel right. They can be from anywhere:
  websites, apps, posters, even physical objects. I'll extract the common
  visual threads."
- This works especially well for landing pages, portfolios, and
  brand-related projects.

---

## 3. Contrast Pairs for Quick Alignment

Use these binary choices to rapidly narrow direction when the user is unsure.
Present 3-4 relevant pairs based on the project type.

### Theme

- Light and airy ↔ Dark and immersive
- Warm tones ↔ Cool tones
- Colorful and vibrant ↔ Muted and restrained

### Layout

- Spacious with breathing room ↔ Dense with lots of information
- Symmetric and structured ↔ Asymmetric and dynamic
- Card-based modular ↔ Flowing continuous sections

### Typography

- Bold and dramatic headings ↔ Subtle and refined headings
- Serif (traditional/editorial) ↔ Sans-serif (modern/technical)
- Monospace/technical feel ↔ Humanist/friendly feel

### Visual Style

- Flat and minimal ↔ Depth with shadows and layers
- Photography-based ↔ Illustration or abstract graphics
- Geometric and precise ↔ Organic and natural shapes

### Interaction

- Subtle micro-interactions ↔ Dramatic animations
- Static and fast-loading ↔ Rich and animated
- Conventional/familiar patterns ↔ Experimental/unique patterns

### Personality

- Professional and corporate ↔ Casual and friendly
- Serious and authoritative ↔ Playful and approachable
- Luxurious and premium ↔ Accessible and down-to-earth

---

## 4. Brand Analysis Checklist

When the user provides brand assets or an existing site/product, extract:

**Visual Identity:**

- [ ] Primary brand color(s) — exact hex values
- [ ] Secondary/accent colors
- [ ] Logo: style, color variants, clear space requirements
- [ ] Existing typography in use (check their current site/materials)
- [ ] Image style (photography tone, illustration style)

**Design Patterns:**

- [ ] Button styles (rounded? sharp? pill-shaped?)
- [ ] Card treatment (shadows? borders? background difference?)
- [ ] Input field style (underlined? bordered? filled?)
- [ ] Navigation pattern (top bar, sidebar, hamburger, tabs)
- [ ] Existing component patterns to maintain consistency with

**Voice & Tone (affects design decisions):**

- [ ] Formal or casual?
- [ ] Technical or approachable?
- [ ] Who is the target audience?

---

## 5. Design Direction Templates

### Template: Minimal / Clean

```
Mood: Clean, spacious, intentional
Color: Monochromatic or near-monochromatic with single accent
Typography: One geometric sans-serif family, wide weight range
Layout: Generous whitespace, clear visual hierarchy, alignment-focused
Icons: Thin outlined, consistent stroke width
Animation: Minimal — subtle fades and slides only
References: Stripe, Linear, Vercel, Apple
```

### Template: Bold / Expressive

```
Mood: Confident, dynamic, energetic
Color: High-contrast primary with bold accent(s)
Typography: Heavy display font for headings, clean sans for body
Layout: Asymmetric, overlapping elements, dynamic grid
Icons: Filled or duotone, bolder weight
Animation: Purposeful motion, entrance animations, hover effects
References: Figma, Pitch, Framer, Raycast
```

### Template: Editorial / Content-First

```
Mood: Sophisticated, readable, authoritative
Color: Neutral base with refined accent
Typography: Serif for headings, humanist sans for body
Layout: Narrow content column, strong vertical rhythm
Icons: Minimal use, text-primary interface
Animation: Restrained — page transitions and scroll reveals
References: Medium, Substack, NYT, The Verge
```

### Template: Data-Dense / Dashboard

```
Mood: Functional, organized, efficient
Color: Dark theme base, status-color coded data
Typography: System or neutral sans, monospace for data
Layout: Grid-based panels, sidebar nav, dense but grouped
Icons: Outlined, functional, consistent 20-24px
Animation: Loading states, chart transitions, data updates
References: Grafana, Datadog, Vercel Analytics, GitHub Insights
```

### Template: Friendly / Consumer

```
Mood: Approachable, warm, trustworthy
Color: Warm palette, pastel accents, friendly contrast
Typography: Rounded sans-serif, generous line-height
Layout: Card-based, spacious, clear CTAs
Icons: Rounded, friendly, possibly illustrated
Animation: Playful micro-interactions, bouncy easing
References: Notion, Slack, Duolingo, Headspace
```

These templates are starting points. Every project should be customized
based on the user's specific references and requirements. Never apply a
template wholesale — use them as conversation anchors.
