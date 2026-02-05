import { Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { SKILLS_CATALOG_DIR } from '@tech-leads-club/core'

import { SkillGeneratorSchema } from './schema'
import { skillGenerator } from './skill'

describe('skill generator', () => {
  let tree: Tree
  const options: SkillGeneratorSchema = { name: 'test' }

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
  })

  it('should create skill at root when no category specified', async () => {
    await skillGenerator(tree, options)
    expect(tree.exists(`${SKILLS_CATALOG_DIR}/test/SKILL.md`)).toBeTruthy()
  })

  it('should create skill inside category folder when category specified', async () => {
    await skillGenerator(tree, { name: 'my-skill', category: 'development' })
    expect(tree.exists(`${SKILLS_CATALOG_DIR}/(development)/my-skill/SKILL.md`)).toBeTruthy()
  })

  it('should create category folder if it does not exist', async () => {
    await skillGenerator(tree, { name: 'my-skill', category: 'new-category' })
    expect(tree.exists(`${SKILLS_CATALOG_DIR}/(new-category)/my-skill/SKILL.md`)).toBeTruthy()
  })

  it('should add skill to existing category folder', async () => {
    tree.write(`${SKILLS_CATALOG_DIR}/(existing-category)/.gitkeep`, '')
    await skillGenerator(tree, { name: 'skill-a', category: 'existing-category' })
    await skillGenerator(tree, { name: 'skill-b', category: 'existing-category' })
    expect(tree.exists(`${SKILLS_CATALOG_DIR}/(existing-category)/skill-a/SKILL.md`)).toBeTruthy()
    expect(tree.exists(`${SKILLS_CATALOG_DIR}/(existing-category)/skill-b/SKILL.md`)).toBeTruthy()
  })

  it('should handle kebab-case skill names', async () => {
    await skillGenerator(tree, { name: 'my-awesome-skill', category: 'tools' })
    expect(tree.exists(`${SKILLS_CATALOG_DIR}/(tools)/my-awesome-skill/SKILL.md`)).toBeTruthy()
  })

  it('should include description in SKILL.md frontmatter', async () => {
    await skillGenerator(tree, { name: 'documented-skill', description: 'A well documented skill' })
    const content = tree.read(`${SKILLS_CATALOG_DIR}/documented-skill/SKILL.md`, 'utf-8')
    expect(content).toContain('description: A well documented skill')
  })

  it('should use placeholder description when not provided', async () => {
    await skillGenerator(tree, { name: 'basic-skill' })
    const content = tree.read(`${SKILLS_CATALOG_DIR}/basic-skill/SKILL.md`, 'utf-8')
    expect(content).toContain('description: TODO: Add description')
  })

  it('should throw error if skill already exists', async () => {
    tree.write(`${SKILLS_CATALOG_DIR}/test/SKILL.md`, '')
    await expect(skillGenerator(tree, options)).rejects.toThrow(
      `A skill with the name "test" already exists in "${SKILLS_CATALOG_DIR}/test".`,
    )
  })

  it('should throw error if skill already exists in a category', async () => {
    tree.write(`${SKILLS_CATALOG_DIR}/(dev)/test/SKILL.md`, '')
    await expect(skillGenerator(tree, { name: 'test', category: 'dev' })).rejects.toThrow(
      `A skill with the name "test" already exists in "${SKILLS_CATALOG_DIR}/(dev)/test".`,
    )
  })
})
