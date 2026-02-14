import { activate, deactivate } from '../extension'

describe('extension', () => {
  it('should export activate and deactivate', () => {
    expect(activate).toBeDefined()
    expect(deactivate).toBeDefined()
  })
})
