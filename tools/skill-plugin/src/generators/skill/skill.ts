import { formatFiles, generateFiles, names, Tree } from '@nx/devkit'
import * as path from 'path'

import { formatCategoryName, SKILLS_CATALOG_DIR } from '@tech-leads-club/core'

import { SkillGeneratorSchema } from './schema'

function categoryIdToFolderName(categoryId: string): string {
  return `(${categoryId})`
}

function categoryFolderExists(tree: Tree, categoryId: string): boolean {
  const folderPath = `${SKILLS_CATALOG_DIR}/${categoryIdToFolderName(categoryId)}`
  return tree.exists(folderPath)
}

export async function skillGenerator(tree: Tree, options: SkillGeneratorSchema) {
  const normalizedNames = names(options.name)

  let skillRoot: string
  let isNewCategory = false

  if (options.category) {
    const categoryFolder = categoryIdToFolderName(options.category)
    skillRoot = `${SKILLS_CATALOG_DIR}/${categoryFolder}/${normalizedNames.fileName}`
    isNewCategory = !categoryFolderExists(tree, options.category)
  } else {
    skillRoot = `${SKILLS_CATALOG_DIR}/${normalizedNames.fileName}`
  }

  if (tree.exists(`${skillRoot}/SKILL.md`)) {
    throw new Error(`A skill with the name "${normalizedNames.fileName}" already exists in "${skillRoot}".`)
  }

  generateFiles(tree, path.join(__dirname, 'files'), skillRoot, {
    ...normalizedNames,
    description: options.description || 'TODO: Add description',
    tmpl: '',
  })

  await formatFiles(tree)

  if (options.category) {
    if (isNewCategory) {
      console.log(`📁 Created new category folder: "(${options.category})"`)
      console.log(`   Display name: "${formatCategoryName(options.category)}"`)
    } else {
      console.log(`📁 Added to existing category: "${options.category}"`)
    }
  } else {
    console.log(`ℹ️  No category specified. Skill will appear as "Uncategorized".`)
    console.log(
      `   To add a category: move to packages/skills-catalog/skills/(category-name)/${normalizedNames.fileName}`,
    )
  }

  console.log(`
✅ Skill created!

📁 ${skillRoot}/SKILL.md
🔧 Test: npx @tech-leads-club/agent-skills --skill ${normalizedNames.fileName}
💡 Edit SKILL.md and customize the instructions
📦 Registry will auto-update on build, or run: npm run generate:registry
`)
}

export default skillGenerator
