# SEO Checklists Reference

## Pre-Launch SEO Checklist

### Technical Foundation
- [ ] `robots.txt` exists and allows crawling of important pages
- [ ] `sitemap.xml` generated and submitted to Google Search Console
- [ ] All pages have unique `<title>` tags (50-60 chars)
- [ ] All pages have unique `<meta description>` (150-160 chars)
- [ ] All pages have `<link rel="canonical">` pointing to themselves
- [ ] 404 page exists and is helpful
- [ ] HTTPS enforced everywhere (no mixed content)
- [ ] `www` vs non-`www` redirect set up (pick one)
- [ ] Mobile-friendly (passes Google's Mobile-Friendly Test)
- [ ] Page load time < 3 seconds
- [ ] No JavaScript-only content (SSR or SSG for important pages)

### On-Page
- [ ] Every page has exactly one `<h1>`
- [ ] Heading hierarchy is logical (H1 → H2 → H3, no skips)
- [ ] Images have descriptive `alt` attributes
- [ ] Images are optimized (WebP, lazy-loaded, responsive sizes)
- [ ] Internal linking connects related pages
- [ ] URLs are clean and descriptive (`/pricing` not `/page?id=3`)
- [ ] No orphan pages (every page linked from at least one other page)

### Structured Data
- [ ] Organization schema on homepage
- [ ] BreadcrumbList on all pages with breadcrumbs
- [ ] Product/SoftwareApplication schema on product pages
- [ ] FAQPage schema on FAQ page
- [ ] BlogPosting schema on blog posts

### Analytics
- [ ] Google Search Console set up and verified
- [ ] Analytics tool installed (PostHog, Plausible, or GA4)
- [ ] Core Web Vitals being tracked

## Blog Post SEO Template

```markdown
---
title: "[Primary Keyword] — [Benefit or Hook]" (50-60 chars)
description: "[Compelling description with primary keyword]" (150-160 chars)
slug: /blog/[primary-keyword-with-hyphens]
publishedAt: YYYY-MM-DD
updatedAt: YYYY-MM-DD
author: [name]
tags: [tag1, tag2]
image: /blog/[slug]/og.png
---

# [H1 — contains primary keyword, slightly different from title]

[Opening paragraph — hook the reader, mention the problem, include primary keyword naturally within first 100 words]

## [H2 — secondary keyword or key subtopic]

[Content — 300-500 words per section]

## [H2 — another subtopic]

[Content]

### [H3 — sub-subtopic if needed]

[Content]

## Conclusion / Key Takeaways

[Summary — restate primary keyword naturally]

## FAQ (optional — great for featured snippets)

### [Question containing keyword]?

[Concise answer — 40-50 words ideal for featured snippets]
```

## Core Web Vitals Optimization

### LCP (Largest Contentful Paint) — Target: < 2.5s

| Cause | Fix |
|-------|-----|
| Large images | Use `next/image` with `priority` for above-fold images |
| Render-blocking CSS/JS | Inline critical CSS, defer non-critical JS |
| Slow server response | Use CDN, optimize database queries, add caching |
| Client-side rendering | Use SSR or SSG for landing pages |

### INP (Interaction to Next Paint) — Target: < 200ms

| Cause | Fix |
|-------|-----|
| Long tasks on main thread | Break up with `requestIdleCallback` or Web Workers |
| Heavy event handlers | Debounce/throttle user input handlers |
| Large DOM | Virtualize long lists, reduce DOM depth |

### CLS (Cumulative Layout Shift) — Target: < 0.1

| Cause | Fix |
|-------|-----|
| Images without dimensions | Always set `width` and `height` attributes |
| Ads/embeds without reserved space | Use `aspect-ratio` or min-height |
| Web fonts causing FOUT | Use `font-display: swap` + preload |
| Dynamic content insertion | Reserve space for dynamic elements |

## Schema Markup Examples

### Organization (homepage)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company",
  "url": "https://yoursite.com",
  "logo": "https://yoursite.com/logo.png",
  "sameAs": [
    "https://twitter.com/yourcompany",
    "https://linkedin.com/company/yourcompany"
  ]
}
```

### FAQPage
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is your product?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our product is..."
      }
    }
  ]
}
```

### BreadcrumbList
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://yoursite.com" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://yoursite.com/blog" },
    { "@type": "ListItem", "position": 3, "name": "Post Title" }
  ]
}
```
