import type { PackageResolverPort } from '../ports'

type PackageLookupResult = { version: string }
type PackageLookupFn = (packageName: string, options: { version: string }) => Promise<PackageLookupResult>

const defaultPackageLookup: PackageLookupFn = async (packageName, options) => {
  const module = await import('package-json')
  const lookup = module.default as PackageLookupFn
  return lookup(packageName, options)
}

/**
 * Node.js implementation of {@link PackageResolverPort} using `package-json`.
 */
export class NodePackageResolverAdapter implements PackageResolverPort {
  private readonly resolvePackage: PackageLookupFn

  /**
   * Creates a package resolver adapter.
   *
   * @param resolvePackage - Optional package lookup function for testing.
   */
  public constructor(resolvePackage: PackageLookupFn = defaultPackageLookup) {
    this.resolvePackage = resolvePackage
  }

  /**
   * Resolves the latest published version of a package.
   *
   * @param packageName - Package name to resolve.
   * @returns The latest version string.
   */
  public async getLatestVersion(packageName: string): Promise<string> {
    const pkg = await this.resolvePackage(packageName, { version: 'latest' })
    return pkg.version
  }
}
