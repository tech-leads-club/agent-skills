import * as fs from 'fs'
import matter from 'gray-matter'
import * as path from 'path'
import { fileURLToPath } from 'url'
import type { Category, MarketplaceData, Skill } from '../src/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const WORKSPACE_ROOT = path.resolve(__dirname, '../../..')
const SKILLS_DIR = path.join(WORKSPACE_ROOT, 'skills')
const CATEGORIES_FILE = path.join(SKILLS_DIR, '_category.json')
const OUTPUT_FILE = path.join(__dirname, '../src/data/skills.json')

interface CategoryDefinition {
  name: string
  description: string
  priority: number
}

interface SkillWithCategory {
  skill: Skill
  categoryId: string
}

function loadCategories(): Record<string, CategoryDefinition> {
  if (!fs.existsSync(CATEGORIES_FILE)) {
    console.warn(`Categories file not found: ${CATEGORIES_FILE}`)
    return {}
  }
  return JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf-8'))
}

function getAllSkillsWithCategories(): SkillWithCategory[] {
  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
  const results: SkillWithCategory[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    // Check if this is a category folder (starts with parentheses)
    if (entry.name.startsWith('(') && entry.name.endsWith(')')) {
      const categoryId = entry.name
      const categoryPath = path.join(SKILLS_DIR, categoryId)

      // Scan for skill directories within the category
      const skillEntries = fs.readdirSync(categoryPath, { withFileTypes: true })

      for (const skillEntry of skillEntries) {
        if (skillEntry.isDirectory()) {
          const skill = parseSkill(categoryId, skillEntry.name)
          if (skill) {
            results.push({ skill, categoryId })
          }
        }
      }
    } else if (entry.name !== '_category.json') {
      // Legacy: skill at root level (uncategorized)
      const skill = parseSkill('', entry.name)
      if (skill) {
        results.push({ skill, categoryId: 'uncategorized' })
      }
    }
  }

  return results
}

function parseSkill(categoryFolder: string, skillName: string): Skill | null {
  const skillDir = categoryFolder 
    ? path.join(SKILLS_DIR, categoryFolder, skillName)
    : path.join(SKILLS_DIR, skillName)
  
  const skillFile = path.join(skillDir, 'SKILL.md')

  if (!fs.existsSync(skillFile)) {
    console.warn(`SKILL.md not found for ${skillName} in ${categoryFolder || 'root'}`)
    return null
  }

  const fileContent = fs.readFileSync(skillFile, 'utf-8')
  const { data, content } = matter(fileContent)

  // Check for scripts and references
  const scriptsDir = path.join(skillDir, 'scripts')
  const referencesDir = path.join(skillDir, 'references')

  const hasScripts = fs.existsSync(scriptsDir) && fs.readdirSync(scriptsDir).length > 0

  const hasReferences = fs.existsSync(referencesDir) && fs.readdirSync(referencesDir).length > 0

  const referenceFiles = hasReferences ? fs.readdirSync(referencesDir).filter((f) => f.endsWith('.md')) : []

  const stats = fs.statSync(skillFile)
  const lastModified = stats.mtime.toISOString().split('T')[0]

  const skillPath = categoryFolder 
    ? `skills/${categoryFolder}/${skillName}/SKILL.md`
    : `skills/${skillName}/SKILL.md`

  return {
    id: skillName,
    name: data.name || skillName,
    description: data.description || '',
    category: '', // Will be set later
    path: skillPath,
    content: content.trim(),
    metadata: {
      hasScripts,
      hasReferences,
      referenceFiles,
      lastModified,
    },
  }
}

function generateMarketplaceData(): MarketplaceData {
  const categoriesData = loadCategories()
  const skillsWithCategories = getAllSkillsWithCategories()
  
  const skills: Skill[] = []
  const categories: Category[] = []

  // Build categories array
  for (const [categoryId, categoryDef] of Object.entries(categoriesData)) {
    const id = categoryId.replace(/[()]/g, '') // Remove parentheses for ID
    categories.push({
      id,
      name: categoryDef.name,
      description: categoryDef.description,
      priority: categoryDef.priority,
    })
  }

  // Build skills array with category mappings
  for (const { skill, categoryId } of skillsWithCategories) {
    // Map category folder name to category ID
    const mappedCategoryId = categoryId === 'uncategorized' 
      ? 'uncategorized'
      : categoryId.replace(/[()]/g, '')
    
    skills.push({
      ...skill,
      category: mappedCategoryId,
    })
  }

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
