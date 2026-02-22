import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import * as vscode from 'vscode'
import type { CliHealthStatus } from '../shared/types'
import type { CliSpawner } from './cli-spawner'
import type { LoggingService } from './logging-service'

const ERRNO_ENOENT = 'ENOENT'
const ERRNO_EINVAL = 'EINVAL'

/**
 * Normalizes unknown health-check errors into a user-facing message.
 *
 * @param error - Unknown error captured during health checks.
 * @returns Human-readable error message.
 */
const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'An unexpected error occurred while checking CLI health'

/**
 * Type guard for Node errno-style exceptions.
 *
 * @param error - Unknown value to validate.
 * @returns `true` when the value includes a string errno `code`.
 */
const isErrnoException = (error: unknown): error is NodeJS.ErrnoException =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  typeof (error as NodeJS.ErrnoException).code === 'string'

/** Minimum CLI version supported by the extension. */
export const MIN_SUPPORTED_CLI_VERSION = '1.0.0'

/**
 * Checks CLI availability and version compatibility on activation.
 */
export class CliHealthChecker implements vscode.Disposable {
  private cachedStatus: CliHealthStatus | null = null
  private activeProcess: { kill: () => void } | null = null

  /**
   * Creates a health checker bound to CLI process spawning and logging.
   *
   * @param spawner - Spawner used to run `agent-skills --version`.
   * @param logger - Logging service for diagnostics.
   */
  constructor(
    private readonly spawner: CliSpawner,
    private readonly logger: LoggingService,
  ) {}

  /**
   * Stops any active health-check process.
   *
   * @returns Nothing.
   */
  dispose(): void {
    if (this.activeProcess) {
      this.logger.warn('Active health-check process found during dispose, terminating process')
      this.activeProcess.kill()
      this.activeProcess = null
    }
  }

  /**
   * Returns the last known health status.
   *
   * @returns Cached health status, or `null` when never checked.
   */
  getStatus(): CliHealthStatus | null {
    return this.cachedStatus
  }

  /**
   * Performs a fresh health check by spawning 'npx agent-skills --version'.
   *
   * @returns A promise with normalized CLI health status.
   */
  async check(): Promise<CliHealthStatus> {
    this.logger.debug('Checking CLI health...')
    let timeout: NodeJS.Timeout | null = null

    try {
      const checkPromise = new Promise<CliHealthStatus>((resolve, reject) => {
        timeout = setTimeout(() => {
          this.logger.warn('CLI version check timed out')
          if (this.activeProcess) {
            this.logger.warn('Terminating active health-check process after timeout')
            this.activeProcess.kill()
            this.activeProcess = null
          }
          resolve({ status: 'unknown', error: 'Timeout waiting for CLI version' })
        }, 15000)

        const cwd = this.getHealthCheckCwd()
        this.logger.debug(`Using health-check cwd: ${cwd}`)

        this.logger.debug('Spawning CLI process for --version')
        let cliProcess: ReturnType<CliSpawner['spawn']>
        try {
          cliProcess = this.spawner.spawn(['--version'], {
            cwd,
            operationId: 'health-check',
          })
        } catch (error: unknown) {
          reject(error)
          return
        }

        this.activeProcess = cliProcess

        let output = ''
        cliProcess.onOutput((line) => {
          output += line + '\n'
        })

        cliProcess
          .onComplete()
          .then((result) => {
            if (timeout) {
              clearTimeout(timeout)
              timeout = null
            }
            this.activeProcess = null

            const lowerError = result.stderr.toLowerCase()

            if (
              (result.exitCode === null && lowerError.includes('enoent')) ||
              (lowerError.includes('enoent') && lowerError.includes('npx'))
            ) {
              this.logger.warn('Detected missing npx from CLI health-check output')
              resolve({ status: 'npx-missing' })
              return
            }

            if (result.exitCode !== 0) {
              this.logger.warn(`CLI health-check failed with non-zero exit code: ${result.exitCode}`)
              resolve({ status: 'cli-missing' })
              return
            }

            const match = output.match(/(\d+\.\d+\.\d+)/)
            if (match) {
              const version = match[1]
              if (this.isVersionCompatible(version)) {
                resolve({ status: 'ok', version })
              } else {
                this.logger.warn(`CLI version is outdated: current=${version}, min=${MIN_SUPPORTED_CLI_VERSION}`)
                resolve({ status: 'outdated', version, minVersion: MIN_SUPPORTED_CLI_VERSION })
              }
              return
            }

            this.logger.warn('Unable to parse CLI version from output, marking CLI as missing')
            resolve({ status: 'cli-missing' })
          })
          .catch((error: unknown) => {
            reject(error)
          })
      })

      this.cachedStatus = await checkPromise
      return this.cachedStatus
    } catch (error: unknown) {
      if (isErrnoException(error) && error.code === ERRNO_ENOENT) {
        this.logger.error('Health-check failed due to missing npx executable (ENOENT)', error)
        this.cachedStatus = { status: 'npx-missing' }
        return this.cachedStatus
      }
      if (isErrnoException(error) && error.code === ERRNO_EINVAL) {
        this.logger.error('Health-check failed due to invalid spawn parameters (EINVAL)', error)
        this.cachedStatus = {
          status: 'unknown',
          error: 'Failed to start CLI process (EINVAL). Check shell environment and working directory.',
        }
        return this.cachedStatus
      }
      this.logger.error('Health-check failed unexpectedly', error)
      this.cachedStatus = { status: 'unknown', error: toErrorMessage(error) }
      return this.cachedStatus
    } finally {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }

  /**
   * Picks a valid working directory for CLI health checks.
   */
  private getHealthCheckCwd(): string {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    if (workspacePath && existsSync(workspacePath)) {
      return workspacePath
    }

    try {
      const current = process.cwd()
      if (existsSync(current)) {
        return current
      }
    } catch {
      this.logger.warn('process.cwd() is unavailable while selecting health-check cwd')
    }

    const userHome = homedir()
    if (existsSync(userHome)) {
      return userHome
    }

    return '.'
  }

  /**
   * Compares a CLI version against the minimum supported version.
   *
   * @param version - Semver version string returned by the CLI.
   * @returns `true` when the version is supported by this extension.
   */
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
