import type { CorePorts } from '@tech-leads-club/core'
import { getAllLockedSkills } from '@tech-leads-club/core'
import type { InstalledScopeHashes } from '../shared/types'
import type { LoggingService } from './logging-service'

/**
 * Reads the skill lockfile via core to surface installed content hashes.
 */
export class SkillLockService {
  /**
   * Creates a lockfile reader service.
   *
   * @param ports - Core ports for lockfile access.
   * @param logger - Logging service for lockfile read diagnostics.
   */
  constructor(
    private readonly ports: CorePorts,
    private readonly logger: LoggingService,
  ) {}

  /**
   * Reads all installed skill hashes from the lockfile (local + global).
   *
   * @returns A map of skill name to installed content hash (if known).
   */
  async getInstalledHashes(): Promise<Record<string, string | undefined>> {
    const hashesByScope = await this.getInstalledHashesByScope()
    const result: Record<string, string | undefined> = {}

    for (const [skillName, hashes] of Object.entries(hashesByScope)) {
      result[skillName] = hashes.local ?? hashes.global
    }

    return result
  }

  /**
   * Reads all installed skill hashes from the lockfile with per-scope detail.
   */
  async getInstalledHashesByScope(): Promise<Record<string, InstalledScopeHashes>> {
    try {
      const [local, global] = await Promise.all([
        getAllLockedSkills(this.ports, false),
        getAllLockedSkills(this.ports, true),
      ])

      const result: Record<string, InstalledScopeHashes> = {}

      for (const [skillName, entry] of Object.entries(local)) {
        result[skillName] = {
          ...result[skillName],
          local: entry?.contentHash,
        }
      }

      for (const [skillName, entry] of Object.entries(global)) {
        result[skillName] = {
          ...result[skillName],
          global: entry?.contentHash,
        }
      }

      return result
    } catch (err: unknown) {
      this.logger.warn(`Unable to read skill lockfile: ${err instanceof Error ? err.message : 'Unknown error'}`)
      return {}
    }
  }

  /**
   * Reads the installed hash for a single skill.
   *
   * @param skillName - Skill identifier to resolve.
   * @returns Installed content hash, or `undefined` when missing.
   */
  async getInstalledHash(skillName: string): Promise<string | undefined> {
    const hashes = await this.getInstalledHashes()
    return hashes[skillName]
  }
}
