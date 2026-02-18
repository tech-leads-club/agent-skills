import * as assert from 'assert'
import { ScopePolicyService } from '../../services/scope-policy-service'

describe('ScopePolicyService', () => {
  const service = new ScopePolicyService()

  it('defaults to all scopes when configured as all', () => {
    const result = service.evaluate({
      allowedScopes: 'all',
      isWorkspaceTrusted: true,
      hasWorkspaceFolder: true,
    })
    assert.deepStrictEqual(result.effectiveScopes, ['local', 'global'])
    assert.strictEqual(result.blockedReason, undefined)
  })

  it('restricts to global when workspace is untrusted', () => {
    const result = service.evaluate({
      allowedScopes: 'all',
      isWorkspaceTrusted: false,
      hasWorkspaceFolder: true,
    })
    assert.deepStrictEqual(result.effectiveScopes, ['global'])
  })

  it('blocks local when workspace is untrusted', () => {
    const result = service.evaluate({
      allowedScopes: 'local',
      isWorkspaceTrusted: false,
      hasWorkspaceFolder: true,
    })
    assert.deepStrictEqual(result.effectiveScopes, [])
    assert.strictEqual(result.blockedReason, 'workspace-untrusted')
  })

  it('blocks local when no workspace folder', () => {
    const result = service.evaluate({
      allowedScopes: 'local',
      isWorkspaceTrusted: true,
      hasWorkspaceFolder: false,
    })
    assert.deepStrictEqual(result.effectiveScopes, [])
    assert.strictEqual(result.blockedReason, 'workspace-missing')
  })

  it('allows global only when configured global', () => {
    const result = service.evaluate({
      allowedScopes: 'global',
      isWorkspaceTrusted: true,
      hasWorkspaceFolder: true,
    })
    assert.deepStrictEqual(result.effectiveScopes, ['global'])
  })

  it('blocks all when configured none', () => {
    const result = service.evaluate({
      allowedScopes: 'none',
      isWorkspaceTrusted: true,
      hasWorkspaceFolder: true,
    })
    assert.deepStrictEqual(result.effectiveScopes, [])
    assert.strictEqual(result.blockedReason, 'policy-none')
  })
})
