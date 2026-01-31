# Agent Skills Marketplace

A Next.js static site that serves as a marketplace for browsing and discovering agent skills.

## Overview

The marketplace automatically generates a static website from the skills in the `skills/` directory. It includes:

- Homepage with featured skills and stats
- Skills listing page with search and category filtering
- Individual skill detail pages with full content
- Responsive design with Tailwind CSS
- Static site generation for GitHub Pages

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

**Note**: The site runs without the `/agent-skills` prefix in development. The prefix is automatically added in production builds for GitHub Pages.

### Build for Production

```bash
nx run marketplace:build
```

This generates static files in `out/.next/` ready for deployment.

## Deployment

The site automatically deploys to GitHub Pages when changes are pushed to the `main` branch via the `.github/workflows/deploy-marketplace.yml` workflow.

### Manual Deployment

To deploy manually:

1. Ensure the build succeeds: `nx run marketplace:build`
2. The static files are in `packages/marketplace/out/.next/`
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
│   │   └── skills/
│   │       ├── page.tsx        # Skills listing page (wrapper)
│   │       ├── SkillsClient.tsx # Skills listing (client component)
│   │       └── [id]/
│   │           └── page.tsx    # Individual skill detail page
│   ├── components/
│   │   ├── CategoryFilter.tsx  # Category filter buttons
│   │   ├── CopyButton.tsx      # Copy to clipboard button
│   │   ├── SearchBar.tsx       # Search input with debounce
│   │   ├── SkillCard.tsx       # Skill preview card
│   │   └── StatsCard.tsx       # Stats display card
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
- **Nx**: Build system and monorepo tooling

## Configuration

The site is configured for GitHub Pages deployment:

- Base path: `/agent-skills` (configured in `next.config.mjs`)
- Static export: `output: 'export'`
- Unoptimized images: Required for static export

To deploy to a different domain or path, update the `basePath` in `next.config.mjs`.

## Adding New Skills

Skills are automatically discovered when:

1. A new directory is added to `skills/`
2. The directory contains a `SKILL.md` file
3. The skill is listed in `skills/categories.json`

The marketplace will automatically include the new skill on the next build.
