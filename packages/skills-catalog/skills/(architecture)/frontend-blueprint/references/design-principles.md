# Design Principles Reference

Read this file when you need deeper guidance on specific design decisions
during Phase 3 (Design Direction) or Phase 5 (Atomic Build). Do NOT read
this upfront — only when a specific section is relevant to the current task.

## Table of Contents

1. Typography Pairing Rules (line ~15)
2. Color System Architecture (line ~70)
3. Spacing & Rhythm Systems (line ~130)
4. Layout Patterns by Project Type (line ~175)
5. Common Anti-Patterns to Catch (line ~230)
6. Accessibility Minimums (line ~275)
7. Animation & Motion Guidelines (line ~310)
8. Icon Systems (line ~350)

---

## 1. Typography Pairing Rules

### The Fundamentals

Good typography pairing creates visual hierarchy and personality. Bad pairing
creates noise and distraction.

**Safe pairing strategies:**

- Contrast in structure: pair a geometric sans with a humanist serif
  (e.g., DM Sans + Lora)
- Same family, different weights: one font with wide weight range can
  handle both headings and body (e.g., Inter 800 for headings, 400 for body)
- Contrast in width: pair a condensed display font with a regular-width
  body font (e.g., Bebas Neue + Source Sans Pro)

**Pairing red flags:**

- Two decorative fonts competing for attention
- Fonts from the same classification with subtle differences (looks like
  a mistake, not a choice)
- More than 2 font families in a single project (3 max for complex apps)
- Using a display font for body text or vice versa

### Font Selection by Project Mood

| Mood | Heading direction | Body direction | Example pair |
|------|------------------|---------------|-------------|
| Corporate / Trustworthy | Clean geometric sans | Readable humanist sans | Outfit + Nunito |
| Editorial / Sophisticated | High-contrast serif | Elegant serif or clean sans | Playfair Display + Source Serif |
| Technical / Developer | Monospace or geometric | Clean sans | JetBrains Mono + Inter |
| Playful / Creative | Rounded or display | Friendly sans | Fredoka + Quicksand |
| Luxury / Premium | Thin serif or elegant sans | Light-weight readable | Cormorant Garamond + Montserrat |
| Brutalist / Bold | Heavy grotesque | Neutral sans | Anton + Work Sans |
| Startup / Modern | Geometric sans | Same family or neutral | General Sans + Cabinet Grotesk |

### Typography Scale

Use a consistent scale ratio. Common ones:

- 1.200 (Minor Third): subtle hierarchy, good for dense UIs
- 1.250 (Major Third): balanced, works for most projects
- 1.333 (Perfect Fourth): strong hierarchy, good for editorial
- 1.500 (Perfect Fifth): dramatic, good for marketing pages

Apply the scale: base (1rem) → h6 → h5 → h4 → h3 → h2 → h1, each
multiplied by the ratio. This creates mathematical harmony.

---

## 2. Color System Architecture

### Building a Palette

Every color system needs:

- **Primary:** The brand color. Used for CTAs, links, key interactive elements
- **Secondary:** Supporting color. Used for secondary actions, accents
- **Neutral scale:** 9-11 shades from near-white to near-black for text,
  backgrounds, borders, dividers
- **Semantic colors:** Success (green family), Warning (amber family),
  Error (red family), Info (blue family)
- **Surface colors:** Background layers (at least 3 levels for depth)

### Color Ratio Rule

Follow the 60-30-10 rule:

- 60% dominant (neutrals, backgrounds)
- 30% secondary (cards, sections, supporting elements)
- 10% accent (CTAs, highlights, key interactive elements)

Projects that feel "off" usually violate this ratio — too much accent
color or no clear dominant.

### Dark Mode Considerations

Dark mode is NOT "invert all colors." Key differences:

- Surface colors: use desaturated near-blacks (#0a0a0a to #1a1a2e), NOT pure #000000
- Reduce contrast slightly: pure white (#fff) on dark is harsh. Use #e0e0e0 to #f0f0f0
- Accent colors may need lightening to maintain contrast ratios
- Shadows become less visible — use lighter borders or subtle glows instead
- Elevation is shown by lighter surfaces, not darker shadows

### Generating Palette from a Single Color

If the user provides just one brand color:

1. Use it as the primary
2. Generate a complementary or analogous secondary
3. Build neutral scale by desaturating the primary and adjusting lightness
4. Ensure all semantic colors have sufficient contrast from primary
5. Test: does the primary stand out when surrounded by neutrals? If not, adjust.

---

## 3. Spacing & Rhythm Systems

### Base Unit System

Choose a base unit (4px or 8px) and derive ALL spacing from it:

**4px base (tighter, good for dense UIs):**
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128

**8px base (spacious, good for marketing/editorial):**
8, 16, 24, 32, 48, 64, 80, 96, 128, 160, 192

### Where Spacing Matters Most

These are the spacing decisions that make or break a design:

- **Component internal padding:** Buttons, cards, inputs, modals
- **Between related elements:** Label to input, icon to text, card items
- **Between sections:** Page sections, content blocks
- **Page margins:** Overall content container padding

### Common Spacing Mistakes

- Inconsistent padding inside similar components
- Same spacing between all elements (no rhythm)
- Too little spacing between sections (content feels cramped)
- Not increasing spacing proportionally at larger breakpoints
- Ignoring optical alignment (mathematical center ≠ visual center)

---

## 4. Layout Patterns by Project Type

### Landing / Marketing Pages

- Full-width hero with strong visual focal point
- Section-based vertical flow with alternating layouts
- Generous whitespace between sections (80px-160px)
- Max content width: 1200px-1440px
- Mobile: single column, stack everything

### Dashboards / Admin Panels

- Sidebar navigation (collapsible) + main content area
- Card-based widgets or data panels
- Dense but organized — clear visual groups
- Max content width: fluid (100%) or 1600px+
- Consider: fixed header, scrollable content area

### E-commerce / Product Pages

- Grid-based product listing (2-4 columns responsive)
- Product detail: image gallery left, info right (or stacked mobile)
- Clear price and CTA hierarchy
- Trust signals visible (reviews, security badges)

### Documentation / Content Sites

- Two-column: sidebar TOC + content area
- Max content width for readability: 700px-800px for prose
- Code blocks with proper formatting
- Sticky navigation elements

### Forms / Workflows

- Single column for forms (reduces cognitive load)
- Clear step indication for multi-step flows
- Inline validation, not just on submit
- Group related fields with subtle visual separation

### Component Libraries / Design Systems

- Consistent prop documentation
- Live preview + code side by side
- Clear variant demonstrations
- Responsive behavior documentation

---

## 5. Common Anti-Patterns to Catch

When reviewing user requests or during build, watch for:

**Typography:**

- All caps for paragraphs (hard to read)
- Justified text on web (causes uneven word spacing)
- Line length over 75 characters (hard to track lines)
- Body text smaller than 16px on mobile
- No clear heading hierarchy (h1-h6 look similar)

**Color:**

- Red/green only for status (colorblind-unfriendly)
- Accent color used for 30%+ of the interface
- Low contrast text on patterned backgrounds
- Different colors for same-purpose elements
- Neon or high-saturation colors for large areas

**Layout:**

- Horizontal scrolling for content (except intentional carousels)
- Fixed-width layouts that break on different screens
- Content touching viewport edges (no container padding)
- Inconsistent alignment between sections
- Z-index wars (elements overlapping unexpectedly)

**Interaction:**

- Click targets smaller than 44x44px on mobile
- No visible focus states for keyboard navigation
- Hover-only interactions with no mobile alternative
- Autoplay audio or video
- Disabling browser zoom

**Component-level:**

- Carousels for less than 4 items
- Modal inside a modal
- Infinite scroll without "back to top" or pagination option
- Toast notifications that disappear too quickly
- Dropdowns with more than 10-15 items (use search/filter)

---

## 6. Accessibility Minimums

These are NON-NEGOTIABLE in generated code:

**Contrast:**

- Normal text: minimum 4.5:1 ratio against background
- Large text (18px+ or 14px+ bold): minimum 3:1 ratio
- Interactive elements: minimum 3:1 ratio against adjacent colors

**Keyboard:**

- All interactive elements reachable via Tab
- Visible focus indicators (not just browser default — style them)
- Escape closes modals/overlays
- Enter/Space activates buttons and links

**Semantic HTML:**

- Use heading hierarchy (h1 > h2 > h3, no skipping)
- Use button for actions, a for navigation
- Use nav, main, aside, footer, section, article
- Form inputs must have associated labels (not just placeholder)

**Screen Readers:**

- Images need alt text (decorative images: alt="")
- Icon-only buttons need aria-label
- Dynamic content changes: use aria-live regions
- Hide decorative elements from screen readers (aria-hidden="true")

---

## 7. Animation & Motion Guidelines

### When to Animate

- **State transitions:** hover, focus, active, selected/unselected
- **Entrance/exit:** elements appearing or disappearing
- **Feedback:** success, error, loading, progress
- **Attention:** drawing focus to important changes
- **Continuity:** connecting related UI states

### When NOT to Animate

- Motion that delays the user's primary task
- Animation for decoration with no functional purpose (in data-heavy UIs)
- Repeating/looping animations that distract
- Animation that triggers on every scroll event without throttling

### Duration Guidelines

- Micro-interactions (hover, toggle): 100-200ms
- Component transitions (expand, slide): 200-300ms
- Page/view transitions: 300-500ms
- Complex orchestrated sequences: 500-800ms
- Anything over 1s should be interruptible or skipable

### Easing

- **ease-out** for entrances (fast start, gentle stop — feels responsive)
- **ease-in** for exits (gentle start, fast end — feels natural)
- **ease-in-out** for state changes (smooth both ways)
- **linear** only for continuous animations (loading spinners, progress)
- **cubic-bezier** custom curves for personality and polish

### Reduced Motion

ALWAYS include a `prefers-reduced-motion` media query:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Icon Systems

### Popular Libraries and Their Personalities

| Library | Style | Best for |
|---------|-------|----------|
| Lucide | Clean, geometric outlines | Modern apps, dashboards |
| Phosphor | Versatile, 6 weights | Design systems, flexibility needed |
| Heroicons | Two styles (outline/solid) | Tailwind projects, clean UI |
| Tabler Icons | Consistent stroke width | Developer tools, admin panels |
| Radix Icons | Minimal, 15x15 grid | Compact UIs, toolbars |
| Font Awesome | Comprehensive, varied | Legacy projects, icon variety |
| Material Symbols | Google's design language | Material Design projects |

### Icon Usage Rules

- Maintain consistent size within the same context (don't mix 20px and 24px
  icons in the same toolbar)
- Maintain consistent stroke weight (don't mix outlined and filled in the
  same section unless intentional for state indication)
- Icons should support meaning, not replace text (except universally
  understood: search, close, menu, play/pause)
- Touch targets: even if the icon is 20px, the clickable area should be
  at least 44x44px
- Use a single icon library per project for visual consistency
