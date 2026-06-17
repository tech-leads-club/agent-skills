import { homedir, platform } from 'node:os'

import type { EnvPort } from '../ports'

/**
 * Node.js implementation of {@link EnvPort} using process and os APIs.
 */
export class NodeEnvAdapter implements EnvPort {
  /**
   * @inheritdoc
   */
  public cwd(): string {
    return process.cwd()
  }

  /**
   * @inheritdoc
   */
  public homedir(): string {
    return homedir()
  }

  /**
   * @inheritdoc
   */
  public platform(): string {
    return platform()
  }

  /**
   * @inheritdoc
   */
  public getEnv(key: string): string | undefined {
    return process.env[key]
  }
}
