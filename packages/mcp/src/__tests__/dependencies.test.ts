import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { findWorkspaceRoot } from './support/mcp-client'

const root = findWorkspaceRoot()

function installedVersions(name: string): string[] {
  let output: string
  try {
    output = execFileSync('npm', ['ls', name, '--all', '--parseable'], { cwd: root, encoding: 'utf8' })
  } catch (error) {
    output = String((error as { stdout?: string }).stdout ?? '')
  }
  const dirs = output.split('\n').filter((line) => line.endsWith(join('node_modules', name)))
  return [
    ...new Set(
      dirs.map((dir) => (JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { version: string }).version),
    ),
  ]
}

function atLeast(version: string, minimum: string): boolean {
  const parse = (value: string) => value.split('-')[0].split('.').map(Number)
  const [a, b] = [parse(version), parse(minimum)]
  for (let index = 0; index < 3; index++) {
    if (a[index] !== b[index]) return a[index] > b[index]
  }
  return true
}

describe('MCP dependency versions', () => {
  it('resolves zod at 4.6.6 or later', () => {
    const versions = installedVersions('zod')

    expect(versions.length).toBeGreaterThan(0)
    expect(versions.filter((version) => !atLeast(version, '4.6.6'))).toEqual([])
  })

  it('keeps the MCP tooling outside the open Dependabot ranges', () => {
    const minimums: Record<string, string> = {
      '@modelcontextprotocol/sdk': '1.32.0',
      hono: '4.13.11',
      '@hono/node-server': '2.1.3',
      undici: '8.12.2',
      'fast-uri': '3.1.9',
    }

    const vulnerable = Object.entries(minimums).flatMap(([name, minimum]) =>
      installedVersions(name)
        .filter((version) => !atLeast(version, minimum))
        .map((version) => `${name}@${version}`),
    )

    expect(vulnerable).toEqual([])
  })
})
