import { ExtensionMessage, WebviewMessage } from '../../shared/messages'
import type { ActionState } from '../../shared/types'

describe('shared messages', () => {
  it('constructs the active webview messages', () => {
    const mount: WebviewMessage = { type: 'webviewDidMount' }
    const refresh: WebviewMessage = { type: 'requestRefresh' }
    const refreshForUpdate: WebviewMessage = { type: 'requestRefreshForUpdate' }
    const action: WebviewMessage = {
      type: 'requestRunAction',
      payload: { action: 'install', skills: ['seo'], agents: ['cursor'], scope: 'local', method: 'copy' },
    }

    expect(mount.type).toBe('webviewDidMount')
    expect(refresh.type).toBe('requestRefresh')
    expect(refreshForUpdate.type).toBe('requestRefreshForUpdate')
    expect(action.type).toBe('requestRunAction')
  })

  it('constructs initialize and registry update messages', () => {
    const initialize: ExtensionMessage = {
      type: 'initialize',
      payload: { version: '1.0.0', availableAgents: [], allAgents: [], hasWorkspace: true },
    }
    const update: ExtensionMessage = {
      type: 'registryUpdate',
      payload: {
        status: 'ready',
        registry: { version: '1.0.0', categories: {}, skills: [] },
        fromCache: false,
      },
    }

    expect(initialize.type).toBe('initialize')
    expect(update.type).toBe('registryUpdate')
  })

  it('supports all registry status variants', () => {
    const statuses: Array<'loading' | 'ready' | 'error' | 'offline'> = ['loading', 'ready', 'error', 'offline']

    for (const status of statuses) {
      const message: ExtensionMessage = {
        type: 'registryUpdate',
        payload: { status, registry: null, errorMessage: 'test error', fromCache: true },
      }

      expect(message.payload.status).toBe(status)
    }
  })

  it('constructs action state messages with the single-action contract', () => {
    const actionState: ActionState = {
      status: 'completed',
      actionId: 'action-1',
      action: 'update',
      currentStep: 'Completed update',
      errorMessage: null,
      request: { action: 'update', skills: [], agents: [], scope: 'all' },
      results: [{ skillName: 'seo', operation: 'update', scope: 'local', success: true }],
      logs: [{ operation: 'update', skillName: 'seo', scope: 'local', message: 'Completed', severity: 'info' }],
      rejectionMessage: null,
    }
    const message: ExtensionMessage = { type: 'actionState', payload: actionState }

    expect(message.type).toBe('actionState')
    expect(message.payload.results).toHaveLength(1)
  })

  it('constructs snapshot messages for installed, trust, and policy state', () => {
    const reconcile: ExtensionMessage = { type: 'reconcileState', payload: { installedSkills: { seo: null } } }
    const trust: ExtensionMessage = { type: 'trustState', payload: { isTrusted: true } }
    const policy: ExtensionMessage = {
      type: 'policyState',
      payload: { allowedScopes: 'all', effectiveScopes: ['local', 'global'], blockedReason: undefined },
    }

    expect(reconcile.type).toBe('reconcileState')
    expect(trust.type).toBe('trustState')
    expect(policy.type).toBe('policyState')
  })

  it('constructs refreshForUpdateComplete extension message', () => {
    const complete: ExtensionMessage = { type: 'refreshForUpdateComplete' }
    expect(complete.type).toBe('refreshForUpdateComplete')
  })
})
