/**
 * Environment and process information required by core services.
 */
export interface EnvPort {
  /**
   * Returns the current working directory.
   *
   * @returns The current working directory path.
   */
  cwd(): string

  /**
   * Returns the current user's home directory.
   *
   * @returns The home directory path.
   */
  homedir(): string

  /**
   * Returns the current operating system platform identifier.
   *
   * @returns The platform identifier.
   */
  platform(): string

  /**
   * Reads an environment variable.
   *
   * @param key - Environment variable name.
   * @returns The variable value when defined; otherwise `undefined`.
   */
  getEnv(key: string): string | undefined
}
