import { homedir, platform } from 'node:os'

import * as vscode from 'vscode'

import type { EnvPort } from '@tech-leads-club/core'

/**
 * Extension Host implementation of {@link EnvPort} with workspace-aware cwd.
 */
export class ExtHostEnvAdapter implements EnvPort {
  cwd(): string {
    const folder = vscode.workspace.workspaceFolders?.[0]
    return folder ? folder.uri.fsPath : homedir()
  }

  homedir(): string {
    return homedir()
  }

  platform(): string {
    return platform()
  }

  getEnv(key: string): string | undefined {
    return process.env[key]
  }
}
