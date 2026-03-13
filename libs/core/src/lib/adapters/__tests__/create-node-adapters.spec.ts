import { createNodeAdapters } from '../index'

describe('createNodeAdapters', () => {
  it('returns a complete CorePorts object with expected methods', () => {
    const adapters = createNodeAdapters()

    expect(typeof adapters.fs.readFile).toBe('function')
    expect(typeof adapters.fs.writeFileSync).toBe('function')
    expect(typeof adapters.http.get).toBe('function')
    expect(typeof adapters.shell.exec).toBe('function')
    expect(typeof adapters.env.cwd).toBe('function')
    expect(typeof adapters.logger.info).toBe('function')
    expect(typeof adapters.packageResolver.getLatestVersion).toBe('function')
  })
})
