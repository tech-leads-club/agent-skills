import { jest } from '@jest/globals'

jest.unstable_mockModule('node:fs', () => ({
  ...(jest.requireActual('node:fs') as object),
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
}))

const { discoverSkills, discoverCategories, getSkillByName, getSkillsDirectory, isCategoryFolder, extractCategoryId } =
  await import('../skills')
const {
  existsSync: mockExistsSync,
  readdirSync: mockReaddirSync,
  readFileSync: mockReadFileSync,
} = await import('node:fs')

const normalizePath = (path: unknown): string => {
  return String(path).replace(/\\/g, '/')
}

describe('skills', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getSkillsDirectory', () => {
    it('should find skills directory in development mode', () => {
      ;(mockExistsSync as jest.Mock).mockImplementation((path) => {
        return String(path).includes('skills') && !String(path).includes('dist')
      })
      const result = getSkillsDirectory()
      expect(result).toContain('skills')
    })

    it('should throw error when skills directory not found', () => {
      ;(mockExistsSync as jest.Mock).mockReturnValue(false)
      expect(() => getSkillsDirectory()).toThrow('Skills directory not found')
    })
  })

  describe('isCategoryFolder', () => {
    it('should return true for valid category folders', () => {
      expect(isCategoryFolder('(development)')).toBe(true)
      expect(isCategoryFolder('(web-automation)')).toBe(true)
      expect(isCategoryFolder('(my-category123)')).toBe(true)
    })

    it('should return false for invalid category folders', () => {
      expect(isCategoryFolder('development')).toBe(false)
      expect(isCategoryFolder('(Development)')).toBe(false)
      expect(isCategoryFolder('(123-category)')).toBe(false)
      expect(isCategoryFolder('skill-name')).toBe(false)
    })
  })

  describe('extractCategoryId', () => {
    it('should extract category ID from folder name', () => {
      expect(extractCategoryId('(development)')).toBe('development')
      expect(extractCategoryId('(web-automation)')).toBe('web-automation')
    })

    it('should return null for non-category folders', () => {
      expect(extractCategoryId('development')).toBeNull()
      expect(extractCategoryId('skill-name')).toBeNull()
    })
  })

  describe('discoverSkills', () => {
    it('should return empty array when directory is empty', () => {
      ;(mockExistsSync as jest.Mock).mockImplementation((path) => {
        if (normalizePath(path).endsWith('skills')) return true
        return false
      })
      ;(mockReaddirSync as jest.Mock).mockReturnValue([])
      const skills = discoverSkills()
      expect(skills).toEqual([])
    })

    it('should discover skills in category folders', () => {
      ;(mockExistsSync as jest.Mock).mockImplementation((path) => {
        const p = normalizePath(path)
        if (p.endsWith('skills')) return true
        if (p.includes('(development)')) return true
        if (p.includes('my-skill/SKILL.md')) return true
        return false
      })
      ;(mockReaddirSync as jest.Mock).mockImplementation((path) => {
        const p = normalizePath(path)
        if (p.endsWith('skills')) {
          return [{ name: '(development)', isDirectory: () => true }]
        }
        if (p.includes('(development)')) {
          return [{ name: 'my-skill', isDirectory: () => true }]
        }
        return []
      })
      ;(mockReadFileSync as jest.Mock).mockReturnValue(`---
name: my-skill
description: A test skill
---
# My Skill`)

      const skills = discoverSkills()
      expect(skills).toHaveLength(1)
      expect(skills[0].name).toBe('my-skill')
      expect(skills[0].category).toBe('development')
    })

    it('should discover uncategorized skills at root', () => {
      ;(mockExistsSync as jest.Mock).mockImplementation((path) => {
        const p = normalizePath(path)
        if (p.endsWith('skills')) return true
        if (p.includes('root-skill/SKILL.md')) return true
        return false
      })
      ;(mockReaddirSync as jest.Mock).mockImplementation((path) => {
        if (normalizePath(path).endsWith('skills')) {
          return [{ name: 'root-skill', isDirectory: () => true }]
        }
        return []
      })
      ;(mockReadFileSync as jest.Mock).mockReturnValue(`---
name: root-skill
description: An uncategorized skill
---
# Root Skill`)

      const skills = discoverSkills()
      expect(skills).toHaveLength(1)
      expect(skills[0].name).toBe('root-skill')
      expect(skills[0].category).toBe('uncategorized')
    })

    it('should discover skills from multiple categories', () => {
      ;(mockExistsSync as jest.Mock).mockImplementation((path) => {
        const p = normalizePath(path)
        if (p.endsWith('skills')) return true
        if (p.includes('(development)') || p.includes('(creation)')) return true
        if (p.includes('SKILL.md')) return true
        return false
      })
      ;(mockReaddirSync as jest.Mock).mockImplementation((path) => {
        const p = normalizePath(path)
        if (p.endsWith('skills')) {
          return [
            { name: '(development)', isDirectory: () => true },
            { name: '(creation)', isDirectory: () => true },
          ]
        }
        if (p.includes('(development)')) {
          return [{ name: 'dev-skill', isDirectory: () => true }]
        }
        if (p.includes('(creation)')) {
          return [{ name: 'creator-skill', isDirectory: () => true }]
        }
        return []
      })
      ;(mockReadFileSync as jest.Mock).mockImplementation((path) => {
        if (String(path).includes('dev-skill')) {
          return `---\nname: dev-skill\ndescription: Dev skill\n---`
        }
        return `---\nname: creator-skill\ndescription: Creator skill\n---`
      })

      const skills = discoverSkills()
      expect(skills).toHaveLength(2)
      expect(skills.find((s) => s.name === 'dev-skill')?.category).toBe('development')
      expect(skills.find((s) => s.name === 'creator-skill')?.category).toBe('creation')
    })
  })

  describe('discoverCategories', () => {
    it('should return empty array when no category folders exist', () => {
      ;(mockExistsSync as jest.Mock).mockImplementation((path) => {
        if (normalizePath(path).endsWith('skills')) return true
        return false
      })
      ;(mockReaddirSync as jest.Mock).mockReturnValue([{ name: 'some-skill', isDirectory: () => true }])
      const categories = discoverCategories()
      expect(categories).toEqual([])
    })

    it('should discover category folders', () => {
      ;(mockExistsSync as jest.Mock).mockImplementation((path) => {
        const p = normalizePath(path)
        if (p.endsWith('skills')) return true
        if (p.includes('_category.json')) return false
        return false
      })
      ;(mockReaddirSync as jest.Mock).mockReturnValue([
        { name: '(development)', isDirectory: () => true },
        { name: '(creation)', isDirectory: () => true },
        { name: 'uncategorized-skill', isDirectory: () => true },
      ])
      const categories = discoverCategories()
      expect(categories).toHaveLength(2)
      expect(categories[0].id).toBe('development')
      expect(categories[0].name).toBe('Development')
      expect(categories[1].id).toBe('creation')
      expect(categories[1].name).toBe('Creation')
    })
  })

  describe('getSkillByName', () => {
    it('should return undefined for non-existent skill', () => {
      ;(mockExistsSync as jest.Mock).mockImplementation((path) => {
        if (normalizePath(path).endsWith('skills')) return true
        return false
      })
      ;(mockReaddirSync as jest.Mock).mockReturnValue([])
      const skill = getSkillByName('non-existent-skill')
      expect(skill).toBeUndefined()
    })

    it('should find skill by name', () => {
      ;(mockExistsSync as jest.Mock).mockImplementation((path) => {
        const p = normalizePath(path)
        if (p.endsWith('skills')) return true
        if (p.includes('(development)')) return true
        if (p.includes('target-skill/SKILL.md')) return true
        return false
      })
      ;(mockReaddirSync as jest.Mock).mockImplementation((path) => {
        const p = normalizePath(path)
        if (p.endsWith('skills')) {
          return [{ name: '(development)', isDirectory: () => true }]
        }
        if (p.includes('(development)')) {
          return [{ name: 'target-skill', isDirectory: () => true }]
        }
        return []
      })
      ;(mockReadFileSync as jest.Mock).mockReturnValue(`---
name: target-skill
description: The target skill
---`)

      const skill = getSkillByName('target-skill')
      expect(skill).toBeDefined()
      expect(skill?.name).toBe('target-skill')
      expect(skill?.category).toBe('development')
    })
  })
})
