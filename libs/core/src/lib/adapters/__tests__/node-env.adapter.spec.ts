import { NodeEnvAdapter } from '../index'

describe('NodeEnvAdapter', () => {
  it('returns runtime environment values', () => {
    const adapter = new NodeEnvAdapter()

    expect(typeof adapter.cwd()).toBe('string')
    expect(typeof adapter.homedir()).toBe('string')
    expect(typeof adapter.platform()).toBe('string')

    process.env['CORE_ADAPTER_TEST'] = 'enabled'
    expect(adapter.getEnv('CORE_ADAPTER_TEST')).toBe('enabled')
    delete process.env['CORE_ADAPTER_TEST']
  })
})
