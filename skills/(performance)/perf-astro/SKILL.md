---
name: perf-astro
description: "Astro-specific performance optimizations for 95+ Lighthouse scores. Covers critical CSS inlining, compression, font loading, and LCP optimization. Triggers on: astro performance, astro lighthouse, astro optimization, astro-critters."
---

# Astro Performance Playbook

Astro-specific optimizations for 95+ Lighthouse scores.

## Quick Setup

```bash
npm install astro-critters @playform/compress
```

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import critters from 'astro-critters';
import compress from '@playform/compress';

export default defineConfig({
  integrations: [
    critters(),
    compress({
      CSS: true,
      HTML: true,
      JavaScript: true,
      Image: false,
      SVG: false,
    }),
  ],
});
```

## Integrations

### astro-critters

Automatically extracts and inlines critical CSS. No configuration needed.

What it does:
- Scans rendered HTML for above-the-fold elements
- Inlines only the CSS those elements need
- Lazy-loads the rest

Build output shows what it inlined:
```
Inlined 40.70 kB (80% of original 50.50 kB) of _astro/index.xxx.css.
```

### @playform/compress

Minifies HTML, CSS, and JavaScript in the final build.

Options:
```js
compress({
  CSS: true,      // Minify CSS
  HTML: true,     // Minify HTML
  JavaScript: true, // Minify JS
  Image: false,   // Skip if using external image optimization
  SVG: false,     // Skip if SVGs are already optimized
})
```

## Layout Pattern

Structure your `Layout.astro` for performance:

```astro
---
import '../styles/global.css'
---

<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Font fallback (prevents FOIT) -->
    <style>
      @font-face {
        font-family: 'Inter';
        font-display: swap;
        src: local('Inter');
      }
    </style>

    <!-- Non-blocking Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
      media="print"
      onload="this.media='all'"
    />
    <noscript>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap">
    </noscript>

    <!-- Preload LCP images -->
    <link rel="preload" as="image" href="/hero.png" fetchpriority="high">

    <title>{title}</title>

    <!-- Defer third-party scripts -->
    <script>
      let loaded = false;
      function loadAnalytics() {
        if (loaded) return;
        loaded = true;
        // Load GTM, analytics, etc.
      }
      ['scroll', 'click', 'touchstart'].forEach(e => {
        document.addEventListener(e, loadAnalytics, { once: true, passive: true });
      });
      setTimeout(loadAnalytics, 5000);
    </script>
  </head>
  <body>
    <slot />
  </body>
</html>
```

## Measuring

```bash
npx lighthouse https://your-site.com --preset=perf --form-factor=mobile
```

See also:
- **perf-lighthouse** - Running audits, reading reports, setting budgets
- **perf-web-optimization** - Core Web Vitals, bundle size, caching strategies

## Checklist

- [ ] `astro-critters` installed and configured
- [ ] `@playform/compress` installed and configured
- [ ] Google Fonts use `media="print" onload` pattern
- [ ] Third-party scripts deferred to user interaction
- [ ] LCP images preloaded in `<head>`
