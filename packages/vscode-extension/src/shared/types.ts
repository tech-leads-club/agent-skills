/**
 * Shared type definitions for the Agent Skills registry.
 * These interfaces match the structure of skills-registry.json from the CDN.
 * Imported by both Extension Host (esbuild) and Webview (Vite).
 */

/**
 * Category metadata for organizing skills.
 */
export interface Category {
  name: string
  description: string
}

/**
 * Individual skill entry in the registry.
 */
export interface Skill {
  name: string
  description: string
  category: string // Key into SkillRegistry.categories
  path: string
  files: string[]
  author?: string // Optional
  version?: string // Optional
  contentHash: string
}

/**
 * Complete skills registry structure from the CDN.
 */
export interface SkillRegistry {
  version: string
  categories: Record<string, Category>
  skills: Skill[]
}
