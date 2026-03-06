import { homedir, platform } from 'node:os'

import type { EnvPort } from '../ports'

/**
 * Node.js implementation of {@link EnvPort} using process and os APIs.
 */
export class NodeEnvAdapter implements EnvPort {
  /**
   * Returns the current working directory.
   *
   * @returns The current working directory path.
   */
  public cwd(): string {
    return process.cwd()
  }

  /**
   * Returns the current user's home directory.
   *
   * @returns The home directory path.
   */
  public homedir(): string {
    return homedir()
  }

  /**
   * Returns the current operating system platform identifier.
   *
   * @returns The platform identifier.
   */
  public platform(): string {
    return platform()
  }

  /**
   * Reads an environment variable.
   *
   * @param key - Environment variable name.
   * @returns The variable value when present.
   */
  public getEnv(key: string): string | undefined {
    return process.env[key]
  }
}
