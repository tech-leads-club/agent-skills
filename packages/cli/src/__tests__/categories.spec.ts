import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { groupSkillsByCategory } from '../categories'
import type { CategoryInfo, CategoryMetadata } from '../types'

describe('categories', () => {
  let tempDir: string
  let skillsDir: string

  beforeEach(async () => {
    tempDir = join(tmpdir(), `categories-test-${Date.now()}`)
    skillsDir = join(tempDir, 'skills')
    await mkdir(skillsDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await rm(tempDir, { recursive: true, force: true })
    } catch {
      // Ignore
    }
  })

  describe('CategoryInfo type', () => {
    it('should have correct structure', () => {
      const category: CategoryInfo = {
        id: 'test-category',
        name: 'Test Category',
        description: 'A test category',
      }
      expect(category.id).toBe('test-category')
      expect(category.name).toBe('Test Category')
    })

    it('should allow optional fields', () => {
      const category: CategoryInfo = { id: 'minimal', name: 'Minimal Category' }
      expect(category.description).toBeUndefined()
    })
  })

  describe('CategoryMetadata type', () => {
    it('should map folder names to metadata', () => {
      const metadata: CategoryMetadata = {
        '(development)': { name: 'Development Tools', description: 'Skills for development' },
        '(creation)': { name: 'Skill Creation' },
      }
      expect(metadata['(development)'].name).toBe('Development Tools')
    })

    it('should allow partial metadata', () => {
      const metadata: CategoryMetadata = {
        '(tools)': { name: 'Tools' },
      }
      expect(metadata['(tools)'].description).toBeUndefined()
    })
  })

  describe('category folder naming convention', () => {
    it('should use parentheses for category folders', () => {
      const categoryIdToFolderName = (id: string) => `(${id})`
      expect(categoryIdToFolderName('development')).toBe('(development)')
      expect(categoryIdToFolderName('web-automation')).toBe('(web-automation)')
    })

    it('should extract category ID from folder name', () => {
      const folderNameToCategoryId = (folder: string) => {
        const match = folder.match(/^\(([a-z][a-z0-9-]*)\)$/)
        return match ? match[1] : null
      }
      expect(folderNameToCategoryId('(development)')).toBe('development')
      expect(folderNameToCategoryId('(web-automation)')).toBe('web-automation')
      expect(folderNameToCategoryId('regular-folder')).toBeNull()
    })
  })

  describe('category alphabetical sorting', () => {
    it('should sort categories by name', () => {
      const categories: CategoryInfo[] = [
        { id: 'z', name: 'Zebra' },
        { id: 'a', name: 'Alpha' },
        { id: 'b', name: 'Beta' },
      ]
      const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name))
      expect(sorted[0].name).toBe('Alpha')
      expect(sorted[1].name).toBe('Beta')
      expect(sorted[2].name).toBe('Zebra')
    })
  })

  describe('file-system based category discovery', () => {
    it('should identify category folders by pattern', () => {
      const isCategoryFolder = (name: string) => /^\([a-z][a-z0-9-]*\)$/.test(name)
      expect(isCategoryFolder('(development)')).toBe(true)
      expect(isCategoryFolder('(web-automation)')).toBe(true)
      expect(isCategoryFolder('regular-folder')).toBe(false)
      expect(isCategoryFolder('(UPPERCASE)')).toBe(false)
    })

    it('should create category folders correctly', async () => {
      const categoryFolder = join(skillsDir, '(development)')
      await mkdir(categoryFolder, { recursive: true })
      const { readdirSync } = await import('node:fs')
      const entries = readdirSync(skillsDir)
      expect(entries).toContain('(development)')
    })

    it('should create skills inside category folders', async () => {
      const categoryFolder = join(skillsDir, '(development)')
      const skillFolder = join(categoryFolder, 'my-skill')
      await mkdir(skillFolder, { recursive: true })
      await writeFile(join(skillFolder, 'SKILL.md'), '---\nname: my-skill\n---\n# My Skill')
      const { existsSync } = await import('node:fs')
      expect(existsSync(join(skillFolder, 'SKILL.md'))).toBe(true)
    })
  })

  describe('groupSkillsByCategory logic', () => {
    it('should group and sort skills and categories alphabetically', () => {
      interface TestSkill {
        name: string
        category?: string
      }

      const skills: TestSkill[] = [
        { name: 'z-skill', category: 'b-cat' },
        { name: 'a-skill', category: 'b-cat' },
        { name: 'x-skill', category: 'a-cat' },
      ]

      const grouped = groupSkillsByCategory(skills)
      const categories = Array.from(grouped.keys())

      // Categories should be sorted (A Cat, B Cat)
      expect(categories[0].name).toBe('A Cat')
      expect(categories[1].name).toBe('B Cat')

      // Skills in B Cat should be sorted (a-skill, z-skill)
      const bCatSkills = grouped.get(categories[1])
      expect(bCatSkills?.map((s) => s.name)).toEqual(['a-skill', 'z-skill'])
    })

    it('should group skills correctly', () => {
      interface TestSkill {
        name: string
        category?: string
      }

      const skills: TestSkill[] = [
        { name: 'skill-a', category: 'development' },
        { name: 'skill-b', category: 'development' },
        { name: 'skill-c', category: 'creation' },
      ]

      const grouped = new Map<string, TestSkill[]>()

      for (const skill of skills) {
        const categoryId = skill.category ?? 'uncategorized'
        const group = grouped.get(categoryId) ?? []
        group.push(skill)
        grouped.set(categoryId, group)
      }

      expect(grouped.get('development')).toHaveLength(2)
      expect(grouped.get('creation')).toHaveLength(1)
      expect(grouped.get('uncategorized')).toBeUndefined()
    })

    it('should handle skills without category', () => {
      interface TestSkill {
        name: string
        category?: string
      }

      const skills: TestSkill[] = [{ name: 'skill-a', category: 'development' }, { name: 'skill-b' }]
      const grouped = new Map<string, TestSkill[]>()

      for (const skill of skills) {
        const categoryId = skill.category ?? 'uncategorized'
        const group = grouped.get(categoryId) ?? []
        group.push(skill)
        grouped.set(categoryId, group)
      }

      expect(grouped.get('development')).toHaveLength(1)
      expect(grouped.get('uncategorized')).toHaveLength(1)
    })
  })

  describe('category name formatting', () => {
    it('should format kebab-case to Title Case', () => {
      const formatCategoryName = (id: string): string => {
        return id
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      }

      expect(formatCategoryName('skill-creation')).toBe('Skill Creation')
      expect(formatCategoryName('development')).toBe('Development')
      expect(formatCategoryName('my-awesome-category')).toBe('My Awesome Category')
    })
  })

  describe('_category.json metadata', () => {
    it('should parse metadata file correctly', async () => {
      const metadataPath = join(skillsDir, '_category.json')
      const metadata: CategoryMetadata = {
        '(development)': {
          name: 'Development Tools',
          description: 'Skills for developers',
        },
      }
      await writeFile(metadataPath, JSON.stringify(metadata, null, 2))
      const { readFileSync } = await import('node:fs')
      const content = readFileSync(metadataPath, 'utf-8')
      const parsed = JSON.parse(content) as CategoryMetadata
      expect(parsed['(development)'].name).toBe('Development Tools')
    })

    it('should work without metadata file', () => {
      const formatCategoryName = (id: string) =>
        id
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      const categoryId = 'web-automation'
      const displayName = formatCategoryName(categoryId)
      expect(displayName).toBe('Web Automation')
    })
  })
})
