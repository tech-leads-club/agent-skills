import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { readPackageVersion } from '../version'

describe('readPackageVersion', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'mcp-version-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('reads the version from the package.json beside the module', () => {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'x', version: '0.2.0' }))
    const moduleUrl = pathToFileURL(join(dir, 'main.js')).href

    expect(readPackageVersion(moduleUrl, '0.1.11')).toBe('0.2.0')
  })

  it('returns the fallback when no package.json sits beside the module', () => {
    const moduleUrl = pathToFileURL(join(dir, 'main.js')).href

    expect(readPackageVersion(moduleUrl, '0.1.11')).toBe('0.1.11')
  })

  it('returns the fallback when the package.json has no version', () => {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'x' }))
    const moduleUrl = pathToFileURL(join(dir, 'main.js')).href

    expect(readPackageVersion(moduleUrl, '0.1.11')).toBe('0.1.11')
  })
})
