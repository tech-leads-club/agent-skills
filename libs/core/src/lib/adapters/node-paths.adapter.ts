import { existsSync } from 'node:fs'
import { dirname, join, parse, resolve } from 'node:path'

import type { PathsPort } from '../ports'

const SKILLS_CATALOG_SEGMENTS = ['packages', 'skills-catalog', 'skills'] as const

type ExistsSyncFn = (path: string) => boolean

function findWorkspaceRoot(startDir: string, existsSyncFn: ExistsSyncFn): string {
  const fallbackDir = resolve(startDir)
  let currentDir = fallbackDir
  const { root } = parse(currentDir)

  while (true) {
    if (existsSyncFn(join(currentDir, ...SKILLS_CATALOG_SEGMENTS))) return currentDir
    if (currentDir === root) return fallbackDir
    currentDir = dirname(currentDir)
  }
}

/**
 * Node.js implementation of {@link PathsPort} using filesystem lookups.
 */
export class NodePathsAdapter implements PathsPort {
  public constructor(
    private readonly startDir = process.cwd(),
    private readonly existsSyncFn: ExistsSyncFn = existsSync,
  ) {}

  /**
   * @inheritdoc
   */
  public getWorkspaceRoot(): string {
    return findWorkspaceRoot(this.startDir, this.existsSyncFn)
  }

  /**
   * @inheritdoc
   */
  public getSkillsCatalogPath(): string {
    return join(this.getWorkspaceRoot(), ...SKILLS_CATALOG_SEGMENTS)
  }

  /**
   * @inheritdoc
   */
  public getLocalSkillsDirectory(): string | null {
    const path = this.getSkillsCatalogPath()
    return this.existsSyncFn(path) ? path : null
  }
}
