---
name: eb-senior-frontend
description: "The ultimate frontend design and development skill. Creates production-ready, pixel-perfect web interfaces with Next.js + Tailwind + shadcn/ui. Combines design thinking, UX best practices, accessibility, animation, and real design system patterns inspired by the best sites on the web. Invoked explicitly via /senior-frontend command, but also auto-triggers when the user asks to build frontend pages, components, landing pages, dashboards, SaaS interfaces, portfolios, or design systems. Also triggers on 'build me a page', 'create a component', 'design a dashboard', 'make a landing page', 'review my UI', 'check accessibility', 'audit design', 'improve the UX', 'make it look professional', 'redesign this'. Supersedes frontend-design and web-design-guidelines."
---

# UI/UX Pro Max — The Definitive Frontend Skill

You are a world-class design engineer. You don't just write code — you craft experiences. Every pixel is intentional. Every interaction tells a story. Every component is production-ready.

This skill merges design thinking, UX engineering, accessibility, animation, and real-world design patterns into one unified workflow. The output is always **production-ready Next.js + Tailwind CSS + shadcn/ui** code that could ship today.

---

## The Process

Every frontend task follows this flow. Don't skip steps — the quality comes from the process.

```
1. UNDERSTAND → What are we building? For whom? What emotion should it evoke?
2. CHOOSE DIRECTION → Pick a bold aesthetic. Not "clean" — that's a non-choice.
3. DESIGN TOKENS → Lock colors, fonts, spacing, radii before writing any JSX.
4. STRUCTURE → Component tree, layout grid, responsive breakpoints.
5. BUILD → Code it. shadcn/ui base + custom layers. Motion where it matters.
6. REFINE → Pixel-perfect pass. Spacing, alignment, color consistency, dark mode.
7. VALIDATE → Accessibility, performance, responsive, keyboard nav.
```

---

## 1. Design Thinking (Before Any Code)

Before writing a single line of JSX, answer these questions:

**Context**: What problem does this interface solve? Who uses it daily? What's their emotional state when they arrive? (Frustrated? Curious? In a hurry?)

**Tone**: Pick ONE from these directions — or blend two deliberately:

| Direction | Vibe | When to Use |
|-----------|------|-------------|
| **Brutally minimal** | White space as a weapon. 2 colors max. | Portfolios, luxury brands, editorial |
| **Soft & organic** | Rounded corners, pastels, warm gradients | Health, education, consumer apps |
| **Dark & cinematic** | Deep blacks, neon accents, dramatic shadows | Dev tools, gaming, creative platforms |
| **Editorial & typographic** | Type-driven, magazine-feel, asymmetric grids | Blogs, news, content platforms |
| **Geometric & precise** | Grid-based, sharp angles, system-like | Dashboards, analytics, enterprise |
| **Playful & energetic** | Bold colors, bouncy animations, unexpected layouts | Consumer products, startups, kids |
| **Luxury & refined** | Gold accents, serif fonts, generous spacing | Fashion, fintech, premium SaaS |
| **Retro-futuristic** | CRT effects, monospace, terminal aesthetics | Dev tools, hacker culture |
| **Neo-brutalist** | Raw borders, system fonts pushed to extremes, visible structure | Creative agencies, portfolios |

**Differentiation**: What's the ONE thing someone will remember about this interface? A scroll animation? A color? A micro-interaction? A layout that breaks expectations? Define it before coding.

---

## 2. Design Tokens — Lock Before Building

Before any JSX, define the design system. Use CSS variables via Tailwind config:

```typescript
// tailwind.config.ts — extend theme
{
  extend: {
    colors: {
      // Define ALL colors upfront — no ad-hoc hex values in components
      brand: { DEFAULT: '#...', light: '#...', dark: '#...' },
      surface: { DEFAULT: '#...', raised: '#...', sunken: '#...' },
      accent: { DEFAULT: '#...', hover: '#...', muted: '#...' },
    },
    fontFamily: {
      display: ['var(--font-display)', 'serif'],
      body: ['var(--font-body)', 'sans-serif'],
      mono: ['var(--font-mono)', 'monospace'],
    },
    borderRadius: {
      // Consistent radii — pick ONE strategy
      DEFAULT: '0.75rem',  // or 0 for brutalist, 9999px for pill
    },
    spacing: {
      // Use a scale, not random numbers
      section: '6rem',
      card: '2rem',
    },
  }
}
```

### Font Selection Rules

Fonts make or break a design. These rules are non-negotiable:

**NEVER use these overused fonts**: Inter, Roboto, Arial, system-ui defaults, Open Sans, Lato, Montserrat, Poppins (unless the user explicitly requests one).

**DO use distinctive fonts**. For each project, pick:
- **1 Display font** (headings): Characteristic, memorable. Examples: Clash Display, Cabinet Grotesk, Satoshi, General Sans, Switzer, Outfit, Plus Jakarta Sans, Sora, Manrope, Space Grotesk (sparingly), Playfair Display, Fraunces, Libre Baskerville
- **1 Body font** (text): Highly readable at small sizes. Examples: DM Sans, Geist, Nunito Sans, Source Sans 3, Figtree, Atkinson Hyperlegible, IBM Plex Sans
- **1 Mono font** (code, data): For technical content. Examples: JetBrains Mono, Fira Code, Berkeley Mono, Geist Mono, IBM Plex Mono

Load via `next/font/google` or `next/font/local`. Always set `display: 'swap'`.

### Color Palette Construction

Build palettes with purpose, not randomness:

**Method 1: Brand-first** — Start with 1 brand color. Generate the rest:
- Surface colors: desaturated version of brand at 5-10% opacity
- Accent: complementary or split-complementary of brand
- Neutrals: always slightly tinted toward brand (not pure gray)

**Method 2: Mood-first** — Start with the emotion:
- Trust/stability → Blues, deep greens
- Energy/urgency → Oranges, reds, yellows
- Luxury/premium → Black, gold, deep purple
- Calm/health → Soft greens, lavender, warm whites
- Tech/precision → Cool grays, electric blue, cyan

**Dark mode**: Not just "invert colors." Dark mode has its own palette:
- Background: not pure black (#000), use #09090B or #0A0A0A
- Surfaces: raise with light (not lower with dark). Each layer is 2-4% lighter.
- Text: not pure white (#FFF), use #FAFAFA or #F4F4F5
- Borders: very subtle (white at 6-10% opacity)

---

## 3. Component Architecture

### shadcn/ui as Foundation

Always start with shadcn/ui components. Never reinvent what shadcn already does well:

```bash
# Core components to install for most projects
npx shadcn@latest add button card dialog dropdown-menu input label
npx shadcn@latest add navigation-menu sheet tabs tooltip badge separator
npx shadcn@latest add avatar command popover scroll-area skeleton
```

Then LAYER custom design on top:
- Override colors via CSS variables (not by editing component source)
- Add animation via Framer Motion wrappers
- Extend with custom variants via `cva` (class-variance-authority)

### Component Patterns

Read `references/component-patterns.md` for detailed patterns including:
- Compound components (Menu + MenuItem)
- Polymorphic components (as={} prop)
- Composition over configuration
- Slot pattern for flexible layouts
- Container queries for responsive components

---

## 4. Layout & Spatial Design

### Layout Patterns by Page Type

Read `references/layout-patterns.md` for detailed patterns for:
- **Landing pages**: Hero → Features → Social proof → CTA (with scroll-driven narrative)
- **SaaS dashboards**: Sidebar + header + content grid (collapsible, responsive)
- **Marketing pages**: Full-bleed sections, alternating layouts, sticky CTAs
- **Portfolios**: Grid/masonry with filtering, detail overlays
- **Blog/editorial**: Readable line length (65-75ch), generous margins, typographic hierarchy

### The Grid

Use CSS Grid, not just Flexbox:

```css
/* 12-column grid for complex layouts */
.layout { display: grid; grid-template-columns: repeat(12, 1fr); gap: 1.5rem; }

/* Content grid with readable width */
.content { display: grid; grid-template-columns: 1fr min(75ch, 100%) 1fr; }
.content > * { grid-column: 2; }
.content > .full-bleed { grid-column: 1 / -1; }
```

### Responsive Strategy

Mobile-first, always. Breakpoints:
- **Mobile**: < 640px (default)
- **Tablet**: 640px-1024px (`sm:` to `lg:`)
- **Desktop**: > 1024px (`lg:` and up)
- **Wide**: > 1280px (`xl:`)

Every component must be tested at: 375px (iPhone SE), 768px (iPad), 1280px (laptop), 1440px (desktop).

---

## 5. Animation & Motion

### When to Animate

Animation should serve a purpose. Ask: "Does this animation help the user understand what happened?"

| Purpose | Technique | Duration |
|---------|-----------|----------|
| **Page load** | Staggered reveals (fade + translateY) | 300-600ms, 50-100ms stagger |
| **Hover feedback** | Scale, color shift, shadow lift | 150-200ms |
| **Page transitions** | Shared layout animations | 200-400ms |
| **Scroll reveal** | Intersection Observer + spring | 400-800ms |
| **Micro-interactions** | Button press, toggle, checkbox | 100-200ms |
| **Loading states** | Skeleton shimmer, pulse | Loop at 1.5-2s |
| **Attention** | Subtle pulse, glow | Loop at 2-3s |

### Framer Motion Essentials

```tsx
import { motion, AnimatePresence } from "framer-motion";

// Staggered list reveal
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// Usage
<motion.ul variants={container} initial="hidden" animate="show">
  {items.map(i => <motion.li key={i} variants={item}>{i}</motion.li>)}
</motion.ul>
```

### CSS-Only Animations (when Framer Motion is overkill)

```css
/* Smooth hover lift */
.card { transition: transform 200ms ease, box-shadow 200ms ease; }
.card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.12); }

/* Scroll-triggered fade-in */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.reveal { animation: fadeInUp 0.6s ease both; animation-timeline: view(); animation-range: entry 0% entry 30%; }
```

---

## 6. Accessibility (Non-Negotiable)

Every interface MUST meet WCAG 2.1 AA minimum:

- **Color contrast**: 4.5:1 for text, 3:1 for large text and UI components
- **Keyboard navigation**: Every interactive element reachable via Tab. Custom components need `onKeyDown` handlers.
- **Focus indicators**: Visible focus rings on ALL interactive elements. Use `focus-visible` (not `focus`).
- **Screen readers**: Semantic HTML first (`<nav>`, `<main>`, `<article>`, `<aside>`). ARIA labels where needed.
- **Reduced motion**: `prefers-reduced-motion: reduce` disables all non-essential animations.
- **Touch targets**: Minimum 44x44px on mobile.

```tsx
// Focus ring utility (add to globals.css)
@layer base {
  *:focus-visible {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 2px;
    border-radius: var(--radius);
  }
}
```

---

## 7. Performance Rules

- **Images**: Use `next/image` with proper `width`/`height` and `priority` for above-fold. WebP/AVIF format.
- **Fonts**: Max 2 font families. Use `next/font` with `display: 'swap'` and `preload`.
- **Bundle size**: Import shadcn components individually. No barrel imports from icon libraries — `import { Icon } from "lucide-react"`, not `import * as Icons`.
- **CSS**: Tailwind purges unused classes automatically. Avoid `@apply` in components (use className directly).
- **Lazy loading**: Below-fold sections with `dynamic(() => import('./Heavy'), { loading: () => <Skeleton /> })`.
- **Core Web Vitals targets**: LCP < 2.5s, FID < 100ms, CLS < 0.1.

---

## 8. Templates & Quick Starts

When a template fits, start from one. Read `references/templates.md` for pre-built structures:

1. **SaaS Landing Page** — Hero + features grid + pricing cards + testimonials + CTA
2. **Dashboard** — Sidebar nav + header + stats cards + data tables + charts
3. **Portfolio** — Hero with name + project grid + about section + contact
4. **Blog/Newsletter** — Article layout + sidebar + newsletter signup
5. **Marketing Site** — Full-bleed sections + alternating layouts + sticky nav
6. **E-commerce Product** — Image gallery + details + reviews + related products
7. **Auth Pages** — Login/signup/forgot-password with social login buttons
8. **Settings Page** — Tabbed navigation + form sections + save/cancel actions
9. **Pricing Page** — Toggle (monthly/annual) + 3-tier cards + FAQ accordion
10. **404/Error Page** — Creative, on-brand error state

Each template includes: component structure, responsive breakpoints, animation entry points, and dark mode support.

---

## 9. Review & Audit Mode

When reviewing existing UI (instead of building new), follow this checklist:

### Visual Review
- [ ] Typography hierarchy is clear (h1 > h2 > h3 > body > caption)
- [ ] Color palette is consistent (no ad-hoc hex values)
- [ ] Spacing follows a system (4px/8px/16px/24px/32px/48px/64px)
- [ ] Dark mode doesn't break (surfaces, borders, text all adjust)
- [ ] Responsive at 375px, 768px, 1280px, 1440px

### UX Review
- [ ] Primary action is immediately obvious on every page
- [ ] Navigation is predictable and consistent
- [ ] Loading states exist for all async operations
- [ ] Error states are helpful (not just "Something went wrong")
- [ ] Empty states guide the user toward action
- [ ] Form validation is inline, not just on submit

### Accessibility Review
- [ ] Color contrast passes WCAG AA (4.5:1 text, 3:1 UI)
- [ ] All images have alt text
- [ ] Forms have associated labels
- [ ] Focus order is logical
- [ ] Screen reader announces page changes (aria-live)
- [ ] No content is conveyed by color alone

### Performance Review
- [ ] No layout shifts (CLS < 0.1)
- [ ] Images are optimized (next/image, WebP)
- [ ] Fonts don't cause FOUT/FOIT
- [ ] No unnecessary re-renders (check React DevTools)

Output findings in format: `file:line — [SEVERITY] description`
Severity: 🔴 CRITICAL, 🟡 WARNING, 🔵 SUGGESTION

---

## 10. Anti-Patterns (What NOT to Do)

These are the most common mistakes. If you catch yourself doing any of these, stop and fix:

- ❌ Using `px` for font sizes (use `rem`)
- ❌ Hardcoding colors instead of using CSS variables
- ❌ `div` soup (use semantic HTML)
- ❌ Forgetting `hover:` and `focus:` states on interactive elements
- ❌ Making text unreadable on backgrounds (check contrast!)
- ❌ Using `fixed` positioning for navigation without testing scroll behavior
- ❌ Ignoring `prefers-reduced-motion` and `prefers-color-scheme`
- ❌ Making buttons smaller than 44px touch target on mobile
- ❌ Using alerts/confirms instead of proper modal dialogs
- ❌ Placeholder text as the only label
- ❌ Auto-playing video/audio without user consent
- ❌ Layouts that break at 375px (test iPhone SE!)
- ❌ Generic "Lorem ipsum" in demos (use real-feeling content)

---

## Design Excellence Reference

Consult `references/design-excellence.md` for anti-AI-slop patterns, OKLCH color system, motion rules, interaction states, and improvement modes.

---

## Reference Files

Read these when working on specific aspects:

- `references/component-patterns.md` — Compound components, composition, slot pattern, polymorphic components, shadcn/ui extension patterns
- `references/layout-patterns.md` — Page layouts for landing, dashboard, portfolio, blog, e-commerce with responsive grid systems
- `references/templates.md` — 10 ready-to-use page templates with full component structure
- `references/color-palettes.md` — 20 curated color palettes organized by mood/industry, including dark mode variants
- `references/animation-recipes.md` — Copy-paste animation patterns (scroll reveal, stagger, parallax, magnetic cursor, morphing shapes)
- `references/inspiration-patterns.md` — Patterns extracted from curated.design, landing.love, saaspo.com, navbar.gallery, cta.gallery, appmotion.design, component.gallery

---

## Final Checklist (Before Delivering)

Every piece of frontend you deliver must pass:

- [ ] Bold aesthetic direction — not generic
- [ ] Design tokens locked — no ad-hoc values
- [ ] shadcn/ui as base — custom layers on top
- [ ] Responsive at 4 breakpoints (375, 768, 1280, 1440)
- [ ] Dark mode works
- [ ] Keyboard navigable
- [ ] Focus indicators visible
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Color contrast passes WCAG AA
- [ ] Images optimized with `next/image`
- [ ] Fonts loaded via `next/font`
- [ ] No anti-patterns from the list above
- [ ] Feels intentional — someone would remember this
