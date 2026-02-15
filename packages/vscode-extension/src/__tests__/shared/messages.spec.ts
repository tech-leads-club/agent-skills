import { ExtensionMessage, WebviewMessage } from '../../shared/messages'

describe('Shared Messages', () => {
  it('should construct WebviewMessage with webviewDidMount', () => {
    const msg: WebviewMessage = { type: 'webviewDidMount' }
    expect(msg.type).toBe('webviewDidMount')
  })

  it('should construct ExtensionMessage with initialize', () => {
    const msg: ExtensionMessage = {
      type: 'initialize',
      payload: { version: '1.0.0', availableAgents: [], hasWorkspace: true },
    }
    expect(msg.type).toBe('initialize')
    if (msg.type === 'initialize') {
      expect(msg.payload.version).toBe('1.0.0')
    }
  })

  it('should use discriminated union in switch statement for WebviewMessage', () => {
    const msg: WebviewMessage = { type: 'webviewDidMount' }
    let handled = false
    switch (msg.type) {
      case 'webviewDidMount':
        handled = true
        break
    }
    expect(handled).toBe(true)
  })

  it('should use discriminated union in switch statement for ExtensionMessage', () => {
    const msg: ExtensionMessage = {
      type: 'initialize',
      payload: { version: '1.0.0', availableAgents: [], hasWorkspace: true },
    }
    let version = ''
    switch (msg.type) {
      case 'initialize':
        version = msg.payload.version
        break
    }
    expect(version).toBe('1.0.0')
  })

  // NEW TESTS FOR REGISTRY MESSAGES

  it('should construct WebviewMessage with requestRefresh', () => {
    const msg: WebviewMessage = { type: 'requestRefresh' }
    expect(msg.type).toBe('requestRefresh')
  })

  it('should construct ExtensionMessage with registryUpdate', () => {
    const msg: ExtensionMessage = {
      type: 'registryUpdate',
      payload: {
        status: 'ready',
        registry: { version: '1.0.0', categories: {}, skills: [] },
        fromCache: false,
      },
    }
    expect(msg.type).toBe('registryUpdate')
    expect(msg.payload.status).toBe('ready')
    expect(msg.payload.registry).toBeTruthy()
  })

  it('should support all status variants in RegistryUpdatePayload', () => {
    const statuses: Array<'loading' | 'ready' | 'error' | 'offline'> = ['loading', 'ready', 'error', 'offline']
    statuses.forEach((status) => {
      const msg: ExtensionMessage = {
        type: 'registryUpdate',
        payload: {
          status,
          registry: null,
          errorMessage: 'test error',
          fromCache: true,
        },
      }
      expect(msg.payload.status).toBe(status)
    })
  })

  // TESTS FOR INSTALL/REMOVE PAYLOADS WITH MULTI-AGENT SUPPORT

  it('should construct installSkill with multiple agents', () => {
    const msg: WebviewMessage = {
      type: 'installSkill',
      payload: { skillName: 'test', agents: ['cursor', 'claude-code'], scope: 'local' },
    }
    expect(msg.type).toBe('installSkill')
    if (msg.type === 'installSkill') {
      expect(msg.payload.agents).toEqual(['cursor', 'claude-code'])
      expect(msg.payload.scope).toBe('local')
    }
  })

  it('should construct removeSkill with multiple agents', () => {
    const msg: WebviewMessage = {
      type: 'removeSkill',
      payload: { skillName: 'test', agents: ['cursor'], scope: 'global' },
    }
    expect(msg.type).toBe('removeSkill')
    if (msg.type === 'removeSkill') {
      expect(msg.payload.agents).toEqual(['cursor'])
    }
  })

  // TESTS FOR QUICK PICK MESSAGE TYPES

  it('should construct requestAgentPick message', () => {
    const msg: WebviewMessage = {
      type: 'requestAgentPick',
      payload: { skillName: 'test-skill', action: 'add' },
    }
    expect(msg.type).toBe('requestAgentPick')
    if (msg.type === 'requestAgentPick') {
      expect(msg.payload.skillName).toBe('test-skill')
      expect(msg.payload.action).toBe('add')
    }
  })

  it('should construct requestScopePick message', () => {
    const msg: WebviewMessage = {
      type: 'requestScopePick',
      payload: { skillName: 'test-skill', action: 'add', agents: ['cursor'] },
    }
    expect(msg.type).toBe('requestScopePick')
    if (msg.type === 'requestScopePick') {
      expect(msg.payload.agents).toEqual(['cursor'])
    }
  })

  it('should construct agentPickResult message', () => {
    const msg: ExtensionMessage = {
      type: 'agentPickResult',
      payload: { skillName: 'test-skill', action: 'add', agents: ['cursor', 'claude-code'] },
    }
    expect(msg.type).toBe('agentPickResult')
    if (msg.type === 'agentPickResult') {
      expect(msg.payload.agents).toEqual(['cursor', 'claude-code'])
    }
  })

  it('should construct agentPickResult with null agents (cancelled)', () => {
    const msg: ExtensionMessage = {
      type: 'agentPickResult',
      payload: { skillName: 'test-skill', action: 'remove', agents: null },
    }
    if (msg.type === 'agentPickResult') {
      expect(msg.payload.agents).toBeNull()
    }
  })

  it('should construct scopePickResult message', () => {
    const msg: ExtensionMessage = {
      type: 'scopePickResult',
      payload: { skillName: 'test-skill', action: 'add', agents: ['cursor'], scope: 'local' },
    }
    expect(msg.type).toBe('scopePickResult')
    if (msg.type === 'scopePickResult') {
      expect(msg.payload.scope).toBe('local')
    }
  })

  it('should construct scopePickResult with null scope (cancelled)', () => {
    const msg: ExtensionMessage = {
      type: 'scopePickResult',
      payload: { skillName: 'test-skill', action: 'add', agents: ['cursor'], scope: null },
    }
    if (msg.type === 'scopePickResult') {
      expect(msg.payload.scope).toBeNull()
    }
  })
})
