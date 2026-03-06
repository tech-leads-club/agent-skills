/**
 * Shell command execution required by core services.
 */
export interface ShellPort {
  /**
   * Executes a shell command synchronously.
   *
   * @param command - Shell command to execute.
   * @param options - Optional execution settings.
   * @returns The command output as text.
   */
  exec(command: string, options?: { encoding?: string }): string
}
