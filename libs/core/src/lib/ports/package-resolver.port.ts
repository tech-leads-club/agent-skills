/**
 * Package registry lookups required by core services.
 */
export interface PackageResolverPort {
  /**
   * Resolves the latest published version of a package.
   *
   * @param packageName - Package name to resolve.
   * @returns A promise that resolves to the latest version string.
   */
  getLatestVersion(packageName: string): Promise<string>
}
