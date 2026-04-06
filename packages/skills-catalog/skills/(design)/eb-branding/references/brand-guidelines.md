# Brand Guidelines Reference

## Color Theory for Startups

### Color Psychology

| Color | Associations | Good For |
|-------|-------------|----------|
| **Blue** | Trust, stability, professionalism | SaaS, fintech, healthcare |
| **Green** | Growth, nature, money | Finance, sustainability, health |
| **Purple** | Creativity, premium, wisdom | Creative tools, education |
| **Orange** | Energy, warmth, enthusiasm | Consumer apps, marketplaces |
| **Red** | Urgency, passion, power | Food, entertainment (use sparingly) |
| **Black** | Sophistication, luxury, power | Premium products, dev tools |
| **Teal/Cyan** | Modern, tech-forward, calm | Developer tools, productivity |

### OKLCH Color Guide

Why OKLCH over HSL:
- **Perceptually uniform** — Same lightness value = same perceived brightness across hues
- **Better for generating palettes** — Change hue while keeping perceived lightness constant
- **CSS native** — Supported in all modern browsers

Generating a palette:
```
// Keep chroma (saturation) and hue constant, vary lightness
oklch(0.97 0.02 250)  // 50  — backgrounds
oklch(0.93 0.04 250)  // 100 — subtle backgrounds
oklch(0.80 0.08 250)  // 300 — borders, secondary elements
oklch(0.65 0.15 250)  // 500 — primary brand color
oklch(0.45 0.12 250)  // 700 — hover states, emphasis
oklch(0.25 0.08 250)  // 900 — text on light backgrounds
```

### Contrast Checker

| Text Size | Minimum Contrast (AA) | Enhanced (AAA) |
|-----------|----------------------|----------------|
| Normal text (<18px) | 4.5:1 | 7:1 |
| Large text (≥18px or ≥14px bold) | 3:1 | 4.5:1 |
| UI components | 3:1 | — |

## Font Pairing Rules

### Safe Pairings

| Display | Body | Vibe |
|---------|------|------|
| Cal Sans | Inter | Modern startup |
| Plus Jakarta Sans | Geist | Clean, technical |
| Satoshi | System UI | Minimal, fast |
| Space Grotesk | Inter | Techy, geometric |
| Fraunces | Source Sans 3 | Editorial, warm |

### Rules
1. **Never use more than 2 font families** (3 if you count monospace)
2. **Contrast in weight, not in family** — Bold headlines + regular body of the same font works great
3. **Test at real sizes** — A font that looks great at 48px might be unreadable at 14px
4. **Variable fonts** — Fewer HTTP requests, smoother weight transitions

## Brand Consistency Checklist

- [ ] Logo used consistently (same version everywhere)
- [ ] Colors match design tokens exactly (no ad-hoc hex values)
- [ ] Typography follows the scale (no random font sizes)
- [ ] Tone of voice consistent across all copy
- [ ] Dark mode uses the defined dark palette
- [ ] Social media profiles match website branding
- [ ] Email templates use brand colors and fonts
- [ ] Error messages follow tone of voice guidelines
- [ ] 404 page is on-brand
- [ ] Favicon and OG images are brand-consistent
