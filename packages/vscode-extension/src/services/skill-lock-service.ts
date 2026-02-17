import { readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { LoggingService } from './logging-service'

interface LockfileSkillEntry {
  contentHash?: string
}

interface SkillLockfile {
  skills?: Record<string, LockfileSkillEntry>
}

/**
 * Reads the CLI lockfile (`~/.agents/.skill-lock.json`) to surface installed content hashes.
 * The extension only reads the file and never mutates it.
 */
export class SkillLockService {
  constructor(private readonly logger: LoggingService) {}

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

  async getInstalledHash(skillName: string): Promise<string | undefined> {
    const hashes = await this.getInstalledHashes()
    return hashes[skillName]
  }

  private getLockfilePath(): string {
    return path.join(os.homedir(), '.agents', '.skill-lock.json')
  }

  private isNotFoundError(err: unknown): boolean {
    if (typeof err === 'object' && err !== null && 'code' in err) {
      return (err as { code?: unknown }).code === 'ENOENT'
    }
    return false
  }

  private formatError(err: unknown): string {
    if (err instanceof Error) {
      return err.message
    }
    return 'Unknown error'
  }
}
