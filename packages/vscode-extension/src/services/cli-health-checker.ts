import * as vscode from 'vscode'
import type { CliHealthStatus } from '../shared/types'
import type { CliSpawner } from './cli-spawner'
import type { LoggingService } from './logging-service'

/** Minimum CLI version supported by the extension. */
export const MIN_SUPPORTED_CLI_VERSION = '1.0.0'

/**
 * Checks CLI availability and version compatibility on activation.
 */
export class CliHealthChecker implements vscode.Disposable {
  private cachedStatus: CliHealthStatus | null = null
  private activeProcess: { kill: () => void } | null = null

  constructor(
    private readonly spawner: CliSpawner,
    private readonly logger: LoggingService,
  ) {}

  dispose(): void {
    if (this.activeProcess) {
      this.activeProcess.kill()
      this.activeProcess = null
    }
  }

  /**
   * Returns the last known health status.
   */
  getStatus(): CliHealthStatus | null {
    return this.cachedStatus
  }

  /**
   * Performs a fresh health check by spawning 'npx tlc-skills --version'.
   */
  async check(): Promise<CliHealthStatus> {
    this.logger.debug('Checking CLI health...')

    try {
      const checkPromise = new Promise<CliHealthStatus>((resolve) => {
        const timeout = setTimeout(() => {
          this.logger.warn('CLI version check timed out')
          resolve({ status: 'unknown', error: 'Timeout waiting for CLI version' })
        }, 15000)

        const cliProcess = this.spawner.spawn(['--version'], {
          cwd: process.cwd(),
          operationId: 'health-check',
        })

        this.activeProcess = cliProcess

        let output = ''
        cliProcess.onOutput((line) => {
          output += line + '\n'
        })

        cliProcess.onComplete().then((result) => {
          clearTimeout(timeout)
          this.activeProcess = null

        const lowerError = result.stderr.toLowerCase()

        if (result.exitCode === null && lowerError.includes('enoent')) {
          resolve({ status: 'npx-missing' })
          return
        }

        if (lowerError.includes('enoent') && lowerError.includes('npx')) {
          resolve({ status: 'npx-missing' })
          return
        }

          if (result.exitCode !== 0) {
            if (result.stderr.includes('MODULE_NOT_FOUND') || result.stderr.includes('ERR_MODULE_NOT_FOUND')) {
              resolve({ status: 'cli-missing' })
            } else {
              resolve({ status: 'cli-missing' })
            }
            return
          }

          const match = output.match(/(\d+\.\d+\.\d+)/)
          if (match) {
            const version = match[1]
            if (this.isVersionCompatible(version)) {
              resolve({ status: 'ok', version })
            } else {
              resolve({ status: 'outdated', version, minVersion: MIN_SUPPORTED_CLI_VERSION })
            }
          } else {
            resolve({ status: 'cli-missing' }) // Fallback if no version output
          }
        })
      })

      this.cachedStatus = await checkPromise
      return this.cachedStatus
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.cachedStatus = { status: 'npx-missing' }
        return this.cachedStatus
      }
      this.cachedStatus = { status: 'unknown', error: String(error) }
      return this.cachedStatus
    }
  }

  private isVersionCompatible(version: string): boolean {
    const [major, minor, patch] = version.split('.').map(Number)
    const [minMajor, minMinor, minPatch] = MIN_SUPPORTED_CLI_VERSION.split('.').map(Number)

    if (major > minMajor) return true
    if (major < minMajor) return false

    if (minor > minMinor) return true
    if (minor < minMinor) return false

    return patch >= minPatch
  }
}
