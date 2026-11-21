import { execFileSync } from 'node:child_process'

import { findWorkspaceRoot } from './support/mcp-client'

type NpmTree = { version?: string; dependencies?: Record<string, NpmTree> }

const PATCHED_BY_MAJOR: Record<string, Record<number, string>> = {
  zod: { 4: '4.6.6' },
  '@modelcontextprotocol/sdk': { 1: '1.32.0' },
  hono: { 4: '4.13.11' },
  '@hono/node-server': { 2: '2.1.3' },
  undici: { 7: '7.30.1', 8: '8.12.2' },
  'fast-uri': { 3: '3.1.9', 4: '4.2.3' },
}

function readTree(): NpmTree {
  let output: string
  try {
    output = execFileSync('npm', ['ls', '--all', '--json'], {
      cwd: findWorkspaceRoot(),
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
    })
  } catch (error) {
    output = String((error as { stdout?: string }).stdout ?? '')
  }
  return JSON.parse(output) as NpmTree
}

function collectVersions(tree: NpmTree, names: Set<string>, found = new Map<string, Set<string>>()) {
  for (const [name, child] of Object.entries(tree.dependencies ?? {})) {
    if (names.has(name) && child.version) {
      const versions = found.get(name) ?? new Set<string>()
      versions.add(child.version)
      found.set(name, versions)
    }
    collectVersions(child, names, found)
  }
  return found
}

function parse(version: string): number[] {
  return version.split('-')[0].split('.').map(Number)
}

function isPatched(name: string, version: string): boolean {
  const [major] = parse(version)
  const minimum = PATCHED_BY_MAJOR[name][major]
  if (minimum === undefined) return false
  const [a, b] = [parse(version), parse(minimum)]
  for (let index = 0; index < 3; index++) {
    if (a[index] !== b[index]) return a[index] > b[index]
  }
  return true
}

const installed = collectVersions(readTree(), new Set(Object.keys(PATCHED_BY_MAJOR)))

function unpatched(names: string[]): string[] {
  return names.flatMap((name) =>
    [...(installed.get(name) ?? [])]
      .filter((version) => !isPatched(name, version))
      .map((version) => `${name}@${version}`),
  )
}

describe('MCP dependency versions', () => {
  it('treats a version in an unlisted major or below its major minimum as unpatched', () => {
    expect(isPatched('fast-uri', '4.2.0')).toBe(false)
    expect(isPatched('fast-uri', '4.2.3')).toBe(true)
    expect(isPatched('undici', '7.30.1')).toBe(true)
    expect(isPatched('undici', '6.21.0')).toBe(false)
    expect(isPatched('zod', '3.25.76')).toBe(false)
  })

  it('resolves zod at 4.6.6 or later', () => {
    expect(installed.get('zod')?.size ?? 0).toBeGreaterThan(0)
    expect(unpatched(['zod'])).toEqual([])
  })

  it('keeps the MCP tooling outside the open Dependabot ranges', () => {
    for (const name of ['hono', '@hono/node-server', 'undici', 'fast-uri']) {
      expect({ name, found: (installed.get(name)?.size ?? 0) > 0 }).toEqual({ name, found: true })
    }

    expect(unpatched(['@modelcontextprotocol/sdk', 'hono', '@hono/node-server', 'undici', 'fast-uri'])).toEqual([])
  })
})
