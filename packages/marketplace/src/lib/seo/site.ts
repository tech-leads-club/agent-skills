/**
 * why: every canonical URL, JSON-LD node and social tag must agree on one origin and one
 * brand identity; duplicating these literals per page is how canonical drift starts.
 */
export const SITE_URL = 'https://agent-skills.techleads.club'
export const SITE_NAME = 'Agent Skills'
export const SITE_TAGLINE = 'Skills for AI coding agents'
export const SITE_DESCRIPTION =
  'A curated, security-scanned registry of skills for AI coding agents. Extend Cursor, Claude Code, GitHub Copilot, Windsurf, Cline and more with reusable, packaged instructions.'

export const ORGANIZATION_NAME = 'Tech Leads Club'
export const ORGANIZATION_URL = 'https://github.com/tech-leads-club'
export const REPOSITORY_URL = 'https://github.com/tech-leads-club/agent-skills'
export const NPM_PACKAGE_URL = 'https://www.npmjs.com/package/@tech-leads-club/agent-skills'
export const NPM_PACKAGE_NAME = '@tech-leads-club/agent-skills'

export const DEFAULT_OG_IMAGE = '/og-image.png'
export const DEFAULT_OG_IMAGE_WIDTH = 1024
export const DEFAULT_OG_IMAGE_HEIGHT = 537

/** Longest description Google reliably renders before truncating a SERP snippet. */
export const MAX_META_DESCRIPTION_LENGTH = 160
