# Design Excellence

Consolidated best-practice patterns from Impeccable's frontend-design skill. Use this as a quality filter: if your output violates any rule here, revise before delivering.

---

## AI Slop Anti-Patterns (Banned)

These are the fingerprints of AI-generated work from 2024–2025. If any appear in your output without deliberate justification, remove them.

**Typography**
- Inter, Roboto, Arial, Open Sans, Lato, Montserrat, Poppins as default fonts — they make every interface look the same
- Monospace typography as lazy shorthand for "technical/developer" vibes

**Color**
- Purple-to-blue gradients as a go-to aesthetic
- Neon accents on dark backgrounds — looks "cool" without real design decisions
- Cyan-on-dark as a default tech palette
- Gradient text on headings or metrics — decorative, not meaningful
- Gray text on colored backgrounds — looks washed out; use a darker shade of the background color instead
- Pure black (#000) or pure white (#fff) — always tint; they don't exist in nature
- Dark mode with glowing accents as the default choice

**Layout**
- Hero metric layout: big number + small label + supporting stats + gradient accent
- Identical card grids: icon + heading + text, repeated endlessly at the same size
- Wrapping everything in cards — not everything needs a container
- Cards nested inside cards
- Centering everything — left-aligned text with asymmetric layouts feels more designed
- Uniform spacing throughout — no rhythm, no hierarchy

**Visual Details**
- Glassmorphism used decoratively — blur/glass/glow borders without purposeful reason
- Rounded rectangle with thick colored border on one side — lazy accent
- Sparklines as decoration — tiny charts that look sophisticated but convey nothing
- Generic drop shadows on rounded rectangles — safe, forgettable
- Large rounded icons above every heading — templated, rarely adds value

**Motion**
- Bounce or elastic easing — felt trendy in 2015, now tacky and amateurish; real objects decelerate smoothly
- Animating everything — animation fatigue is real

**Interaction**
- Modals as the default for everything — modals are lazy; consider inline, drawer, popover, or undo patterns instead
- `outline: none` without a replacement focus indicator — accessibility violation

---

## Typography Excellence

### Modular Scale

Use fewer sizes with more contrast. A 5-size system covers most needs with a single ratio — pick one and commit:

| Ratio | Name | Character |
|-------|------|-----------|
| 1.25 | Major third | Subtle, refined |
| 1.333 | Perfect fourth | Balanced, versatile |
| 1.5 | Perfect fifth | Bold, editorial |

Never use sizes that are too close together (14px, 15px, 16px, 18px) — muddy hierarchy.

### Fluid vs Fixed Type

- **Fluid via `clamp()`**: Use for headings and display text on marketing/content pages. Format: `clamp(min, vw-value + rem-offset, max)` — the rem offset prevents collapse to 0.
- **Fixed `rem` scales**: Use for app UIs, dashboards, and data-dense interfaces. No major design system (Material, Polaris, Primer, Carbon) uses fluid type in product UI. Body text should also be fixed even on marketing pages.

### Font Alternatives

| Instead of | Use |
|------------|-----|
| Inter | Instrument Sans, Plus Jakarta Sans, Outfit |
| Roboto | Onest, Figtree, Urbanist |
| Open Sans | Source Sans 3, Nunito Sans, DM Sans |
| Generic sans | Fraunces, Newsreader, Lora (editorial/premium) |

One well-chosen font family in multiple weights often creates cleaner hierarchy than two competing typefaces.

### OpenType Features

Use these for polish — most developers skip them entirely:

```css
.data-table { font-variant-numeric: tabular-nums; }       /* Aligned numbers */
.recipe-amount { font-variant-numeric: diagonal-fractions; }
abbr { font-variant-caps: all-small-caps; }
code { font-variant-ligatures: none; }
body { font-kerning: normal; }
```

### Fallback Font Metric Matching (No FOUT/FOIT Shift)

```css
@font-face {
  font-family: 'CustomFont-Fallback';
  src: local('Arial');
  size-adjust: 105%;
  ascent-override: 90%;
  descent-override: 20%;
  line-gap-override: 10%;
}

body {
  font-family: 'CustomFont', 'CustomFont-Fallback', sans-serif;
}
```

Use [Fontaine](https://github.com/unjs/fontaine) to calculate these overrides automatically.

### Accessibility
- Never disable zoom (`user-scalable=no`)
- Use `rem`/`em` for font sizes — never `px` for body text
- Minimum 16px body text
- Line height scales inversely with line length — narrow columns need tighter leading, wide columns need more
- Increase line-height by 0.05–0.1 for light text on dark backgrounds (perceived weight is lighter)

---

## Color System (OKLCH)

### Why OKLCH Over HSL

OKLCH is perceptually uniform — equal steps in lightness *look* equal. HSL at 50% lightness looks bright in yellow and dark in blue. Use OKLCH for all new color work.

```css
--color-primary: oklch(60% 0.15 250);       /* Blue */
--color-primary-light: oklch(85% 0.08 250); /* Same hue, less chroma at high lightness */
--color-primary-dark: oklch(35% 0.12 250);
```

Key rule: as you move toward white or black, reduce chroma. High chroma at extreme lightness looks garish.

### Tinted Neutrals

Pure gray has no personality. Add a subtle brand-hue tint to all neutrals (chroma 0.01 — perceptible but not obvious):

```css
/* Dead */
--gray-100: oklch(95% 0 0);

/* Tinted toward warmth */
--gray-100: oklch(95% 0.01 60);

/* Tinted toward cool/tech */
--gray-100: oklch(95% 0.01 250);
```

### Two-Layer Token Architecture

Primitives stay constant; only the semantic layer changes for dark mode:

```css
/* Layer 1: Primitives */
--blue-500: oklch(60% 0.15 250);

/* Layer 2: Semantic */
--color-primary: var(--blue-500);

/* Dark mode: redefine semantic only */
[data-theme="dark"] {
  --color-primary: var(--blue-400);
}
```

### Dark Mode as Separate Design Decisions

Dark mode is not inverted light mode:

| Light Mode | Dark Mode |
|------------|-----------|
| Shadows for depth | Lighter surfaces for depth |
| Vibrant accents | Slightly desaturated accents |
| White backgrounds | Never pure black — use oklch(12-18% 0.01 hue) |
| Regular font weight | Reduce weight by ~50 units |

### 60-30-10 Visual Weight Rule

- **60%**: Neutral backgrounds, white space, base surfaces
- **30%**: Text, borders, inactive states
- **10%**: Accent — CTAs, highlights, focus states

Accent colors work *because* they're rare. Using the brand color everywhere kills its power.

### Modern CSS Color Functions

```css
/* Perceptually uniform mixing */
background: color-mix(in oklch, var(--color-primary) 20%, transparent);

/* Automatic light/dark without media query */
color: light-dark(oklch(20% 0.01 250), oklch(90% 0.01 250));
```

### Contrast Requirements (WCAG)

| Content | AA Minimum | AAA Target |
|---------|------------|------------|
| Body text | 4.5:1 | 7:1 |
| Large text (18px+ or 14px bold) | 3:1 | 4.5:1 |
| UI components, icons | 3:1 | 4.5:1 |
| Placeholder text | 4.5:1 | — |

---

## Motion Design Rules

### Duration Scale

| Duration | Use Case |
|----------|----------|
| 100–150ms | Micro-interactions: button press, toggle, color change |
| 200–300ms | State changes: menu open, tooltip, hover |
| 300–500ms | Layout changes: accordion, modal, drawer |
| 500–800ms | Entrance animations: page load, hero reveals |

Exit animations should be ~75% of the enter duration.

### Easing Curves

Never use the generic `ease` — it's a compromise that's rarely optimal.

```css
/* Entrances — smooth deceleration */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);     /* Recommended default */
--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);     /* Slightly more dramatic */
--ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);      /* Snappy, confident */

/* Exits */
--ease-in: cubic-bezier(0.7, 0, 0.84, 0);

/* State toggles */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
```

### Only Animate transform and opacity

Animating any layout property (width, height, padding, margin) causes layout recalculation. For height animations (accordions), use:

```css
.panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 300ms var(--ease-out-quart);
}
.panel.open {
  grid-template-rows: 1fr;
}
.panel > * { overflow: hidden; }
```

### CSS Stagger

```css
/* Parent sets animation */
.list-item {
  animation: fade-up 400ms var(--ease-out-quart) both;
  animation-delay: calc(var(--i) * 50ms);
}
```

Set `style="--i: 0"`, `--i: 1"`, etc. on each item. Cap total stagger time — 10 items × 50ms = 500ms max; reduce delay for larger lists.

### prefers-reduced-motion Is Non-Optional

Vestibular disorders affect ~35% of adults over 40.

```css
@media (prefers-reduced-motion: reduce) {
  .card { animation: fade-in 200ms ease-out; }  /* Crossfade, no spatial motion */
}

/* Or disable all non-essential motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Preserve functional animations (progress bars, loading spinners) — just remove spatial movement.

---

## Interaction States (8 Required)

Every interactive element must have all eight states designed:

| State | When | Notes |
|-------|------|-------|
| Default | At rest | Base styling |
| Hover | Pointer over | Subtle lift, color shift — not touch |
| Focus | Keyboard/programmatic | Visible ring (see below) |
| Active | Being pressed | Pressed in, darker |
| Disabled | Not interactive | Reduced opacity, `cursor: not-allowed` |
| Loading | Processing | Spinner or skeleton |
| Error | Invalid state | Red border, icon, message |
| Success | Completed | Green check, confirmation |

The common miss: designing hover without focus, or vice versa. Keyboard users never see hover states.

### Focus Rings

Never `outline: none` without a replacement. Use `:focus-visible` to show focus rings only for keyboard users:

```css
button:focus { outline: none; }
button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

Requirements: high contrast (3:1 minimum), 2–3px thick, offset from element, consistent across all interactive elements.

### Optimistic UI

Update immediately for low-stakes actions; sync later; rollback on failure. Do NOT use optimistic UI for payments or destructive operations.

### Native Modal & Overlay Patterns

```html
<!-- Modal: use native <dialog> with inert -->
<main inert><!-- content behind modal --></main>
<dialog open><!-- focus stays here; Escape closes --></dialog>

<!-- Non-modal overlays: use Popover API -->
<button popovertarget="menu">Open</button>
<div id="menu" popover><!-- light-dismiss, no z-index wars --></div>
```

### Undo Over Confirmation

Undo is better than confirmation dialogs — users click through confirmations mindlessly. Remove from UI immediately, show undo toast, actually delete after toast expires. Reserve confirmation dialogs for truly irreversible or high-cost actions.

### Keyboard Navigation

Use roving tabindex for component groups (tabs, menu items, radio groups): one item is tabbable at a time; arrow keys move within the group; Tab moves to the next component.

---

## Spatial Design

### 4pt Base System

8pt is too coarse — you'll frequently need 12px. Use 4pt increments: 4, 8, 12, 16, 24, 32, 48, 64, 96px. Name tokens semantically (`--space-sm`, `--space-lg`), not by value (`--spacing-8`).

### Semantic Spacing by Relationship

Spacing communicates grouping. Items that belong together get less space between them than items that are separate. Without rhythm, layouts feel monotonous. Use `gap` instead of margins for sibling spacing — eliminates margin collapse.

### Container Queries as Primary

Container queries are for components; viewport queries are for page layouts:

```css
.card-container { container-type: inline-size; }

@container (min-width: 400px) {
  .card { grid-template-columns: 120px 1fr; }
}
```

A card in a narrow sidebar stays compact, while the same card in a main content area expands — no viewport hacks.

### Squint Test for Hierarchy

Blur your eyes (or blur a screenshot). Can you still identify the most important element, the second most important, and clear groupings? If everything looks the same weight blurred, you have a hierarchy problem.

Hierarchy needs multiple dimensions simultaneously: size + weight + color + space. A heading that's larger, bolder, AND has more space above it.

### Cards Used Sparingly

Use cards only when content is truly distinct and actionable, items need visual comparison in a grid, or content needs clear interaction boundaries. Spacing and alignment create grouping naturally — cards are not required.

---

## UX Writing

### Button Labels

Specific verb + object, always. Never "OK", "Submit", "Yes/No":

| Bad | Good |
|-----|------|
| OK | Save changes |
| Submit | Create account |
| Yes | Delete message |
| Cancel | Keep editing |
| Click here | Download PDF |

For destructive actions, name the destruction: "Delete 5 items" not "Delete selected".

### Error Message Formula

Answer three questions in every error: (1) What happened? (2) Why? (3) How to fix it?

"Email address isn't valid. Please include an @ symbol." — not "Invalid input".

Never blame the user: "Please enter a date in MM/DD/YYYY format" — not "You entered an invalid date".

### Empty States as Onboarding

Acknowledge briefly → explain the value of filling it → provide a clear action. "No projects yet. Create your first one to get started." — not "No items".

### Translation Expansion Budget

Design with expansion space built in:

| Language | Expansion |
|----------|-----------|
| German | +30% |
| French | +20% |
| Finnish | +30–40% |
| Chinese | −30% (same pixel width) |

Keep numbers separate from strings. Use full sentences as single translation units (word order varies). Avoid abbreviations.

### Consistency

Pick one term and never vary it: Delete (not Remove/Trash), Settings (not Preferences/Options), Sign in (not Log in/Enter). Build a terminology glossary and enforce it — variety creates confusion.

---

## Improvement Modes

When the user wants targeted improvement, activate one of these modes:

| Mode | Intent | What to Do |
|------|--------|------------|
| **/distill** | Strip to essence | Remove decorative excess, tighten spacing, reduce color count, eliminate redundant copy |
| **/bolder** | Amplify timid design | Push contrast and scale, increase type sizes, strengthen color hierarchy, add decisive whitespace |
| **/quieter** | Tone down overcrowded design | Reduce noise, shrink secondary elements, dial back animation, simplify palette |
| **/harden** | Add robustness | Implement all 8 interaction states, i18n edge cases, empty states, error states, loading states, reduced-motion support |
| **/overdrive** | Push to technically extraordinary | WebGL/Canvas effects, View Transitions API, CSS spring physics, scroll-driven animations, complex orchestration |
| **/polish** | Pre-ship quality pass | Run through the full checklist: contrast, keyboard nav, focus rings, reduced motion, responsive breakpoints, font loading, token consistency |
| **/audit** | Comprehensive quality check | No edits — produce a report only, flagged by severity (critical / warning / suggestion) |
