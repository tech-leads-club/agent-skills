import { execSync } from 'node:child_process'

import type { ShellPort } from '../ports'

/**
 * Node.js implementation of {@link ShellPort} using `execSync`.
 */
export class NodeShellAdapter implements ShellPort {
  /**
   * Executes a shell command synchronously.
   *
   * @param command - Shell command to execute.
   * @param options - Optional command execution options.
   * @returns The command output text.
   */
  public exec(command: string, options?: { encoding?: string }): string {
    return execSync(command, {
      encoding: (options?.encoding ?? 'utf-8') as BufferEncoding,
    })
  }
}
