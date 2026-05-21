#!/usr/bin/env tsx

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { format, resolveConfig } from 'prettier'
import YAML from 'yaml'

import {
  CATEGORY_FOLDER_PATTERN,
  CATEGORY_METADATA_FILE,
  computeSkillHash,
  getFilesInDirectory,
  parseSkillFrontmatter,
  SKILL_NAME_SLUG_PATTERN,
  toSlug,
  type CategoryMetadata,
  type DeprecatedEntry,
  type SkillMetadata,
  type SkillsRegistry,
} from './utils'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SKILLS_DIR = join(__dirname, '..', 'skills')
const OUTPUT_FILE = join(__dirname, '..', 'skills-registry.json')
const DEPRECATED_FILE = join(SKILLS_DIR, 'deprecated.yaml')

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
    const contentHash = computeSkillHash(skillPath, files)
    const relativePath = categoryId === 'uncategorized' ? entry.name : `(${categoryId})/${entry.name}`
    const rawName = name || entry.name
    const skillName = SKILL_NAME_SLUG_PATTERN.test(rawName) ? rawName : toSlug(rawName)

    if (skillName !== rawName) fixSkillNameInFile(skillMdPath, rawName, skillName)

    skills.push({
      name: skillName,
      description: description || 'No description',
      category: categoryId,
      path: relativePath,
      files,
      author,
      version,
      contentHash,
    })
  }

  return skills
}

function loadDeprecatedSkills(): DeprecatedEntry[] {
  if (!existsSync(DEPRECATED_FILE)) return []

  try {
    const content = readFileSync(DEPRECATED_FILE, 'utf-8')
    const parsed = YAML.parse(content)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((entry: unknown) => entry && typeof entry === 'object' && 'name' in entry && 'message' in entry)
      .map((entry: { name: string; message: string; alternatives?: string[] }) => ({
        name: entry.name,
        message: entry.message,
        ...(entry.alternatives?.length ? { alternatives: entry.alternatives } : {}),
      }))
  } catch {
    console.warn(`⚠️  Failed to parse ${DEPRECATED_FILE}, skipping deprecated entries`)
    return []
  }
}

function generateRegistry(): SkillsRegistry {
  const skills: SkillMetadata[] = []
  const categories = loadCategoryMetadata()
  const deprecated = loadDeprecatedSkills()

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
      // Uncategorized skill at root — reuse scanSkillsInCategory with 'uncategorized'
      const skillDir = join(SKILLS_DIR, entry.name)
      if (existsSync(join(skillDir, 'SKILL.md'))) {
        skills.push(...scanSkillsInCategory(skillDir, 'uncategorized'))
      }
    }
  }

  // Ensure uncategorized exists
  if (!categories['uncategorized']) {
    categories['uncategorized'] = {
      name: 'Uncategorized',
      description: 'Skills without a specific category',
    }
  }

  return {
    version: '1.0.0',
    categories,
    skills: skills.sort((a, b) => a.name.localeCompare(b.name)),
    ...(deprecated.length > 0 ? { deprecated } : {}),
  }
}

function fixSkillNameInFile(skillMdPath: string, rawName: string, slugName: string): void {
  const content = readFileSync(skillMdPath, 'utf-8')
  const updated = content.replace(/^(name:\s*)(.+)$/m, `$1${slugName}`)
  writeFileSync(skillMdPath, updated, 'utf-8')
  console.log(`✏️  Auto-fixed skill name in ${skillMdPath}`)
  console.log(`   "${rawName}" → "${slugName}"`)
}

async function formatRegistry(registry: SkillsRegistry): Promise<string> {
  return format(JSON.stringify(registry), {
    ...((await resolveConfig(OUTPUT_FILE)) ?? {}),
    filepath: OUTPUT_FILE,
  })
}

async function main(): Promise<void> {
  const registry = generateRegistry()
  writeFileSync(OUTPUT_FILE, await formatRegistry(registry))

  console.log(`✅ Generated skills-registry.json`)
  console.log(`   📦 ${registry.skills.length} skills`)
  console.log(`   📁 ${Object.keys(registry.categories).length} categories`)
  if (registry.deprecated?.length) console.log(`   ⚠️  ${registry.deprecated.length} deprecated`)
  console.log(`   📍 ${OUTPUT_FILE}`)
}

await main()
