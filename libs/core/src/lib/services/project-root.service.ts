import { dirname, join, parse, resolve, sep } from 'node:path'
import type { CorePorts } from '../ports'

const PROJECT_MARKERS = ['package.json', '.git'] as const

/**
 * Locates the project root directory by walking upwards until a marker file or directory is found.
 *
 * @param ports - Core ports that expose filesystem and environment accessors.
 * @param startDir - Optional directory to start the search from. Defaults to the current working directory.
 * @returns The nearest directory containing {@link PROJECT_MARKERS} or the original search directory if nothing is found.
 * @example
 * ```ts
 * const root = findProjectRoot(ports, '/home/dev/agent-skills/packages/cli/src')
 * ```
 */
export function findProjectRoot(ports: CorePorts, startDir?: string): string {
  const fallbackDir = startDir ?? ports.env.cwd()
  let currentDir = resolve(fallbackDir)
  const { root } = parse(currentDir)
  const cliSuffix = `packages${sep}cli`

  while (currentDir !== root) {
    if (PROJECT_MARKERS.some((marker) => ports.fs.existsSync(join(currentDir, marker)))) {
      const isCliPackage = currentDir.endsWith(cliSuffix)
      if (!isCliPackage) return currentDir
    }

    currentDir = dirname(currentDir)
  }

  return fallbackDir
}
