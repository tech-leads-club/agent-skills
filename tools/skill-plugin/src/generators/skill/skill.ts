import { formatFiles, generateFiles, names, Tree } from '@nx/devkit'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { assignSkillToCategory, categoryExists } from './category-utils'
import { SkillGeneratorSchema } from './schema'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function skillGenerator(tree: Tree, options: SkillGeneratorSchema) {
  const normalizedNames = names(options.name)
  const skillRoot = `skills/${normalizedNames.fileName}`

  generateFiles(tree, path.join(__dirname, 'files'), skillRoot, {
    ...normalizedNames,
    description: options.description || 'TODO: Add description',
    tmpl: '',
  })

  if (options.category) {
    const isExisting = categoryExists(tree, options.category)
    assignSkillToCategory(tree, normalizedNames.fileName, options.category)
    if (isExisting) console.log(`📁 Assigned to existing category: "${options.category}"`)
  } else {
    console.log(`ℹ️  No category specified. Skill will appear as "Uncategorized".`)
    console.log(`   To add a category, edit skills/categories.json`)
  }

  await formatFiles(tree)

  console.log(`
✅ Skill created!

📁 ${skillRoot}/SKILL.md
🔧 Test: npx @tech-leads-club/agent-skills --skill ${normalizedNames.fileName}
💡 Edit SKILL.md and customize the instructions
`)
}

export default skillGenerator
