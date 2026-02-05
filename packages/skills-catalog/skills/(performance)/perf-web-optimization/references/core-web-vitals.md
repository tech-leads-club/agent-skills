# Core Web Vitals Optimization

## Table of Contents
- [LCP (Largest Contentful Paint)](#lcp-largest-contentful-paint)
- [CLS (Cumulative Layout Shift)](#cls-cumulative-layout-shift)
- [INP (Interaction to Next Paint)](#inp-interaction-to-next-paint)

---

## LCP (Largest Contentful Paint)

Target: < 2.5s

### Common Causes
- Large unoptimized images
- Slow server response (TTFB)
- Render-blocking resources
- Client-side rendering delays

### Fix: Optimize LCP Image

```html
<!-- Preload in <head> -->
<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">

<!-- Image tag -->
<picture>
  <source srcset="/hero.avif" type="image/avif">
  <source srcset="/hero.webp" type="image/webp">
  <img src="/hero.jpg" alt="Hero" width="1200" height="600"
       loading="eager" fetchpriority="high" decoding="async">
</picture>
```

### Fix: Reduce TTFB

```javascript
// Next.js: Use static generation when possible
export async function getStaticProps() {
  const data = await fetchData();
  return { props: { data }, revalidate: 60 };
}

// Add stale-while-revalidate for dynamic content
// Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```

---

## CLS (Cumulative Layout Shift)

Target: < 0.1

### Common Causes
- Images without dimensions
- Ads/embeds without reserved space
- Web fonts causing FOIT/FOUT
- Dynamic content injection

### Fix: Reserve Space for Images

```html
<!-- Always specify dimensions -->
<img src="/photo.jpg" alt="Photo" width="800" height="600">

<!-- Or use aspect-ratio -->
<img src="/photo.jpg" alt="Photo" style="aspect-ratio: 4/3; width: 100%;">
```

### Fix: Reserve Space for Dynamic Content

```css
/* Skeleton loader with fixed height */
.ad-slot {
  min-height: 250px;
  background: #f0f0f0;
}

/* Aspect ratio container for embeds */
.video-container {
  aspect-ratio: 16/9;
  width: 100%;
}
```

### Fix: Prevent Font Flash

```css
@font-face {
  font-family: 'CustomFont';
  src: url('/font.woff2') format('woff2');
  font-display: swap; /* or optional for less shift */
}
```

---

## INP (Interaction to Next Paint)

Target: < 200ms

### Common Causes
- Long JavaScript tasks (>50ms)
- Heavy event handlers
- Layout thrashing
- Too much main thread work

### Fix: Break Up Long Tasks

```javascript
// Before: blocks main thread
items.forEach(item => processItem(item));

// After: yield to main thread
async function processWithYield(items) {
  for (const item of items) {
    processItem(item);
    // Yield every 5ms
    if (performance.now() - start > 5) {
      await new Promise(r => setTimeout(r, 0));
      start = performance.now();
    }
  }
}
```

### Fix: Debounce/Throttle Event Handlers

```javascript
// Debounce search input
const search = debounce((query) => {
  fetchResults(query);
}, 300);

input.addEventListener('input', (e) => search(e.target.value));
```

### Fix: Use CSS Instead of JS

```css
/* Prefer CSS for animations */
.animate {
  transition: transform 0.3s ease;
}
.animate:hover {
  transform: scale(1.05);
}

/* Use content-visibility for off-screen content */
.lazy-section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px;
}
```
