import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, renderHook } from '@testing-library/react'
import type { ExtensionMessage } from '../../shared/messages'

jest.unstable_mockModule('../../webview/lib/vscode-api', () => ({
  onMessage: jest.fn(),
  postMessage: jest.fn(),
}))

const { onMessage, postMessage } = await import('../../webview/lib/vscode-api')
const { useHostState } = await import('../../webview/hooks/useHostState')

describe('useHostState', () => {
  let messageHandler: (message: ExtensionMessage) => void
  const mockedOnMessage = onMessage as unknown as jest.MockedFunction<typeof onMessage>

  const dispatchMessage = (message: ExtensionMessage) => {
    act(() => {
      messageHandler(message)
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockedOnMessage.mockImplementation((handler) => {
      messageHandler = handler
      return jest.fn()
    })
  })

  it('requests bootstrap on mount and reflects a ready startup snapshot', () => {
    const { result } = renderHook(() => useHostState())

    expect(postMessage).toHaveBeenCalledWith({ type: 'webviewDidMount' })

    dispatchMessage({
      type: 'initialize',
      payload: {
        version: '1.0.0',
        availableAgents: [{ agent: 'cursor', displayName: 'Cursor', company: 'Anysphere' }],
        allAgents: [{ agent: 'cursor', displayName: 'Cursor', company: 'Anysphere' }],
        hasWorkspace: true,
      },
    })
    dispatchMessage({
      type: 'registryUpdate',
      payload: {
        status: 'ready',
        registry: { version: '1.0.0', categories: {}, skills: [] },
        fromCache: false,
      },
    })
    dispatchMessage({ type: 'trustState', payload: { isTrusted: false } })
    dispatchMessage({
      type: 'policyState',
      payload: { allowedScopes: 'global', effectiveScopes: ['global'], blockedReason: undefined },
    })

    expect(result.current.status).toBe('ready')
    expect(result.current.availableAgents).toHaveLength(1)
    expect(result.current.isTrusted).toBe(false)
    expect(result.current.policy).toEqual({
      allowedScopes: 'global',
      effectiveScopes: ['global'],
      blockedReason: undefined,
    })
  })

  it('reflects an offline cached startup snapshot', () => {
    const { result } = renderHook(() => useHostState())

    dispatchMessage({
      type: 'registryUpdate',
      payload: {
        status: 'offline',
        registry: { version: '1.0.0', categories: {}, skills: [] },
        fromCache: true,
        errorMessage: 'Offline cache',
      },
    })

    expect(result.current.status).toBe('offline')
    expect(result.current.fromCache).toBe(true)
    expect(result.current.errorMessage).toBe('Offline cache')
  })

  it('derives the action result from a completed action state', () => {
    const { result } = renderHook(() => useHostState())

    dispatchMessage({
      type: 'actionState',
      payload: {
        status: 'completed',
        actionId: 'action-1',
        action: 'install',
        currentStep: 'Completed install',
        errorMessage: 'Failed to install: seo',
        request: { action: 'install', skills: ['seo'], agents: ['cursor'], scope: 'local', method: 'copy' },
        results: [
          { skillName: 'seo', operation: 'install', scope: 'local', success: false, errorMessage: 'Boom' },
          { skillName: 'docs-writer', operation: 'install', scope: 'local', success: true },
        ],
        logs: [],
        rejectionMessage: null,
      },
    })

    expect(result.current.batchResult).toEqual({
      success: false,
      failedSkills: ['seo'],
      errorMessage: 'Failed to install: seo',
      results: [
        { skillName: 'seo', operation: 'install', scope: 'local', success: false, errorMessage: 'Boom' },
        { skillName: 'docs-writer', operation: 'install', scope: 'local', success: true },
      ],
      action: 'install',
    })
  })

  it('clears the previous action result when a new action starts', () => {
    const { result } = renderHook(() => useHostState())

    dispatchMessage({
      type: 'actionState',
      payload: {
        status: 'completed',
        actionId: 'action-1',
        action: 'update',
        currentStep: 'Completed update',
        errorMessage: null,
        request: { action: 'update', skills: ['seo'], agents: [], scope: 'all' },
        results: [{ skillName: 'seo', operation: 'update', scope: 'local', success: true }],
        logs: [],
        rejectionMessage: null,
      },
    })

    dispatchMessage({
      type: 'actionState',
      payload: {
        status: 'running',
        actionId: 'action-2',
        action: 'remove',
        currentStep: 'Removing seo (local)',
        errorMessage: null,
        request: { action: 'remove', skills: ['seo'], agents: ['cursor'], scope: 'local' },
        results: [],
        logs: [],
        rejectionMessage: 'Another action is already running.',
      },
    })

    expect(result.current.isBatchProcessing).toBe(true)
    expect(result.current.batchResult).toBeNull()
    expect(result.current.actionState.rejectionMessage).toBe('Another action is already running.')
  })
})
