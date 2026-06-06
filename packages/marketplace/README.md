# Agent Skills Marketplace

A Next.js static site that serves as a marketplace for browsing and discovering agent skills.

## Overview

The marketplace automatically generates a static website from the skills in the `skills/` directory. It includes:

- Homepage with featured skills, stats, and NPM download metrics
- Skills listing page with search, category filtering, and pagination
- Individual skill detail pages with full content and markdown rendering
- About page displaying repository README
- Dark mode support with theme persistence
- SEO optimized with JSON-LD structured data
- Responsive design with Tailwind CSS
- Static site generation deployed to custom domain

## Development

### Setup

```bash
npm ci
```

### Generate Skills Data

```bash
nx run marketplace:generate-data
```

This parses all `SKILL.md` files in the `skills/` directory and generates `src/data/skills.json`.

### Run Development Server

```bash
nx run marketplace:dev
```

Open http://localhost:3000 in your browser.

**Note**: The site runs with the actual production configuration in development for consistency.

### Build for Production

```bash
nx run marketplace:build
```

This generates static files in `out/.next/` ready for deployment.

## Deployment

The site automatically deploys to the custom domain `agent-skills.techleads.club` when changes are pushed to the `main` branch via the `.github/workflows/deploy-marketplace.yml` workflow.

### Manual Deployment

To deploy manually:

1. Ensure the build succeeds: `nx run marketplace:build`
2. The static files are in `packages/marketplace/.next/`
3. Deploy these files to any static hosting service

## Project Structure

```
marketplace/
├── scripts/
│   └── generate-data.ts        # Parses skills and generates JSON
├── src/
│   ├── app/
│   │   ├── page.tsx            # Homepage
│   │   ├── layout.tsx          # Root layout with navigation
│   │   ├── about/
│   │   │   └── page.tsx        # About page (displays README)
│   │   └── skills/
│   │       ├── page.tsx        # Skills listing page (wrapper)
│   │       ├── SkillsClient.tsx # Skills listing (client component)
│   │       └── [id]/
│   │           └── page.tsx    # Individual skill detail page
│   ├── components/
│   │   ├── CategoryFilter.tsx  # Category filter buttons
│   │   ├── CopyButton.tsx      # Copy to clipboard button
│   │   ├── JsonLd.tsx          # Structured data (SEO)
│   │   ├── NpmDownloadsCard.tsx # NPM download stats
│   │   ├── Pagination.tsx      # Pagination component
│   │   ├── SearchBar.tsx       # Search input with debounce
│   │   ├── SkillCard.tsx       # Skill preview card
│   │   ├── StatsCard.tsx       # Stats display card
│   │   ├── ThemeProvider.tsx   # Dark mode context provider
│   │   └── ThemeToggle.tsx     # Dark/light mode toggle
│   ├── data/
│   │   └── skills.json         # Generated skills data
│   └── types/
│       └── index.ts            # TypeScript types
├── next.config.mjs             # Next.js configuration
├── postcss.config.cjs          # PostCSS configuration
└── project.json                # Nx project configuration
```

## Technologies

- **Next.js 16**: React framework with App Router
- **Tailwind CSS 4**: Utility-first CSS framework
- **TypeScript**: Type safety
- **React Markdown**: Markdown rendering for skill content
- **Gray Matter**: YAML frontmatter parsing
- **Rehype/Remark**: Markdown plugins (syntax highlighting, GFM support)
- **Nx**: Build system and monorepo tooling

## Features

### Dark Mode

The site includes a fully functional dark mode with:

- System preference detection
- Manual toggle control
- Theme persistence in localStorage
- Smooth transitions between themes

### SEO Optimization

- JSON-LD structured data for all pages
- OpenGraph and Twitter Card metadata
- Canonical URLs and proper meta tags
- Sitemap generation support

### Performance

- Static site generation (SSG)
- Optimized build output
- Responsive images
- Code splitting

## Configuration

The site is configured for deployment to a custom domain:

- Domain: `agent-skills.techleads.club`
- Static export: `output: 'export'`
- Unoptimized images: Required for static export
- Trailing slashes: Enabled for better compatibility

To deploy to a different domain, update the `metadataBase` URL in `src/app/layout.tsx`.

## Adding New Skills

Skills are automatically discovered when:

1. A new directory is added to `skills/`
2. The directory contains a `SKILL.md` file
3. The skill is listed in `skills/categories.json`

The marketplace will automatically include the new skill on the next build.
