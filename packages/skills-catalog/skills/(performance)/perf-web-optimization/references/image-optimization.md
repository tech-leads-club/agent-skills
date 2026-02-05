# Image Optimization

## Table of Contents
- [Modern Formats](#modern-formats)
- [Responsive Images](#responsive-images)
- [Sharp Script](#sharp-script)
- [Framework Components](#framework-components)

---

## Modern Formats

| Format | Use Case | Savings |
|--------|----------|---------|
| AVIF | Best compression, modern browsers | 50-80% vs JPEG |
| WebP | Good compression, wide support | 25-35% vs JPEG |
| JPEG | Fallback for old browsers | baseline |

### Picture Element with Fallbacks

```html
<picture>
  <source srcset="/image.avif" type="image/avif">
  <source srcset="/image.webp" type="image/webp">
  <img src="/image.jpg" alt="Description" width="800" height="600">
</picture>
```

---

## Responsive Images

### srcset with width descriptors

```html
<img
  src="/image-800.jpg"
  srcset="
    /image-400.jpg 400w,
    /image-800.jpg 800w,
    /image-1200.jpg 1200w
  "
  sizes="(max-width: 600px) 100vw, 50vw"
  alt="Description"
  width="800"
  height="600"
  loading="lazy"
>
```

### Full responsive picture

```html
<picture>
  <source
    srcset="/hero-400.avif 400w, /hero-800.avif 800w, /hero-1200.avif 1200w"
    sizes="100vw"
    type="image/avif"
  >
  <source
    srcset="/hero-400.webp 400w, /hero-800.webp 800w, /hero-1200.webp 1200w"
    sizes="100vw"
    type="image/webp"
  >
  <img
    src="/hero-800.jpg"
    srcset="/hero-400.jpg 400w, /hero-800.jpg 800w, /hero-1200.jpg 1200w"
    sizes="100vw"
    alt="Hero"
    width="1200"
    height="600"
  >
</picture>
```

---

## Sharp Script

Batch convert images to modern formats and sizes:

```javascript
// scripts/optimize-images.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SIZES = [400, 800, 1200];
const INPUT_DIR = './images/original';
const OUTPUT_DIR = './public/images';

async function optimizeImage(inputPath) {
  const filename = path.basename(inputPath, path.extname(inputPath));

  for (const size of SIZES) {
    const resized = sharp(inputPath).resize(size);

    // AVIF
    await resized
      .avif({ quality: 70 })
      .toFile(`${OUTPUT_DIR}/${filename}-${size}.avif`);

    // WebP
    await resized
      .webp({ quality: 80 })
      .toFile(`${OUTPUT_DIR}/${filename}-${size}.webp`);

    // JPEG fallback
    await resized
      .jpeg({ quality: 80, progressive: true })
      .toFile(`${OUTPUT_DIR}/${filename}-${size}.jpg`);
  }
}

// Process all images
fs.readdirSync(INPUT_DIR)
  .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
  .forEach(f => optimizeImage(path.join(INPUT_DIR, f)));
```

Run: `node scripts/optimize-images.js`

---

## Framework Components

### Next.js Image

```javascript
import Image from 'next/image';

// Automatic optimization
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // For LCP images
/>

// Fill container
<div style={{ position: 'relative', height: 400 }}>
  <Image src="/bg.jpg" alt="Background" fill style={{ objectFit: 'cover' }} />
</div>
```

### Astro Image

```astro
---
import { Image } from 'astro:assets';
import hero from '../assets/hero.png';
---

<Image src={hero} alt="Hero" width={1200} height={600} />
```

### Vite imagetools

```javascript
// vite.config.js
import { imagetools } from 'vite-imagetools';

export default {
  plugins: [imagetools()]
};

// Usage in code
import heroSrcset from './hero.jpg?w=400;800;1200&format=webp&as=srcset';
```
