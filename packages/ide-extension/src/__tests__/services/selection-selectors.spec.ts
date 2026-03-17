import { describe, expect, it } from '@jest/globals'
import { getCategoryOptions, getOutdatedSkills, getSelectableSkills } from '../../services/selection-selectors'
import type { AvailableAgent, InstalledSkillsMap, SkillRegistry } from '../../shared/types'

const registry: SkillRegistry = {
  version: '1',
  categories: {
    quality: { name: 'Quality Assurance', description: 'Quality tools' },
    search: { name: 'Search and Metadata', description: 'Search tools' },
  },
  skills: [
    {
      name: 'accessibility',
      description: 'Accessibility checks',
      category: 'quality',
      path: 'skills/accessibility',
      files: ['SKILL.md'],
      contentHash: 'hash-accessibility',
    },
    {
      name: 'seo',
      description: 'SEO checks',
      category: 'search',
      path: 'skills/seo',
      files: ['SKILL.md'],
      contentHash: 'hash-seo',
    },
  ],
}

const allAgents: AvailableAgent[] = [
  { agent: 'cursor', displayName: 'Cursor', company: 'Anysphere' },
  { agent: 'claude-code', displayName: 'Claude Code', company: 'Anthropic' },
]

describe('selection-selectors', () => {
  it('returns all categories sorted with the all option first', () => {
    expect(getCategoryOptions(registry)).toEqual([
      { id: 'all', label: 'All categories' },
      { id: 'quality', label: 'Quality Assurance' },
      { id: 'search', label: 'Search and Metadata' },
    ])
  })

  it('returns install candidates that are not installed for all target agents in scope', () => {
    const installedSkills: InstalledSkillsMap = {
      accessibility: {
        local: true,
        global: false,
        agents: [{ agent: 'cursor', displayName: 'Cursor', local: true, global: false, corrupted: false }],
      },
      seo: null,
    }

    const result = getSelectableSkills({
      action: 'install',
      registry,
      installedSkills,
      allAgents,
      selectedAgents: ['cursor', 'claude-code'],
      scope: 'local',
    })

    expect(result.map((skill) => skill.name)).toEqual(['accessibility', 'seo'])
  })

  it('returns only installed skills for uninstall flow scoped by selected agents', () => {
    const installedSkills: InstalledSkillsMap = {
      accessibility: {
        local: true,
        global: false,
        agents: [{ agent: 'cursor', displayName: 'Cursor', local: true, global: false, corrupted: false }],
      },
      seo: {
        local: true,
        global: false,
        agents: [{ agent: 'claude-code', displayName: 'Claude Code', local: true, global: false, corrupted: false }],
      },
    }

    const result = getSelectableSkills({
      action: 'uninstall',
      registry,
      installedSkills,
      allAgents,
      selectedAgents: ['cursor'],
      scope: 'local',
    })

    expect(result.map((skill) => skill.name)).toEqual(['accessibility'])
  })

  it('returns only outdated skills for allowed scopes', () => {
    const installedSkills: InstalledSkillsMap = {
      accessibility: {
        local: true,
        global: false,
        contentHash: 'old-hash',
        agents: [{ agent: 'cursor', displayName: 'Cursor', local: true, global: false, corrupted: false }],
      },
      seo: {
        local: false,
        global: true,
        contentHash: 'hash-seo',
        agents: [{ agent: 'cursor', displayName: 'Cursor', local: false, global: true, corrupted: false }],
      },
    }

    const result = getOutdatedSkills({
      registry,
      installedSkills,
      effectiveScopes: ['local', 'global'],
    })

    expect(result.map((skill) => skill.name)).toEqual(['accessibility'])
  })
})
