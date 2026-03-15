import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import * as vscode from 'vscode'

import type { PathsPort } from '@tech-leads-club/core'

const SKILLS_CATALOG_SEGMENTS = ['packages', 'skills-catalog', 'skills'] as const

/**
 * Extension Host implementation of {@link PathsPort} with workspace-aware root.
 */
export class ExtHostPathsAdapter implements PathsPort {
  getWorkspaceRoot(): string {
    const folder = vscode.workspace.workspaceFolders?.[0]
    return folder ? folder.uri.fsPath : homedir()
  }

  getSkillsCatalogPath(): string {
    return join(this.getWorkspaceRoot(), ...SKILLS_CATALOG_SEGMENTS)
  }

  getLocalSkillsDirectory(): string | null {
    const path = this.getSkillsCatalogPath()
    return existsSync(path) ? path : null
  }
}
