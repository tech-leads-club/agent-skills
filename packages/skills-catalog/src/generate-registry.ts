#!/usr/bin/env tsx
/**
 * Generates skills-registry.json from the skills directory.
 * This file contains metadata about all available skills and is used
 * by the CLI to fetch skills on-demand without bundling them.
 *
 * Run: npx tsx packages/skills-catalog/src/generate-registry.ts
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SKILLS_DIR = join(__dirname, '..', 'skills')
const OUTPUT_FILE = join(__dirname, '..', '..', '..', 'skills-registry.json')
const CATEGORY_FOLDER_PATTERN = /^\(([a-z][a-z0-9-]*)\)$/
const CATEGORY_METADATA_FILE = '_category.json'

interface SkillMetadata {
  name: string
  description: string
  category: string
  path: string // relative path from skills root
  files: string[] // list of files in the skill
  author?: string
  version?: string
}

interface CategoryMetadata {
  name: string
  description?: string
  priority?: number
}

interface SkillsRegistry {
  version: string
  generatedAt: string
  baseUrl: string
  categories: Record<string, CategoryMetadata>
  skills: SkillMetadata[]
}

function parseSkillFrontmatter(content: string): {
  name?: string
  description?: string
  author?: string
  version?: string
} {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) return {}

  const frontmatter = frontmatterMatch[1]
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m)
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m)
  const authorMatch = frontmatter.match(/author:\s*(.+)$/m)
  const versionMatch = frontmatter.match(/version:\s*['"]?([^'"]+)['"]?$/m)

  return {
    name: nameMatch?.[1]?.trim(),
    description: descMatch?.[1]?.trim(),
    author: authorMatch?.[1]?.trim(),
    version: versionMatch?.[1]?.trim(),
  }
}

function getFilesInDirectory(dir: string): string[] {
  const files: string[] = []

  function walk(currentDir: string, prefix = '') {
    const entries = readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        walk(join(currentDir, entry.name), relativePath)
      } else {
        files.push(relativePath)
      }
    }
  }

  walk(dir)
  return files
}

function isCategoryFolder(name: string): boolean {
  return CATEGORY_FOLDER_PATTERN.test(name)
}

function extractCategoryId(name: string): string | null {
  const match = name.match(CATEGORY_FOLDER_PATTERN)
  return match ? match[1] : null
}

function loadCategoryMetadata(): Record<string, CategoryMetadata> {
  const metadataPath = join(SKILLS_DIR, CATEGORY_METADATA_FILE)
  if (!existsSync(metadataPath)) return {}

  try {
    const content = readFileSync(metadataPath, 'utf-8')
    const raw = JSON.parse(content)
    const result: Record<string, CategoryMetadata> = {}

    for (const [folder, meta] of Object.entries(raw)) {
      const categoryId = extractCategoryId(folder)
      if (categoryId && meta && typeof meta === 'object') {
        result[categoryId] = meta as CategoryMetadata
      }
    }

    return result
  } catch {
    return {}
  }
}

function scanSkillsInCategory(categoryPath: string, categoryId: string): SkillMetadata[] {
  const skills: SkillMetadata[] = []
  if (!existsSync(categoryPath)) return skills

  const entries = readdirSync(categoryPath, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const skillPath = join(categoryPath, entry.name)
    const skillMdPath = join(skillPath, 'SKILL.md')

    if (!existsSync(skillMdPath)) continue

    const content = readFileSync(skillMdPath, 'utf-8')
    const { name, description, author, version } = parseSkillFrontmatter(content)
    const files = getFilesInDirectory(skillPath)
    const relativePath = categoryId === 'uncategorized' ? entry.name : `(${categoryId})/${entry.name}`

    skills.push({
      name: name || entry.name,
      description: description || 'No description',
      category: categoryId,
      path: relativePath,
      files,
      author,
      version,
    })
  }

  return skills
}

function generateRegistry(): SkillsRegistry {
  const skills: SkillMetadata[] = []
  const categories = loadCategoryMetadata()

  const entries = readdirSync(SKILLS_DIR, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    if (isCategoryFolder(entry.name)) {
      const categoryId = extractCategoryId(entry.name)
      if (categoryId) {
        const categoryPath = join(SKILLS_DIR, entry.name)
        const categorySkills = scanSkillsInCategory(categoryPath, categoryId)
        skills.push(...categorySkills)

        // Ensure category exists in metadata
        if (!categories[categoryId]) {
          categories[categoryId] = {
            name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
          }
        }
      }
    } else {
      // Uncategorized skill at root
      const skillMdPath = join(SKILLS_DIR, entry.name, 'SKILL.md')
      if (existsSync(skillMdPath)) {
        const content = readFileSync(skillMdPath, 'utf-8')
        const { name, description, author, version } = parseSkillFrontmatter(content)
        const files = getFilesInDirectory(join(SKILLS_DIR, entry.name))

        skills.push({
          name: name || entry.name,
          description: description || 'No description',
          category: 'uncategorized',
          path: entry.name,
          files,
          author,
          version,
        })
      }
    }
  }

  // Ensure uncategorized exists
  if (!categories['uncategorized']) {
    categories['uncategorized'] = {
      name: 'Uncategorized',
      description: 'Skills without a specific category',
      priority: 999,
    }
  }

  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    baseUrl: 'https://cdn.jsdelivr.net/gh/tech-leads-club/agent-skills@main/packages/skills-catalog/skills',
    categories,
    skills: skills.sort((a, b) => a.name.localeCompare(b.name)),
  }
}

// Main execution
const registry = generateRegistry()
writeFileSync(OUTPUT_FILE, JSON.stringify(registry, null, 2))

console.log(`✅ Generated skills-registry.json`)
console.log(`   📦 ${registry.skills.length} skills`)
console.log(`   📁 ${Object.keys(registry.categories).length} categories`)
console.log(`   📍 ${OUTPUT_FILE}`)
