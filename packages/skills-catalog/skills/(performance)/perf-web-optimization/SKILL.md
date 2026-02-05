---
name: perf-web-optimization
description: "Optimize web performance: Core Web Vitals (LCP, CLS, INP), bundle size, images, caching. Use when site is slow, optimizing for Lighthouse scores, reducing bundle size, fixing layout shifts, or improving Time to Interactive. Triggers on: web performance, Core Web Vitals, LCP, CLS, INP, FID, bundle size, page speed, slow site."
---

# Web Performance Optimization

Systematic approach: Measure → Identify → Prioritize → Implement → Verify.

## Target Metrics

| Metric | Good | Needs Work | Poor |
|--------|------|------------|------|
| LCP | < 2.5s | 2.5-4s | > 4s |
| INP | < 200ms | 200-500ms | > 500ms |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |
| TTFB | < 800ms | 800ms-1.8s | > 1.8s |

## Quick Wins

### 1. Images (usually biggest impact on LCP)

```html
<!-- Hero/LCP image: eager + high priority -->
<img src="/hero.webp" alt="Hero" width="1200" height="600"
     loading="eager" fetchpriority="high" decoding="async">

<!-- Below fold: lazy load -->
<img src="/product.webp" alt="Product" width="400" height="300"
     loading="lazy" decoding="async">
```

Always set `width` and `height` to prevent CLS.

### 2. Fonts (common LCP/CLS culprit)

```html
<!-- Preconnect to font origin -->
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Non-blocking font load -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter&display=swap"
      media="print" onload="this.media='all'">
```

### 3. Third-party Scripts (common INP killer)

```html
<!-- Defer to user interaction -->
<script>
  function loadThirdParty() {
    // Load analytics, chat widgets, etc.
  }
  ['scroll','click','touchstart'].forEach(e =>
    addEventListener(e, loadThirdParty, {once:true, passive:true})
  );
  setTimeout(loadThirdParty, 5000);
</script>
```

### 4. Critical CSS

Inline critical CSS in `<head>`, defer the rest:

```html
<style>/* critical styles */</style>
<link rel="preload" href="/styles.css" as="style" onload="this.rel='stylesheet'">
```

## Bundle Analysis

```bash
# Webpack
npx webpack-bundle-analyzer dist/stats.json

# Vite
npx vite-bundle-visualizer

# Check package size before installing
npx bundlephobia <package-name>
```

Common heavy packages to replace:
- `moment` (67KB) → `date-fns` (12KB) or `dayjs` (2KB)
- `lodash` (72KB) → cherry-pick imports or native methods

## Code Splitting Patterns

```javascript
// React lazy
const Chart = lazy(() => import('./Chart'));

// Next.js dynamic
const Admin = dynamic(() => import('./Admin'), { ssr: false });

// Vite/Rollup manual chunks
build: {
  rollupOptions: {
    output: {
      manualChunks: { vendor: ['react', 'react-dom'] }
    }
  }
}
```

## Caching Headers

```
# Static assets (immutable hash in filename)
Cache-Control: public, max-age=31536000, immutable

# HTML (revalidate)
Cache-Control: no-cache

# API responses
Cache-Control: private, max-age=0, must-revalidate
```

## Measurement

```bash
# Quick audit
npx lighthouse https://site.com --preset=perf --form-factor=mobile
```

For running audits, reading reports, and setting budgets, see **perf-lighthouse**.

## Checklist

### Images
- [ ] Modern formats (WebP/AVIF)
- [ ] Responsive `srcset`
- [ ] `width`/`height` attributes
- [ ] `loading="lazy"` below fold
- [ ] `fetchpriority="high"` on LCP image

### JavaScript
- [ ] Bundle < 200KB gzipped
- [ ] Code splitting by route
- [ ] Third-party scripts deferred
- [ ] No unused dependencies

### CSS
- [ ] Critical CSS inlined
- [ ] Non-critical CSS deferred
- [ ] No unused CSS

### Fonts
- [ ] `font-display: swap`
- [ ] Preconnect to font origin
- [ ] Subset if possible

## Detailed Examples

For in-depth optimization patterns, see:
- [references/core-web-vitals.md](references/core-web-vitals.md) - Fixing LCP, CLS, INP issues
- [references/bundle-optimization.md](references/bundle-optimization.md) - Reducing JS bundle size
- [references/image-optimization.md](references/image-optimization.md) - Image formats, responsive images, sharp scripts
