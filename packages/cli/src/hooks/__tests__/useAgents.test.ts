/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals'
import type { AgentType } from '@tech-leads-club/core'
import { renderHook, waitFor } from '@testing-library/react'

const mockDetectInstalledAgents = jest.fn<() => AgentType[]>()
const mockGetAllAgentTypes = jest.fn<() => AgentType[]>()
jest.unstable_mockModule('@tech-leads-club/core', () => ({
  detectInstalledAgents: mockDetectInstalledAgents,
  getAllAgentTypes: mockGetAllAgentTypes,
}))

const mockLoadConfig = jest.fn<() => Promise<{ targetAgents: AgentType[] }>>()
jest.unstable_mockModule('../../services/config', () => ({
  loadConfig: mockLoadConfig,
}))

jest.unstable_mockModule('../../ports', () => ({
  ports: {},
}))

const { useAgents } = await import('../useAgents')

describe('useAgents hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAllAgentTypes.mockReturnValue(['cursor', 'cline', 'windsurf'])
    mockLoadConfig.mockResolvedValue({ targetAgents: [] })
  })

  it('preselects the configured target agents when they are set', async () => {
    mockDetectInstalledAgents.mockReturnValue(['cursor'])
    mockLoadConfig.mockResolvedValue({ targetAgents: ['cline', 'windsurf'] })

    const { result } = renderHook(() => useAgents())

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false)
      },
      { timeout: 2000 },
    )

    expect(result.current.installedAgents).toEqual(['cursor'])
    expect(result.current.selectedAgents).toEqual(['cline', 'windsurf'])
  })

  it('falls back to detected agents when no target agents are configured', async () => {
    mockDetectInstalledAgents.mockReturnValue(['cursor', 'cline'])
    mockLoadConfig.mockResolvedValue({ targetAgents: [] })

    const { result } = renderHook(() => useAgents())

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false)
      },
      { timeout: 2000 },
    )

    expect(result.current.selectedAgents).toEqual(['cursor', 'cline'])
  })
})
