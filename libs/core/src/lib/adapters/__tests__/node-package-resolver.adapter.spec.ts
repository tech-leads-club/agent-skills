import { NodePackageResolverAdapter } from '../index'

describe('NodePackageResolverAdapter', () => {
  it('resolves the latest version using the configured resolver', async () => {
    const adapter = new NodePackageResolverAdapter(async () => ({ version: '9.9.9' }))

    await expect(adapter.getLatestVersion('demo-package')).resolves.toBe('9.9.9')
  })
})
