# Performance Optimisation Reference

Expert guidance for optimising Shopify store performance including theme speed, asset optimisation, and Core Web Vitals.

## Core Capabilities

### 1. Image Optimisation

Images are typically the largest assets - optimise aggressively.

**Use Shopify CDN Image Sizing:**
```liquid
{# ❌ Don't load full-size images #}
<img src="{{ product.featured_image.src }}" alt="{{ product.title }}">

{# ✅ Use img_url filter with appropriate size #}
<img
  src="{{ product.featured_image | img_url: '800x800' }}"
  alt="{{ product.featured_image.alt | escape }}"
  loading="lazy"
  width="800"
  height="800"
>
```

**Responsive Images:**
```liquid
<img
  src="{{ image | img_url: '800x' }}"
  srcset="
    {{ image | img_url: '400x' }} 400w,
    {{ image | img_url: '800x' }} 800w,
    {{ image | img_url: '1200x' }} 1200w,
    {{ image | img_url: '1600x' }} 1600w
  "
  sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
  alt="{{ image.alt | escape }}"
  loading="lazy"
  width="800"
  height="800"
>
```

**Modern Image Formats:**
```liquid
<picture>
  {# WebP for modern browsers #}
  <source
    type="image/webp"
    srcset="
      {{ image | img_url: '400x', format: 'pjpg' }} 400w,
      {{ image | img_url: '800x', format: 'pjpg' }} 800w
    "
  >

  {# Fallback to JPEG #}
  <img
    src="{{ image | img_url: '800x' }}"
    srcset="
      {{ image | img_url: '400x' }} 400w,
      {{ image | img_url: '800x' }} 800w
    "
    alt="{{ image.alt | escape }}"
    loading="lazy"
  >
</picture>
```

**Lazy Loading:**
```liquid
{# Native lazy loading #}
<img
  src="{{ image | img_url: '800x' }}"
  alt="{{ image.alt | escape }}"
  loading="lazy"
  decoding="async"
>

{# Eager load above-the-fold images #}
{% if forloop.index <= 3 %}
  <img src="{{ image | img_url: '800x' }}" loading="eager">
{% else %}
  <img src="{{ image | img_url: '800x' }}" loading="lazy">
{% endif %}
```

**Preload Critical Images:**
```liquid
{# In <head> for hero images #}
<link
  rel="preload"
  as="image"
  href="{{ section.settings.hero_image | img_url: '1920x' }}"
  imagesrcset="
    {{ section.settings.hero_image | img_url: '800x' }} 800w,
    {{ section.settings.hero_image | img_url: '1920x' }} 1920w
  "
  imagesizes="100vw"
>
```

### 2. JavaScript Optimisation

Reduce JS payload and execution time.

**Defer Non-Critical JavaScript:**
```html
{# ❌ Blocking JavaScript #}
<script src="{{ 'theme.js' | asset_url }}"></script>

{# ✅ Deferred JavaScript #}
<script src="{{ 'theme.js' | asset_url }}" defer></script>

{# ✅ Async for independent scripts #}
<script src="{{ 'analytics.js' | asset_url }}" async></script>
```

**Inline Critical JavaScript:**
```liquid
{# Inline small, critical scripts #}
<script>
  // Critical initialisation code
  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js');
</script>
```

**Code Splitting:**
```javascript
// Load features only when needed
async function loadCart() {
  const { Cart } = await import('./cart.js');
  return new Cart();
}

// Load on interaction
document.querySelector('.cart-icon').addEventListener('click', async () => {
  const cart = await loadCart();
  cart.open();
}, { once: true });
```

**Remove Unused JavaScript:**
```javascript
// ❌ Don't load libraries you don't use
// Example: Don't include entire jQuery if you only need a few functions

// ✅ Use native alternatives
// Instead of: $('.selector').hide()
// Use: document.querySelector('.selector').style.display = 'none';

// Instead of: $.ajax()
// Use: fetch()
```

**Minify JavaScript:**
```bash
# Use build tools to minify
npm install terser --save-dev

# Minify
terser theme.js -o theme.min.js -c -m
```

### 3. CSS Optimisation

Optimise stylesheets for faster rendering.

**Critical CSS:**
```liquid
{# Inline critical above-the-fold CSS in <head> #}
<style>
  /* Critical CSS only (header, hero) */
  .header { /* ... */ }
  .hero { /* ... */ }
  .button { /* ... */ }
</style>

{# Load full CSS deferred #}
<link
  rel="preload"
  href="{{ 'theme.css' | asset_url }}"
  as="style"
  onload="this.onload=null;this.rel='stylesheet'"
>
<noscript>
  <link rel="stylesheet" href="{{ 'theme.css' | asset_url }}">
</noscript>
```

**Remove Unused CSS:**
```bash
# Use PurgeCSS to remove unused styles
npm install @fullhuman/postcss-purgecss --save-dev

# Configure in postcss.config.js
module.exports = {
  plugins: [
    require('@fullhuman/postcss-purgecss')({
      content: ['./**/*.liquid'],
      defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
    }),
  ],
};
```

**Minify CSS:**
```bash
# Use cssnano
npm install cssnano --save-dev

# Minify
npx cssnano style.css style.min.css
```

**Avoid @import:**
```css
/* ❌ Don't use @import (blocks rendering) */
@import url('fonts.css');

/* ✅ Use multiple <link> tags instead */
```

```liquid
<link rel="stylesheet" href="{{ 'main.css' | asset_url }}">
<link rel="stylesheet" href="{{ 'fonts.css' | asset_url }}">
```

### 4. Font Optimisation

Optimise web fonts for faster text rendering.

**Font Loading:**
```liquid
{# Preload fonts #}
<link
  rel="preload"
  href="{{ 'font.woff2' | asset_url }}"
  as="font"
  type="font/woff2"
  crossorigin
>

{# Font face with font-display #}
<style>
  @font-face {
    font-family: 'CustomFont';
    src: url('{{ 'font.woff2' | asset_url }}') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap; /* Show fallback font immediately */
  }
</style>
```

**System Font Stack:**
```css
/* Use system fonts for instant rendering */
body {
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    "Helvetica Neue",
    Arial,
    sans-serif;
}
```

**Subset Fonts:**
```css
/* Load only required characters */
@font-face {
  font-family: 'CustomFont';
  src: url('font-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153;
}
```

### 5. Liquid Template Optimisation

Optimise Liquid rendering for faster server response.

**Cache Expensive Operations:**
```liquid
{# ❌ Repeated calculations #}
{% for i in (1..10) %}
  {{ collection.products.size }}  {# Calculated 10 times #}
{% endfor %}

{# ✅ Cache result #}
{% assign product_count = collection.products.size %}
{% for i in (1..10) %}
  {{ product_count }}
{% endfor %}
```

**Use limit and offset:**
```liquid
{# ❌ Iterate full array and break #}
{% for product in collection.products %}
  {% if forloop.index > 5 %}{% break %}{% endif %}
  {{ product.title }}
{% endfor %}

{# ✅ Use limit #}
{% for product in collection.products limit: 5 %}
  {{ product.title }}
{% endfor %}
```

**Avoid Nested Loops:**
```liquid
{# ❌ O(n²) complexity #}
{% for product in collection.products %}
  {% for variant in product.variants %}
    {# Expensive nested loop #}
  {% endfor %}
{% endfor %}

{# ✅ Flatten or preprocess #}
{% assign all_variants = collection.products | map: 'variants' | flatten %}
{% for variant in all_variants limit: 50 %}
  {{ variant.title }}
{% endfor %}
```

**Prefer render over include:**
```liquid
{# ❌ include (slower, shared scope) #}
{% include 'product-card' %}

{# ✅ render (faster, isolated scope) #}
{% render 'product-card', product: product %}
```

**Use section-specific stylesheets:**
```liquid
{# Scope CSS to section for better caching #}
{% stylesheet %}
  .my-section { /* ... */ }
{% endstylesheet %}

{# Scope JavaScript to section #}
{% javascript %}
  class MySection { /* ... */ }
{% endjavascript %}
```

### 6. Third-Party Script Optimisation

Minimise impact of external scripts.

**Defer Third-Party Scripts:**
```liquid
{# ❌ Blocking third-party script #}
<script src="https://external.com/script.js"></script>

{# ✅ Async or defer #}
<script src="https://external.com/script.js" async></script>

{# ✅ Load on user interaction #}
<script>
  let gaLoaded = false;
  function loadGA() {
    if (gaLoaded) return;
    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_ID';
    script.async = true;
    document.head.appendChild(script);
    gaLoaded = true;
  }

  // Load on scroll or after delay
  window.addEventListener('scroll', loadGA, { once: true });
  setTimeout(loadGA, 3000);
</script>
```

**Use Facade Pattern:**
```html
{# Show placeholder instead of embedding heavy iframe #}
<div class="video-facade" data-video-id="abc123">
  <img src="thumbnail.jpg" alt="Video">
  <button onclick="loadVideo(this)">Play Video</button>
</div>

<script>
  function loadVideo(btn) {
    const facade = btn.parentElement;
    const videoId = facade.dataset.videoId;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    facade.replaceWith(iframe);
  }
</script>
```

### 7. Caching Strategies

Leverage browser and CDN caching.

**Asset Versioning:**
```liquid
{# Shopify auto-versions assets #}
<link rel="stylesheet" href="{{ 'theme.css' | asset_url }}">
{# Outputs: /cdn/.../theme.css?v=12345678 #}
```

**Long Cache Headers:**
```liquid
{# Shopify CDN sets appropriate cache headers #}
{# CSS/JS: 1 year #}
{# Images: 1 year #}
```

**Service Worker (Advanced):**
```javascript
// sw.js - Cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('v1').then(cache => {
      return cache.addAll([
        '/cdn/.../theme.css',
        '/cdn/.../theme.js',
        '/cdn/.../logo.png',
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
```

### 8. Core Web Vitals Optimisation

Improve Google's Core Web Vitals metrics.

**Largest Contentful Paint (LCP):**
```liquid
{# Optimise largest element load time #}

{# 1. Preload hero image #}
<link rel="preload" as="image" href="{{ hero_image | img_url: '1920x' }}">

{# 2. Use priority hint #}
<img src="{{ hero_image | img_url: '1920x' }}" fetchpriority="high">

{# 3. Optimise server response time (use Shopify CDN) #}

{# 4. Remove render-blocking resources #}
<script src="theme.js" defer></script>
```

**Interaction to Next Paint (INP):**
```javascript
// 1. Reduce JavaScript execution time
// 2. Break up long tasks
function processItems(items) {
  // ❌ Long task
  items.forEach(item => processItem(item));

  // ✅ Break into smaller chunks
  async function processInChunks() {
    for (let i = 0; i < items.length; i++) {
      processItem(items[i]);

      // Yield to main thread every 50 items
      if (i % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }
  processInChunks();
}

// 3. Use requestIdleCallback
requestIdleCallback(() => {
  // Non-critical work
});
```

**Cumulative Layout Shift (CLS):**
```liquid
{# 1. Always set width and height on images #}
<img
  src="{{ image | img_url: '800x' }}"
  width="800"
  height="600"
  alt="Product"
>

{# 2. Reserve space for dynamic content #}
<div style="min-height: 400px;">
  {# Content loads here #}
</div>

{# 3. Use aspect-ratio for responsive images #}
<style>
  .image-container {
    aspect-ratio: 16 / 9;
  }
</style>
```

### 9. Performance Monitoring

Track performance metrics.

**Measure Core Web Vitals:**
```javascript
// Load web-vitals library
import { getCLS, getINP, getLCP } from 'web-vitals';

function sendToAnalytics({ name, value, id }) {
  // Send to analytics
  gtag('event', name, {
    event_category: 'Web Vitals',
    event_label: id,
    value: Math.round(name === 'CLS' ? value * 1000 : value),
  });
}

getCLS(sendToAnalytics);
getINP(sendToAnalytics);
getLCP(sendToAnalytics);
```

**Performance Observer:**
```javascript
// Monitor long tasks
const observer = new PerformanceObserver(list => {
  for (const entry of list.getEntries()) {
    console.warn('Long task detected:', entry.duration, 'ms');
  }
});

observer.observe({ entryTypes: ['longtask'] });
```

## Performance Checklist

**Images:**
- [ ] Use `img_url` filter with appropriate sizes
- [ ] Implement responsive images with `srcset`
- [ ] Add `loading="lazy"` to below-fold images
- [ ] Set explicit `width` and `height` attributes
- [ ] Preload critical hero images
- [ ] Use modern formats (WebP)

**JavaScript:**
- [ ] Defer or async all non-critical scripts
- [ ] Minify and bundle JavaScript
- [ ] Code-split large bundles
- [ ] Remove unused code
- [ ] Lazy load features on interaction

**CSS:**
- [ ] Inline critical CSS
- [ ] Defer non-critical CSS
- [ ] Remove unused styles
- [ ] Minify stylesheets
- [ ] Avoid `@import`

**Fonts:**
- [ ] Preload critical fonts
- [ ] Use `font-display: swap`
- [ ] Consider system font stack
- [ ] Subset fonts when possible

**Third-Party:**
- [ ] Audit all third-party scripts
- [ ] Load scripts async or on interaction
- [ ] Use facade pattern for heavy embeds
- [ ] Monitor third-party impact

**Liquid:**
- [ ] Cache expensive calculations
- [ ] Use `limit` instead of manual breaks
- [ ] Prefer `render` over `include`
- [ ] Avoid nested loops

**Core Web Vitals:**
- [ ] LCP < 2.5s
- [ ] INP < 200ms
- [ ] CLS < 0.1

## Best Practices

1. **Test on real devices** - Mobile 3G performance matters
2. **Use Lighthouse** for performance audits
3. **Monitor Core Web Vitals** in production
4. **Optimise above-the-fold** content first
5. **Lazy load everything else** below the fold
6. **Minimise main thread work** for better interactivity
7. **Use Shopify CDN** for all assets
8. **Version assets** for effective caching
9. **Compress images** before uploading
10. **Regular performance audits** to catch regressions
