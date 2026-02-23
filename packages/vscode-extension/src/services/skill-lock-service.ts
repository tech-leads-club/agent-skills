import { readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { LoggingService } from './logging-service'

/**
 * Information for a single installed skill inside the lockfile.
 */
interface LockfileSkillEntry {
  contentHash?: string
}

/**
 * Representation of the lockfile object.
 */
interface SkillLockfile {
  skills?: Record<string, LockfileSkillEntry>
}

/**
 * Reads the CLI lockfile (`~/.agents/.skill-lock.json`) to surface installed content hashes.
 * The extension only reads the file and never mutates it.
 */
export class SkillLockService {
  /**
   * Creates a lockfile reader service.
   *
   * @param logger - Logging service for lockfile read diagnostics.
   */
  constructor(private readonly logger: LoggingService) {}

  /**
   * Reads all installed skill hashes from the lockfile.
   *
   * @returns A map of skill name to installed content hash (if known).
   */
  async getInstalledHashes(): Promise<Record<string, string | undefined>> {
    const lockfilePath = this.getLockfilePath()
    try {
      const raw = await readFile(lockfilePath, 'utf-8')
      const parsed: SkillLockfile = JSON.parse(raw)
      const skills = parsed.skills ?? {}
      const result: Record<string, string | undefined> = {}
      for (const [skillName, entry] of Object.entries(skills)) {
        result[skillName] = entry?.contentHash
      }
      return result
    } catch (err: unknown) {
      if (this.isNotFoundError(err)) {
        this.logger.debug('Skill lockfile not found; returning empty hashes map')
        return {}
      }
      this.logger.warn(`Unable to read skill lockfile: ${this.formatError(err)}`)
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

  /**
   * Returns the absolute path to the skill lockfile.
   *
   * @returns Lockfile path under the current user home directory.
   */
  private getLockfilePath(): string {
    return path.join(os.homedir(), '.agents', '.skill-lock.json')
  }

  /**
   * Detects missing-file errors from unknown exceptions.
   *
   * @param err - Unknown error value.
   * @returns `true` when the error indicates `ENOENT`.
   */
  private isNotFoundError(err: unknown): boolean {
    if (typeof err === 'object' && err !== null && 'code' in err) {
      return (err as { code?: unknown }).code === 'ENOENT'
    }
    return false
  }

  /**
   * Converts unknown errors to a log-friendly string.
   *
   * @param err - Unknown error value.
   * @returns Error message string.
   */
  private formatError(err: unknown): string {
    if (err instanceof Error) {
      return err.message
    }
    return 'Unknown error'
  }
}
