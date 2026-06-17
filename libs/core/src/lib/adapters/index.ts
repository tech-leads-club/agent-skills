import type { CorePorts } from '../ports'

import { NodeEnvAdapter } from './node-env.adapter'
import { NodeFileSystemAdapter } from './node-filesystem.adapter'
import { NodeHttpAdapter } from './node-http.adapter'
import { NodeLoggerAdapter } from './node-logger.adapter'
import { NodePackageResolverAdapter } from './node-package-resolver.adapter'
import { NodePathsAdapter } from './node-paths.adapter'
import { NodeShellAdapter } from './node-shell.adapter'

export * from './node-env.adapter'
export * from './node-filesystem.adapter'
export * from './node-http.adapter'
export * from './node-logger.adapter'
export * from './node-package-resolver.adapter'
export * from './node-paths.adapter'
export * from './node-shell.adapter'

/**
 * Creates the default Node.js adapter set for all core infrastructure ports.
 *
 * @returns A fully wired {@link CorePorts} object backed by Node.js APIs.
 *
 * @example
 * ```ts
 * import { createNodeAdapters } from '@tech-leads-club/core'
 *
 * const ports = createNodeAdapters()
 * const cwd = ports.env.cwd()
 * const localDir = ports.paths.getLocalSkillsDirectory()
 * ```
 */
export function createNodeAdapters(): CorePorts {
  return {
    fs: new NodeFileSystemAdapter(),
    http: new NodeHttpAdapter(),
    shell: new NodeShellAdapter(),
    env: new NodeEnvAdapter(),
    logger: new NodeLoggerAdapter(),
    packageResolver: new NodePackageResolverAdapter(),
    paths: new NodePathsAdapter(),
  }
}
