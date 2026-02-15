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
})
