import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { FastMCP } from 'fastmcp'

import { buildIndexes } from '../../registry'
import { registerPrepareTool } from '../prepare-tool'
import { createRegistry } from './helpers'

type RegisteredTool = {
  name: string
  annotations?: Record<string, unknown>
  execute: (args: { skill_name: string; file_paths?: string[]; dry_run?: boolean }) => Promise<unknown>
}

class FakeServer {
  public tool?: RegisteredTool
  addTool(tool: RegisteredTool): void {
    this.tool = tool
  }
}

function setup() {
  const server = new FakeServer()
  const indexes = buildIndexes(
    createRegistry([{ name: 'demo', files: ['SKILL.md', 'scripts/run.mjs', 'references/guide.md'] }]),
  )
  registerPrepareTool(server as unknown as FastMCP, () => indexes)
  return server
}

describe('registerPrepareTool', () => {
  let root: string
  const previous = process.env.SKILLS_STAGING_DIR

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'prepare-tool-'))
    process.env.SKILLS_STAGING_DIR = root
  })

  afterEach(async () => {
    if (previous === undefined) delete process.env.SKILLS_STAGING_DIR
    else process.env.SKILLS_STAGING_DIR = previous
    await rm(root, { recursive: true, force: true })
  })

  it('should register the tool as a write operation', () => {
    const server = setup()
    expect(server.tool?.name).toBe('prepare_skill_files')
    expect(server.tool?.annotations).toMatchObject({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    })
  })

  // hazard: a preview that writes is worse than no preview — it would defeat the confirmation
  it('should write nothing on dry_run', async () => {
    const server = setup()
    const output = (await server.tool?.execute({ skill_name: 'demo', dry_run: true })) as string

    expect(output).toContain('Dry run — nothing was written')
    expect(output).toContain('scripts/run.mjs')
    expect(output).toContain('references/guide.md')
    expect(output).toContain('Call again without dry_run')
    await expect(readdir(root)).resolves.toEqual([])
  })

  it('should exclude SKILL.md from the default file set', async () => {
    const server = setup()
    const output = (await server.tool?.execute({ skill_name: 'demo', dry_run: true })) as string
    expect(output).not.toContain('SKILL.md')
    expect(output).toContain('2 file(s) would be staged')
  })

  it('should reject an unknown skill before touching the filesystem', async () => {
    const server = setup()
    await expect(server.tool?.execute({ skill_name: 'missing', dry_run: true })).rejects.toThrow('not found')
    await expect(readdir(root)).resolves.toEqual([])
  })

  it('should reject paths the skill does not declare', async () => {
    const server = setup()
    await expect(
      server.tool?.execute({ skill_name: 'demo', file_paths: ['../../etc/passwd'], dry_run: true }),
    ).rejects.toThrow('Unknown paths')
    await expect(readdir(root)).resolves.toEqual([])
  })

  it('should reject a declared path that is not a stageable reference', async () => {
    const server = new FakeServer()
    const indexes = buildIndexes(createRegistry([{ name: 'odd', files: ['SKILL.md', 'package.json'] }]))
    registerPrepareTool(server as unknown as FastMCP, () => indexes)

    await expect(
      server.tool?.execute({ skill_name: 'odd', file_paths: ['package.json'], dry_run: true }),
    ).rejects.toThrow('unsafe paths')
  })
})
