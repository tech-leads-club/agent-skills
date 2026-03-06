import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { NodeFileSystemAdapter } from '../index'

describe('NodeFileSystemAdapter', () => {
  it('writes and reads file content in a real temporary directory', async () => {
    const adapter = new NodeFileSystemAdapter()
    const tempDir = await mkdtemp(join(tmpdir(), 'core-node-fs-'))
    const filePath = join(tempDir, 'integration.txt')

    try {
      await adapter.writeFile(filePath, 'hello core', 'utf-8')
      const content = await adapter.readFile(filePath, 'utf-8')

      expect(content).toBe('hello core')
      expect(adapter.existsSync(filePath)).toBe(true)
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })
})

describe('NodeFileSystemAdapter directory listing helpers', () => {
  it('returns dirent-shaped data for async and sync reads', async () => {
    const adapter = new NodeFileSystemAdapter()
    const tempDir = await mkdtemp(join(tmpdir(), 'core-node-readdir-'))
    const nestedFile = join(tempDir, 'entry.txt')

    try {
      await adapter.writeFile(nestedFile, 'value', 'utf-8')

      const asyncEntries = await adapter.readdir(tempDir)
      const syncEntries = adapter.readdirSync(tempDir)

      expect(asyncEntries.some((entry: { name: string }) => entry.name === 'entry.txt')).toBe(true)
      expect(syncEntries.some((entry: { name: string }) => entry.name === 'entry.txt')).toBe(true)

      const fileContent = await readFile(nestedFile, 'utf-8')
      expect(fileContent).toBe('value')
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })
})
