import { describe, expect, it } from '@jest/globals'
import { ScopeSelectionService } from '../../services/scope-selection-service'
import type { InstalledSkillsMap } from '../../shared/types'

describe('ScopeSelectionService', () => {
  const service = new ScopeSelectionService()

  it('offers local and global add scopes in trusted workspaces', () => {
    const items = service.buildScopeItemsForSkill({
      action: 'add',
      agents: ['cursor'],
      installedInfo: null,
      hasWorkspace: true,
      isTrusted: true,
      effectiveScopes: ['local', 'global'],
    })

    expect(items.map((item) => item.scopeId)).toEqual(['local', 'global', 'all'])
  })

  it('does not offer local scopes when workspace is untrusted', () => {
    const items = service.buildScopeItemsForSkill({
      action: 'add',
      agents: ['cursor'],
      installedInfo: null,
      hasWorkspace: true,
      isTrusted: false,
      effectiveScopes: ['local', 'global'],
    })

    expect(items.map((item) => item.scopeId)).toEqual(['global'])
  })

  it('offers multi-skill remove scopes when at least one skill is installed', () => {
    const installedSkills: InstalledSkillsMap = {
      alpha: {
        local: true,
        global: false,
        agents: [{ agent: 'cursor', displayName: 'Cursor', local: true, global: false, corrupted: false }],
      },
      beta: {
        local: false,
        global: true,
        agents: [{ agent: 'cursor', displayName: 'Cursor', local: false, global: true, corrupted: false }],
      },
    }

    const items = service.buildScopeItemsForSkills({
      action: 'remove',
      skillNames: ['alpha', 'beta'],
      agents: ['cursor'],
      installedSkills,
      hasWorkspace: true,
      isTrusted: true,
      effectiveScopes: ['local', 'global'],
    })

    expect(items.map((item) => item.scopeId)).toEqual(['local', 'global', 'all'])
  })
})
