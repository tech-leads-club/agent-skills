import { jest } from '@jest/globals'
import { join, resolve } from 'node:path'

import { NodePathsAdapter } from '../index'

const WORKSPACE_ROOT = resolve('/workspace/repo')
const ADAPTER_DIR = join(WORKSPACE_ROOT, 'libs', 'core', 'src', 'lib', 'adapters')
const SKILLS_CATALOG = join(WORKSPACE_ROOT, 'packages', 'skills-catalog', 'skills')

describe('NodePathsAdapter', () => {
  it('finds the workspace root by locating the skills catalog', () => {
    const existsSyncMock = jest.fn((path: string) => path === SKILLS_CATALOG)
    const adapter = new NodePathsAdapter(ADAPTER_DIR, existsSyncMock)

    expect(adapter.getWorkspaceRoot()).toBe(WORKSPACE_ROOT)
    expect(adapter.getSkillsCatalogPath()).toBe(SKILLS_CATALOG)
    expect(adapter.getLocalSkillsDirectory()).toBe(SKILLS_CATALOG)
  })

  it('returns null when the local skills catalog is unavailable', () => {
    const adapter = new NodePathsAdapter(ADAPTER_DIR, () => false)

    expect(adapter.getWorkspaceRoot()).toBe(ADAPTER_DIR)
    expect(adapter.getLocalSkillsDirectory()).toBeNull()
  })
})
