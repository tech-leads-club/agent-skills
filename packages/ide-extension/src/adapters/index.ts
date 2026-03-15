import * as vscode from 'vscode'

import {
  NodeFileSystemAdapter,
  NodeHttpAdapter,
  NodePackageResolverAdapter,
  NodeShellAdapter,
  type CorePorts,
} from '@tech-leads-club/core'

import { ExtHostEnvAdapter } from './ext-host-env.adapter'
import { ExtHostLoggerAdapter } from './ext-host-logger.adapter'
import { ExtHostPathsAdapter } from './ext-host-paths.adapter'

export { ExtHostEnvAdapter } from './ext-host-env.adapter'
export { ExtHostLoggerAdapter } from './ext-host-logger.adapter'
export { ExtHostPathsAdapter } from './ext-host-paths.adapter'

/**
 * Creates CorePorts for the Extension Host with workspace-aware adapters.
 *
 * @param outputChannel - VS Code LogOutputChannel for logging.
 * @returns Complete CorePorts wired for extension host use.
 */
export function createExtHostAdapters(outputChannel: vscode.LogOutputChannel): CorePorts {
  return {
    fs: new NodeFileSystemAdapter(),
    http: new NodeHttpAdapter(),
    shell: new NodeShellAdapter(),
    env: new ExtHostEnvAdapter(),
    logger: new ExtHostLoggerAdapter(outputChannel),
    packageResolver: new NodePackageResolverAdapter(),
    paths: new ExtHostPathsAdapter(),
  }
}
