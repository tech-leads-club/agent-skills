import { ExtensionMessage, WebviewMessage } from '../../shared/messages'

describe('Shared Messages', () => {
  it('should construct WebviewMessage with webviewDidMount', () => {
    const msg: WebviewMessage = { type: 'webviewDidMount' }
    expect(msg.type).toBe('webviewDidMount')
  })

  it('should construct ExtensionMessage with initialize', () => {
    const msg: ExtensionMessage = { type: 'initialize', payload: { version: '1.0.0' } }
    expect(msg.type).toBe('initialize')
    expect(msg.payload.version).toBe('1.0.0')
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
    const msg: ExtensionMessage = { type: 'initialize', payload: { version: '1.0.0' } }
    let version = ''
    switch (msg.type) {
      case 'initialize':
        version = msg.payload.version
        break
    }
    expect(version).toBe('1.0.0')
  })
})
