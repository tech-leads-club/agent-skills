import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('skills-provider', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = join(tmpdir(), `skills-provider-test-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await rm(tempDir, { recursive: true, force: true })
    } catch {
      // Ignore
    }
  })

  describe('isCategoryFolder', () => {
    const isCategoryFolderRegex = (name: string): boolean => /^\([a-z][a-z0-9-]*\)$/.test(name)

    it('should return true for valid category folders', () => {
      expect(isCategoryFolderRegex('(development)')).toBe(true)
      expect(isCategoryFolderRegex('(web-automation)')).toBe(true)
      expect(isCategoryFolderRegex('(my-category123)')).toBe(true)
      expect(isCategoryFolderRegex('(a)')).toBe(true)
      expect(isCategoryFolderRegex('(tools1)')).toBe(true)
    })

    it('should return false for invalid category folders', () => {
      expect(isCategoryFolderRegex('development')).toBe(false)
      expect(isCategoryFolderRegex('(Development)')).toBe(false)
      expect(isCategoryFolderRegex('(123-category)')).toBe(false)
      expect(isCategoryFolderRegex('skill-name')).toBe(false)
      expect(isCategoryFolderRegex('()')).toBe(false)
      expect(isCategoryFolderRegex('(-invalid)')).toBe(false)
    })
  })

  describe('extractCategoryId', () => {
    const extractCategoryIdFn = (folderName: string): string | null => {
      const match = folderName.match(/^\(([a-z][a-z0-9-]*)\)$/)
      return match ? match[1] : null
    }

    it('should extract category ID from valid folder name', () => {
      expect(extractCategoryIdFn('(development)')).toBe('development')
      expect(extractCategoryIdFn('(web-automation)')).toBe('web-automation')
      expect(extractCategoryIdFn('(tools123)')).toBe('tools123')
    })

    it('should return null for invalid folder names', () => {
      expect(extractCategoryIdFn('development')).toBeNull()
      expect(extractCategoryIdFn('skill-name')).toBeNull()
      expect(extractCategoryIdFn('(Invalid)')).toBeNull()
      expect(extractCategoryIdFn('')).toBeNull()
    })
  })

  describe('SKILL.md parsing', () => {
    const parseSkillFrontmatter = (content: string, folderName: string): { name: string; description: string } => {
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
      if (!frontmatterMatch) {
        return { name: folderName, description: 'No description' }
      }

      const frontmatter = frontmatterMatch[1]
      const nameMatch = frontmatter.match(/^name:\s*(.+)$/m)
      const descMatch = frontmatter.match(/^description:\s*(.+)$/m)

      return {
        name: nameMatch ? nameMatch[1].trim() : folderName,
        description: descMatch ? descMatch[1].trim() : 'No description',
      }
    }

    it('should parse valid frontmatter', () => {
      const content = `---
name: my-skill
description: A great skill
---
# My Skill`
      const result = parseSkillFrontmatter(content, 'fallback-name')
      expect(result.name).toBe('my-skill')
      expect(result.description).toBe('A great skill')
    })

    it('should use folder name when frontmatter is missing', () => {
      const content = '# Just Markdown Content'
      const result = parseSkillFrontmatter(content, 'folder-name')
      expect(result.name).toBe('folder-name')
      expect(result.description).toBe('No description')
    })

    it('should use folder name when name is missing from frontmatter', () => {
      const content = `---
description: Only description
---`
      const result = parseSkillFrontmatter(content, 'folder-name')
      expect(result.name).toBe('folder-name')
      expect(result.description).toBe('Only description')
    })

    it('should handle frontmatter with only name', () => {
      const content = `---
name: only-name
---`
      const result = parseSkillFrontmatter(content, 'folder-name')
      expect(result.name).toBe('only-name')
      expect(result.description).toBe('No description')
    })
  })

  describe('category name formatting', () => {
    const formatCategoryName = (id: string): string => {
      return id
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }

    it('should format single word category', () => {
      expect(formatCategoryName('development')).toBe('Development')
    })

    it('should format multi-word category', () => {
      expect(formatCategoryName('web-automation')).toBe('Web Automation')
      expect(formatCategoryName('skill-creation')).toBe('Skill Creation')
    })

    it('should handle numbers in category name', () => {
      expect(formatCategoryName('tools123')).toBe('Tools123')
      expect(formatCategoryName('v2-features')).toBe('V2 Features')
    })
  })

  describe('skills discovery (filesystem)', () => {
    it('should create valid skill directory structure', async () => {
      const skillsDir = join(tempDir, 'skills')
      const categoryDir = join(skillsDir, '(development)')
      const skillDir = join(categoryDir, 'my-skill')

      await mkdir(skillDir, { recursive: true })
      await writeFile(
        join(skillDir, 'SKILL.md'),
        `---
name: my-skill
description: Test skill
---
# My Skill`,
      )

      const { existsSync, readFileSync } = await import('node:fs')
      expect(existsSync(join(skillDir, 'SKILL.md'))).toBe(true)

      const content = readFileSync(join(skillDir, 'SKILL.md'), 'utf-8')
      expect(content).toContain('name: my-skill')
    })

    it('should support uncategorized skills at root level', async () => {
      const skillsDir = join(tempDir, 'skills')
      const skillDir = join(skillsDir, 'root-skill')

      await mkdir(skillDir, { recursive: true })
      await writeFile(
        join(skillDir, 'SKILL.md'),
        `---
name: root-skill
description: An uncategorized skill
---`,
      )

      const { existsSync } = await import('node:fs')
      expect(existsSync(join(skillDir, 'SKILL.md'))).toBe(true)
    })

    it('should support _category.json metadata', async () => {
      const skillsDir = join(tempDir, 'skills')
      await mkdir(skillsDir, { recursive: true })

      const metadata = {
        '(cloud)': {
          name: 'Cloud & Infrastructure',
          description: 'Cloud-related skills',
        },
        '(development)': {
          name: 'Development Tools',
        },
      }

      await writeFile(join(skillsDir, '_category.json'), JSON.stringify(metadata, null, 2))

      const { readFileSync } = await import('node:fs')
      const content = readFileSync(join(skillsDir, '_category.json'), 'utf-8')
      const parsed = JSON.parse(content) as typeof metadata
      expect(parsed['(cloud)'].name).toBe('Cloud & Infrastructure')
    })

    it('should discover category folders correctly', async () => {
      const skillsDir = join(tempDir, 'skills')
      await mkdir(join(skillsDir, '(development)'), { recursive: true })
      await mkdir(join(skillsDir, '(creation)'), { recursive: true })
      await mkdir(join(skillsDir, 'regular-folder'), { recursive: true })

      const { readdirSync, statSync } = await import('node:fs')
      const entries = readdirSync(skillsDir)

      const isCategoryFolder = (name: string) => /^\([a-z][a-z0-9-]*\)$/.test(name)
      const categories = entries.filter(
        (entry) => isCategoryFolder(entry) && statSync(join(skillsDir, entry)).isDirectory(),
      )

      expect(categories).toContain('(development)')
      expect(categories).toContain('(creation)')
      expect(categories).not.toContain('regular-folder')
    })
  })

  describe('SkillInfo structure', () => {
    interface SkillInfo {
      name: string
      description: string
      path: string
      category?: string
      author?: string
      version?: string
    }

    it('should have correct required fields', () => {
      const skill: SkillInfo = {
        name: 'test-skill',
        description: 'A test skill',
        path: '/path/to/skill',
      }
      expect(skill.name).toBe('test-skill')
      expect(skill.description).toBe('A test skill')
      expect(skill.path).toBe('/path/to/skill')
    })

    it('should allow optional category field', () => {
      const skill: SkillInfo = {
        name: 'categorized-skill',
        description: 'A skill with category',
        path: '/path/to/skill',
        category: 'development',
      }
      expect(skill.category).toBe('development')
    })

    it('should allow optional metadata fields', () => {
      const skill: SkillInfo = {
        name: 'full-skill',
        description: 'A complete skill',
        path: '/path/to/skill',
        category: 'creation',
        author: 'test-author',
        version: '1.0.0',
      }
      expect(skill.author).toBe('test-author')
      expect(skill.version).toBe('1.0.0')
    })
  })

  describe('mode detection logic', () => {
    it('should determine local mode when directory exists', async () => {
      const skillsDir = join(tempDir, 'packages', 'skills-catalog', 'skills')
      await mkdir(skillsDir, { recursive: true })

      const { existsSync } = await import('node:fs')
      const isLocal = existsSync(skillsDir)
      expect(isLocal).toBe(true)
    })

    it('should determine remote mode when directory does not exist', async () => {
      const skillsDir = join(tempDir, 'non-existent', 'skills')
      const { existsSync } = await import('node:fs')
      const isLocal = existsSync(skillsDir)
      expect(isLocal).toBe(false)
    })
  })

  describe('skills filtering', () => {
    interface SkillInfo {
      name: string
      description: string
      category?: string
    }

    const skills: SkillInfo[] = [
      { name: 'aws-skill', description: 'AWS utilities', category: 'cloud' },
      { name: 'playwright-skill', description: 'Browser automation', category: 'web-automation' },
      { name: 'dev-workflow', description: 'Development workflow', category: 'development' },
      { name: 'uncategorized', description: 'No category' },
    ]

    it('should find skill by name', () => {
      const findSkillByName = (name: string) => skills.find((s) => s.name === name)
      expect(findSkillByName('aws-skill')?.name).toBe('aws-skill')
      expect(findSkillByName('non-existent')).toBeUndefined()
    })

    it('should filter skills by category', () => {
      const filterByCategory = (category: string) => skills.filter((s) => s.category === category)
      expect(filterByCategory('cloud')).toHaveLength(1)
      expect(filterByCategory('web-automation')[0].name).toBe('playwright-skill')
    })

    it('should find uncategorized skills', () => {
      const uncategorized = skills.filter((s) => !s.category)
      expect(uncategorized).toHaveLength(1)
      expect(uncategorized[0].name).toBe('uncategorized')
    })

    it('should search skills by description', () => {
      const searchByDescription = (query: string) =>
        skills.filter((s) => s.description.toLowerCase().includes(query.toLowerCase()))
      expect(searchByDescription('aws')).toHaveLength(1)
      expect(searchByDescription('automation')).toHaveLength(1)
    })
  })

  describe('groupSkillsByCategory', () => {
    interface SkillInfo {
      name: string
      category?: string
    }

    interface CategoryInfo {
      id: string
      name: string
    }

    const groupSkillsByCategory = (skills: SkillInfo[], categories: CategoryInfo[]): Map<CategoryInfo, SkillInfo[]> => {
      const grouped = new Map<CategoryInfo, SkillInfo[]>()

      for (const skill of skills) {
        const categoryId = skill.category ?? 'uncategorized'
        const category = categories.find((c) => c.id === categoryId) ?? {
          id: 'uncategorized',
          name: 'Uncategorized',
        }

        const group = grouped.get(category) ?? []
        group.push(skill)
        grouped.set(category, group)
      }

      return grouped
    }

    it('should group skills by category', () => {
      const skills: SkillInfo[] = [
        { name: 'skill-a', category: 'development' },
        { name: 'skill-b', category: 'development' },
        { name: 'skill-c', category: 'creation' },
      ]
      const categories: CategoryInfo[] = [
        { id: 'development', name: 'Development' },
        { id: 'creation', name: 'Creation' },
      ]

      const grouped = groupSkillsByCategory(skills, categories)
      expect(grouped.size).toBe(2)

      const devCategory = categories.find((c) => c.id === 'development')!
      expect(grouped.get(devCategory)).toHaveLength(2)
    })

    it('should handle uncategorized skills', () => {
      const skills: SkillInfo[] = [{ name: 'orphan-skill' }]
      const categories: CategoryInfo[] = []

      const grouped = groupSkillsByCategory(skills, categories)
      const uncategorized = Array.from(grouped.keys()).find((c) => c.id === 'uncategorized')
      expect(uncategorized).toBeDefined()
      expect(grouped.get(uncategorized!)).toHaveLength(1)
    })
  })

  describe('path normalization', () => {
    const normalizePath = (path: string): string => path.replace(/\\\\/g, '/')

    it('should normalize Windows paths', () => {
      expect(normalizePath('C:\\\\Users\\\\test\\\\skills')).toBe('C:/Users/test/skills')
    })

    it('should leave Unix paths unchanged', () => {
      expect(normalizePath('/home/user/skills')).toBe('/home/user/skills')
    })
  })
})
