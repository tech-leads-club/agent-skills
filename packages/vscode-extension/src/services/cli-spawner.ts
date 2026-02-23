import { spawn, type ChildProcess } from 'node:child_process'
import * as vscode from 'vscode'
import type { LoggingService } from './logging-service'

/**
 * Options for spawning a CLI process.
 */
export interface SpawnOptions {
  cwd: string // Working directory (workspace folder or homedir)
  operationId: string // For logging correlation
}

/**
 * Result of a completed CLI process.
 */
export interface CliResult {
  exitCode: number | null
  signal: NodeJS.Signals | null
  stderr: string // Full stderr buffer for error reporting
}

/**
 * Handle to a running CLI process with output streaming and lifecycle control.
 */
export interface CliProcess {
  onOutput(handler: (line: string) => void): void
  onComplete(): Promise<CliResult>
  kill(): void
  readonly operationId: string
}

/**
 * Low-level wrapper around child_process.spawn for CLI invocation.
 * Handles ANSI stripping, line-by-line output parsing, and process lifecycle.
 */
export class CliSpawner implements vscode.Disposable {
  private readonly ANSI_REGEX = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g')
  private readonly SKILL_NAME_REGEX = /^[a-z0-9-]+$/

  /**
   * Creates a CLI spawner instance.
   *
   * @param logger - Logging service used for process diagnostics.
   */
  constructor(private readonly logger: LoggingService) {}

  /**
   * Disposes the spawner.
   *
   * @returns Nothing. Active process cleanup is handled by higher-level services.
   */
  dispose(): void {
    // No-op: CliSpawner is stateless. Active processes are managed by OperationQueue.
  }

  /**
   * Spawns a CLI process with the given arguments.
   *
   * @param args - CLI arguments (e.g., ['install', '-s', 'seo', '-a', 'cursor']).
   * @param options - Spawn options (cwd, operationId).
   * @returns A CliProcess handle for output streaming and lifecycle control.
   */
  spawn(args: string[], options: SpawnOptions): CliProcess {
    this.logger.debug(
      `[${options.operationId}] Spawn requested: command=npx agent-skills args="${args.join(' ')}" cwd="${options.cwd}" platform=${process.platform}`,
    )

    const skillNameIndex = args.indexOf('-s')
    if (skillNameIndex !== -1 && skillNameIndex + 1 < args.length) {
      const skillName = args[skillNameIndex + 1]
      if (!this.SKILL_NAME_REGEX.test(skillName)) {
        const validationError = new Error(
          `Invalid skill name: ${skillName}. Only lowercase alphanumeric and hyphens allowed.`,
        )
        this.logger.error(`[${options.operationId}] Skill name validation failed: ${skillName}`, validationError)
        throw validationError
      }
    }

    const isWindows = process.platform === 'win32'
    const command = 'npx'
    const useShell = isWindows
    this.logger.debug(
      `[${options.operationId}] Spawning process: ${command} agent-skills ${args.join(' ')} (shell=${String(useShell)})`,
    )
    let childProcess: ChildProcess
    try {
      childProcess = spawn(command, ['agent-skills', ...args], {
        cwd: options.cwd,
        shell: useShell,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      })
    } catch (error: unknown) {
      const errnoError = error as NodeJS.ErrnoException
      this.logger.error(
        `[${options.operationId}] Spawn threw before process started: command=${command} cwd="${options.cwd}" code=${errnoError.code ?? 'unknown'} errno=${errnoError.errno ?? 'unknown'} message="${errnoError.message ?? String(error)}"`,
        error,
      )
      throw error
    }

    this.logger.debug(`[${options.operationId}] Process spawned: pid=${childProcess.pid ?? 'unknown'}`)

    return this.createCliProcess(childProcess, options)
  }

  /**
   * Creates a CliProcess handle from a ChildProcess.
   *
   * @param childProcess - Spawned Node child process instance.
   * @param options - Spawn metadata used for logging and correlation.
   * @returns Wrapped process handle with output and completion APIs.
   */
  private createCliProcess(childProcess: ChildProcess, options: SpawnOptions): CliProcess {
    const outputHandlers: Array<(line: string) => void> = []
    let stderrBuffer = ''

    let stdoutBuffer = ''
    childProcess.stdout?.on('data', (chunk: Buffer) => {
      stdoutBuffer += chunk.toString()
      const lines = stdoutBuffer.split('\n')
      stdoutBuffer = lines.pop() ?? '' // Keep incomplete line in buffer

      for (const line of lines) {
        const stripped = this.stripAnsi(line)
        if (stripped.trim()) {
          this.logger.debug(`[${options.operationId}] stdout: ${stripped}`)
          outputHandlers.forEach((handler) => handler(stripped))
        }
      }
    })

    childProcess.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString()
      stderrBuffer += text
      this.logger.debug(`[${options.operationId}] stderr: ${this.stripAnsi(text)}`)
    })

    const completionPromise = new Promise<CliResult>((resolve) => {
      let resolved = false
      const resolveCompletion = (result: CliResult) => {
        if (resolved) return
        resolved = true
        resolve(result)
      }

      childProcess.on('close', (exitCode, signal) => {
        if (resolved) return

        if (stdoutBuffer.trim()) {
          const stripped = this.stripAnsi(stdoutBuffer)
          this.logger.debug(`[${options.operationId}] stdout (final): ${stripped}`)
          outputHandlers.forEach((handler) => handler(stripped))
        }

        this.logger.debug(`[${options.operationId}] Process exited: code=${exitCode}, signal=${signal}`)
        resolveCompletion({
          exitCode,
          signal,
          stderr: this.stripAnsi(stderrBuffer),
        })
      })

      childProcess.on('error', (error: NodeJS.ErrnoException) => {
        this.logger.error(
          `[${options.operationId}] Process error event: message="${error.message}" code=${error.code ?? 'unknown'} errno=${error.errno ?? 'unknown'}`,
          error,
        )
        resolveCompletion({
          exitCode: null,
          signal: null,
          stderr: this.stripAnsi(error.message ?? String(error)),
        })
      })
    })

    const logger = this.logger

    return {
      onOutput(handler: (line: string) => void): void {
        outputHandlers.push(handler)
      },
      onComplete(): Promise<CliResult> {
        return completionPromise
      },
      kill(): void {
        if (!childProcess.killed) {
          logger.warn(`[${options.operationId}] Kill requested, sending SIGTERM`)
          childProcess.kill('SIGTERM')
        } else {
          logger.debug(`[${options.operationId}] Kill requested, process already terminated`)
        }
      },
      operationId: options.operationId,
    }
  }

  /**
   * Strips ANSI color codes from a string.
   *
   * @param text - Text that may include ANSI escape codes.
   * @returns Sanitized plain-text output.
   */
  private stripAnsi(text: string): string {
    return text.replace(this.ANSI_REGEX, '')
  }
}
