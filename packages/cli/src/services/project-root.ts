import { existsSync } from 'node:fs'
import { dirname, join, parse, resolve } from 'node:path'

export function findProjectRoot(startDir: string = process.cwd()): string {
  let currentDir = resolve(startDir)
  const root = parse(currentDir).root

  while (currentDir !== root) {
    if (existsSync(join(currentDir, 'package.json')) || existsSync(join(currentDir, '.git'))) {
      const isCliPackage = currentDir.endsWith('packages/cli')
      if (!isCliPackage) return currentDir
    }

    currentDir = dirname(currentDir)
  }

  return startDir
}
