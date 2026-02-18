import * as fs from 'fs'
import matter from 'gray-matter'
import * as path from 'path'
import { fileURLToPath } from 'url'

import type { Category, MarketplaceData, Skill } from '../src/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const WORKSPACE_ROOT = path.resolve(__dirname, '../../..')
const SKILLS_DIR = path.join(WORKSPACE_ROOT, 'packages/skills-catalog/skills')
const REGISTRY_FILE = path.join(WORKSPACE_ROOT, 'packages/skills-catalog/skills-registry.json')
const OUTPUT_FILE = path.join(__dirname, '../src/data/skills.json')

interface RegistrySkill {
  name: string
  description: string
  category: string
  path: string
  files: string[]
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
  categories: Record<string, CategoryMetadata>
  skills: RegistrySkill[]
}

function loadRegistry(): SkillsRegistry {
  if (!fs.existsSync(REGISTRY_FILE)) {
    throw new Error(`Registry file not found: ${REGISTRY_FILE}`)
  }
  return JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'))
}

function readSkillContent(registrySkill: RegistrySkill): { content: string; lastModified: string } {
  const skillFile = path.join(SKILLS_DIR, registrySkill.path, 'SKILL.md')

  if (!fs.existsSync(skillFile)) {
    console.warn(`SKILL.md not found at ${skillFile}`)
    return { content: '', lastModified: new Date().toISOString().split('T')[0] }
  }

  const fileContent = fs.readFileSync(skillFile, 'utf-8')
  const stats = fs.statSync(skillFile)
  const lastModified = stats.mtime.toISOString().split('T')[0]

  try {
    const { content } = matter(fileContent)
    return { content: content.trim(), lastModified }
  } catch {
    // If YAML frontmatter parsing fails, extract content manually
    console.warn(`Failed to parse frontmatter for ${registrySkill.name}, using fallback`)
    const lines = fileContent.split('\n')
    let contentStart = 0

    // Skip frontmatter if it exists (between --- markers)
    if (lines[0] === '---') {
      const endIndex = lines.findIndex((line, idx) => idx > 0 && line === '---')
      contentStart = endIndex > 0 ? endIndex + 1 : 1
    }

    const content = lines.slice(contentStart).join('\n').trim()
    return { content, lastModified }
  }
}

function generateMarketplaceData(): MarketplaceData {
  console.log('Loading skills registry...')
  const registry = loadRegistry()

  console.log(`Found ${registry.skills.length} skills in registry`)

  // Transform categories from Record to Array
  const categories: Category[] = Object.entries(registry.categories).map(([id, meta]) => ({
    id,
    name: meta.name,
    description: meta.description,
    priority: meta.priority,
  }))

  // Map registry skills to marketplace skills
  const skills: Skill[] = registry.skills.map((registrySkill) => {
    // Derive metadata from files array
    const hasScripts = registrySkill.files.some((f) => f.startsWith('scripts/'))
    const hasReferences = registrySkill.files.some((f) => f.startsWith('references/'))
    const referenceFiles = registrySkill.files
      .filter((f) => f.startsWith('references/') && f.endsWith('.md'))
      .map((f) => path.basename(f))

    // Read content and lastModified from filesystem
    const { content, lastModified } = readSkillContent(registrySkill)

    return {
      id: registrySkill.name,
      name: registrySkill.name,
      description: registrySkill.description,
      category: registrySkill.category,
      path: `skills/${registrySkill.path}/SKILL.md`,
      content,
      metadata: {
        hasScripts,
        hasReferences,
        referenceFiles,
        lastModified,
      },
    }
  })

  // Sort skills by name
  skills.sort((a, b) => a.name.localeCompare(b.name))

  // Sort categories by priority
  categories.sort((a, b) => (a.priority || 999) - (b.priority || 999))

  return {
    skills,
    categories,
    stats: {
      totalSkills: skills.length,
      totalCategories: categories.length,
    },
  }
}

function main() {
  console.log('Generating marketplace data...')

  const data = generateMarketplaceData()

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Write JSON file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2))

  console.log(`✓ Generated data for ${data.stats.totalSkills} skills`)
  console.log(`✓ Output: ${OUTPUT_FILE}`)
}

main()
