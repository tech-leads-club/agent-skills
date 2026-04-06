# Color Palettes Reference

20 curated palettes organized by mood/industry. Each includes 6 colors for both light and dark modes with Tailwind config snippets.

---

## SaaS / Tech

### 1. Midnight Indigo

Clean, trustworthy, modern SaaS feel.

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Brand | `#4F46E5` | `#818CF8` |
| Accent | `#06B6D4` | `#22D3EE` |
| Surface | `#FFFFFF` | `#0F172A` |
| Text | `#1E293B` | `#F1F5F9` |
| Border | `#E2E8F0` | `#334155` |
| Muted | `#F8FAFC` | `#1E293B` |

```js
// tailwind.config.js
colors: {
  brand: { DEFAULT: "#4F46E5", dark: "#818CF8" },
  accent: { DEFAULT: "#06B6D4", dark: "#22D3EE" },
  surface: { DEFAULT: "#FFFFFF", dark: "#0F172A" },
}
```

### 2. Electric Violet

Bold, developer-focused, modern.

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Brand | `#7C3AED` | `#A78BFA` |
| Accent | `#F59E0B` | `#FBBF24` |
| Surface | `#FAFAFA` | `#09090B` |
| Text | `#18181B` | `#FAFAFA` |
| Border | `#E4E4E7` | `#27272A` |
| Muted | `#F4F4F5` | `#18181B` |

```js
colors: {
  brand: { DEFAULT: "#7C3AED", dark: "#A78BFA" },
  accent: { DEFAULT: "#F59E0B", dark: "#FBBF24" },
}
```

### 3. Ocean Blue

Enterprise, reliable, professional.

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Brand | `#2563EB` | `#60A5FA` |
| Accent | `#10B981` | `#34D399` |
| Surface | `#FFFFFF` | `#0C1222` |
| Text | `#1E293B` | `#E2E8F0` |
| Border | `#CBD5E1` | `#334155` |
| Muted | `#F1F5F9` | `#1E293B` |

```js
colors: {
  brand: { DEFAULT: "#2563EB", dark: "#60A5FA" },
  accent: { DEFAULT: "#10B981", dark: "#34D399" },
}
```

### 4. Slate Minimal

Ultra-clean, Stripe-inspired.

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Brand | `#0F172A` | `#F8FAFC` |
| Accent | `#6366F1` | `#818CF8` |
| Surface | `#FFFFFF` | `#020617` |
| Text | `#334155` | `#CBD5E1` |
| Border | `#E2E8F0` | `#1E293B` |
| Muted | `#F8FAFC` | `#0F172A` |

```js
colors: {
  brand: { DEFAULT: "#0F172A", dark: "#F8FAFC" },
  accent: { DEFAULT: "#6366F1", dark: "#818CF8" },
}
```

---

## Health / Wellness

### 5. Sage Green

Calm, organic, wellness-focused.

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Brand | `#059669` | `#6EE7B7` |
| Accent | `#D97706` | `#FCD34D` |
| Surface | `#FFFBF5` | `#0D1B12` |
| Text | `#1C3829` | `#ECFDF5` |
| Border | `#D1E7DD` | `#1F3D2B` |
| Muted | `#F0FDF4` | `#14291C` |

```js
colors: {
  brand: { DEFAULT: "#059669", dark: "#6EE7B7" },
  accent: { DEFAULT: "#D97706", dark: "#FCD34D" },
  surface: { DEFAULT: "#FFFBF5", dark: "#0D1B12" },
}
```

### 6. Lavender Bloom

Soft, therapeutic, mindful.

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Brand | `#8B5CF6` | `#C4B5FD` |
| Accent | `#EC4899` | `#F9A8D4` |
| Surface | `#FEFCFF` | `#110D1B` |
| Text | `#2E1065` | `#EDE9FE` |
| Border | `#DDD6FE` | `#3B2770` |
| Muted | `#F5F3FF` | `#1E1533` |

```js
colors: {
  brand: { DEFAULT: "#8B5CF6", dark: "#C4B5FD" },
  accent: { DEFAULT: "#EC4899", dark: "#F9A8D4" },
}
```

### 7. Ocean Breeze

Fresh, aquatic, spa-inspired.

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Brand | `#0891B2` | `#67E8F9` |
| Accent | `#059669` | `#6EE7B7` |
| Surface | `#F0FDFA` | `#042F2E` |
| Text | `#134E4A` | `#CCFBF1` |
| Border | `#99F6E4` | `#115E59` |
| Muted | `#ECFDF5` | `#064E3B` |

```js
colors: {
  brand: { DEFAULT: "#0891B2", dark: "#67E8F9" },
  accent: { DEFAULT: "#059669", dark: "#6EE7B7" },
}
```

### 8. Warm Earth

Grounded, natural, holistic.

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Brand | `#B45309` | `#FCD34D` |
| Accent | `#65A30D` | `#A3E635` |
| Surface | `#FFFBEB` | `#1C1208` |
| Text | `#451A03` | `#FEF3C7` |
| Border | `#FDE68A` | `#713F12` |
| Muted | `#FEF3C7` | `#3B2408` |

```js
colors: {
  brand: { DEFAULT: "#B45309", dark: "#FCD34D" },
  accent: { DEFAULT: "#65A30D", dark: "#A3E635" },
}
```

---

## Luxury / Premium

### 9. Black Gold

High-end, exclusive, editorial.

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Brand | `#1C1917` | `#FAFAF9` |
| Accent | `#CA8A04` | `#FACC15` |
| Surface | `#FAFAF9` | `#0C0A09` |
| Text | `#292524` | `#E7E5E4` |
| Border | `#D6D3D1` | `#292524` |
| Muted | `#F5F5F4` | `#1C1917` |

```js
colors: {
  brand: { DEFAULT: "#1C1917", dark: "#FAFAF9" },
  accent: { DEFAULT: "#CA8A04", dark: "#FACC15" },
}
```

### 10. Royal Navy

Sophisticated, banking, finance.

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Brand | `#1E3A5F` | `#93C5FD` |
| Accent | `#B45309` | `#FCD34D` |
| Surface | `#FAFBFD` | `#0A1628` |
| Text | `#0F172A` | `#E2E8F0` |
| Border | `#CBD5E1` | `#1E3A5F` |
| Muted | `#EFF6FF` | `#0F1D32` |

```js
colors: {
  brand: { DEFAULT: "#1E3A5F", dark: "#93C5FD" },
  accent: { DEFAULT: "#B45309", dark: "#FCD34D" },
}
```

### 11. Rosewood

Elegant, fashion, beauty.

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Brand | `#9F1239` | `#FDA4AF` |
| Accent | `#A16207` | `#FDE047` |
| Surface | `#FFF1F2` | `#1A0A0E` |
| Text | `#4C0519` | `#FFE4E6` |
| Border | `#FECDD3` | `#4C0519` |
| Muted | `#FFF1F2` | `#2A0E15` |

```js
colors: {
  brand: { DEFAULT: "#9F1239", dark: "#FDA4AF" },
  accent: { DEFAULT: "#A16207", dark: "#FDE047" },
}
```

### 12. Champagne

Refined, hospitality, events.

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Brand | `#78716C` | `#D6D3D1` |
| Accent | `#B45309` | `#FCD34D` |
| Surface | `#FAFAF9` | `#0C0A09` |
| Text | `#292524` | `#E7E5E4` |
| Border | `#D6D3D1` | `#44403C` |
| Muted | `#F5F5F4` | `#1C1917` |

```js
colors: {
  brand: { DEFAULT: "#78716C", dark: "#D6D3D1" },
  accent: { DEFAULT: "#B45309", dark: "#FCD34D" },
}
```

---

## Creative / Bold

### 13. Neon Pop

Vibrant, youthful, gaming.

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Brand | `#DC2626` | `#FCA5A5` |
| Accent | `#2563EB` | `#93C5FD` |
| Surface | `#FFFFFF` | `#09090B` |
| Text | `#18181B` | `#FAFAFA` |
| Border | `#E4E4E7` | `#27272A` |
| Muted | `#F4F4F5` | `#18181B` |

```js
colors: {
  brand: { DEFAULT: "#DC2626", dark: "#FCA5A5" },
  accent: { DEFAULT: "#2563EB", dark: "#93C5FD" },
}
```

### 14. Sunset Gradient

Warm, creative agency, portfolio.

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Brand | `#EA580C` | `#FB923C` |
| Accent | `#DB2777` | `#F472B6` |
| Surface | `#FFFBEB` | `#120B05` |
| Text | `#431407` | `#FED7AA` |
| Border | `#FDBA74` | `#7C2D12` |
| Muted | `#FFF7ED` | `#1C0F05` |

**Gradient:** `bg-gradient-to-r from-[#EA580C] to-[#DB2777]`

```js
colors: {
  brand: { DEFAULT: "#EA580C", dark: "#FB923C" },
  accent: { DEFAULT: "#DB2777", dark: "#F472B6" },
}
```

### 15. Electric Lime

High-energy, startup, disruptive.

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Brand | `#65A30D` | `#A3E635` |
| Accent | `#7C3AED` | `#A78BFA` |
| Surface | `#FAFFF5` | `#0A1205` |
| Text | `#1A2E05` | `#ECFCCB` |
| Border | `#BEF264` | `#365314` |
| Muted | `#F7FEE7` | `#14200A` |

```js
colors: {
  brand: { DEFAULT: "#65A30D", dark: "#A3E635" },
  accent: { DEFAULT: "#7C3AED", dark: "#A78BFA" },
}
```

### 16. Coral Punch

Playful, social, community.

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Brand | `#F43F5E` | `#FB7185` |
| Accent | `#0EA5E9` | `#38BDF8` |
| Surface | `#FFFFFF` | `#0F0709` |
| Text | `#1C1917` | `#FFF1F2` |
| Border | `#FECDD3` | `#4C0519` |
| Muted | `#FFF1F2` | `#1A0A0E` |

```js
colors: {
  brand: { DEFAULT: "#F43F5E", dark: "#FB7185" },
  accent: { DEFAULT: "#0EA5E9", dark: "#38BDF8" },
}
```

---

## Dark Mode First

### 17. Obsidian

GitHub-inspired developer dark.

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Brand | `#F8FAFC` | `#F8FAFC` |
| Accent | `#3B82F6` | `#60A5FA` |
| Surface | `#FFFFFF` | `#0D1117` |
| Text | `#1F2937` | `#C9D1D9` |
| Border | `#D1D5DB` | `#30363D` |
| Muted | `#F3F4F6` | `#161B22` |

```js
colors: {
  brand: { DEFAULT: "#F8FAFC", dark: "#F8FAFC" },
  accent: { DEFAULT: "#3B82F6", dark: "#60A5FA" },
  surface: { DEFAULT: "#FFFFFF", dark: "#0D1117" },
}
```

### 18. Deep Space

Ultra-dark, astronomy, data viz.

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Brand | `#6366F1` | `#818CF8` |
| Accent | `#06B6D4` | `#22D3EE` |
| Surface | `#F8FAFC` | `#030712` |
| Text | `#1E293B` | `#E2E8F0` |
| Border | `#E2E8F0` | `#1E293B` |
| Muted | `#F1F5F9` | `#0F172A` |

```js
colors: {
  brand: { DEFAULT: "#6366F1", dark: "#818CF8" },
  accent: { DEFAULT: "#06B6D4", dark: "#22D3EE" },
  surface: { DEFAULT: "#F8FAFC", dark: "#030712" },
}
```

### 19. Charcoal Ember

Warm dark, comfortable reading.

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Brand | `#F97316` | `#FB923C` |
| Accent | `#EAB308` | `#FACC15` |
| Surface | `#FAFAF9` | `#1A1614` |
| Text | `#292524` | `#D6D3D1` |
| Border | `#D6D3D1` | `#44403C` |
| Muted | `#F5F5F4` | `#292524` |

```js
colors: {
  brand: { DEFAULT: "#F97316", dark: "#FB923C" },
  accent: { DEFAULT: "#EAB308", dark: "#FACC15" },
  surface: { DEFAULT: "#FAFAF9", dark: "#1A1614" },
}
```

### 20. Phosphor Green

Terminal, hacker, retro-tech.

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Brand | `#22C55E` | `#4ADE80` |
| Accent | `#06B6D4` | `#22D3EE` |
| Surface | `#F0FDF4` | `#020A04` |
| Text | `#14532D` | `#BBF7D0` |
| Border | `#86EFAC` | `#14532D` |
| Muted | `#DCFCE7` | `#052E16` |

```js
colors: {
  brand: { DEFAULT: "#22C55E", dark: "#4ADE80" },
  accent: { DEFAULT: "#06B6D4", dark: "#22D3EE" },
  surface: { DEFAULT: "#F0FDF4", dark: "#020A04" },
}
```

---

## Using a Palette in Tailwind

Full integration with CSS variables for theme switching:

```css
/* globals.css */
@layer base {
  :root {
    --brand: 239 84% 67%;      /* #4F46E5 in HSL */
    --accent: 188 94% 43%;     /* #06B6D4 */
    --surface: 0 0% 100%;
    --foreground: 215 28% 17%;
    --border: 214 32% 91%;
    --muted: 210 40% 98%;
  }
  .dark {
    --brand: 232 92% 76%;      /* #818CF8 */
    --accent: 188 78% 56%;     /* #22D3EE */
    --surface: 217 33% 11%;
    --foreground: 210 40% 96%;
    --border: 217 19% 27%;
    --muted: 215 28% 17%;
  }
}
```

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      brand: "hsl(var(--brand) / <alpha-value>)",
      accent: "hsl(var(--accent) / <alpha-value>)",
      surface: "hsl(var(--surface) / <alpha-value>)",
    }
  }
}
```
