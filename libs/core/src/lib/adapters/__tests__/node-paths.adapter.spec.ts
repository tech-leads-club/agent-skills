import { NodePathsAdapter } from '../index'

describe('NodePathsAdapter', () => {
  it('finds the workspace root by locating the skills catalog', () => {
    const existsSyncMock = jest.fn((path: string) => path === '/workspace/repo/packages/skills-catalog/skills')
    const adapter = new NodePathsAdapter('/workspace/repo/libs/core/src/lib/adapters', existsSyncMock)

    expect(adapter.getWorkspaceRoot()).toBe('/workspace/repo')
    expect(adapter.getSkillsCatalogPath()).toBe('/workspace/repo/packages/skills-catalog/skills')
    expect(adapter.getLocalSkillsDirectory()).toBe('/workspace/repo/packages/skills-catalog/skills')
  })

  it('returns null when the local skills catalog is unavailable', () => {
    const adapter = new NodePathsAdapter('/workspace/repo/libs/core/src/lib/adapters', () => false)

    expect(adapter.getWorkspaceRoot()).toBe('/workspace/repo/libs/core/src/lib/adapters')
    expect(adapter.getLocalSkillsDirectory()).toBeNull()
  })
})
