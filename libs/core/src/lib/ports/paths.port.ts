/**
 * Workspace and catalog path resolution required by core services.
 */
export interface PathsPort {
  /**
   * Returns the workspace root directory.
   *
   * @returns The resolved workspace root path.
   */
  getWorkspaceRoot(): string

  /**
   * Returns the local skills catalog path.
   *
   * @returns The absolute skills catalog path.
   */
  getSkillsCatalogPath(): string

  /**
   * Returns the local skills directory when available.
   *
   * @returns The local skills directory path or `null` when unavailable.
   */
  getLocalSkillsDirectory(): string | null
}
