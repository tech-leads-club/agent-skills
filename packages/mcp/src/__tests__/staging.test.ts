import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { getSkillStagingDir, getStagingRoot, stageSkillFiles } from '../staging'

describe('staging', () => {
  let root: string
  const previous = process.env.SKILLS_STAGING_DIR

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'staging-test-'))
    process.env.SKILLS_STAGING_DIR = root
  })

  afterEach(async () => {
    if (previous === undefined) delete process.env.SKILLS_STAGING_DIR
    else process.env.SKILLS_STAGING_DIR = previous
    await rm(root, { recursive: true, force: true })
  })

  it('should honour the SKILLS_STAGING_DIR override', () => {
    expect(getStagingRoot()).toBe(root)
    expect(getSkillStagingDir('demo')).toBe(join(root, 'demo'))
  })

  it('should write files under the skill directory and return absolute paths', async () => {
    const staged = await stageSkillFiles(
      'demo',
      new Map([
        ['scripts/render.mjs', 'console.log("hi")'],
        ['references/guide.md', '# Guide'],
      ]),
    )

    expect(staged.get('scripts/render.mjs')).toBe(join(root, 'demo', 'scripts', 'render.mjs'))
    await expect(readFile(join(root, 'demo', 'scripts', 'render.mjs'), 'utf8')).resolves.toBe('console.log("hi")')
    await expect(readFile(join(root, 'demo', 'references', 'guide.md'), 'utf8')).resolves.toBe('# Guide')
  })

  it('should create nested directories', async () => {
    await stageSkillFiles('demo', new Map([['scripts/nested/deep/tool.py', 'print(1)']]))
    await expect(readFile(join(root, 'demo', 'scripts', 'nested', 'deep', 'tool.py'), 'utf8')).resolves.toBe('print(1)')
  })

  // hazard: second gate after isSafeStagingPath — a write must never land outside the skill dir
  it('should refuse to write outside the skill directory', async () => {
    await expect(stageSkillFiles('demo', new Map([['../escaped.sh', 'evil']]))).rejects.toThrow(
      'resolves outside the skill directory',
    )
    await expect(stat(join(root, 'escaped.sh'))).rejects.toThrow()
  })

  it('should not mark staged files executable', async () => {
    await stageSkillFiles('demo', new Map([['scripts/render.mjs', 'x']]))
    const info = await stat(join(root, 'demo', 'scripts', 'render.mjs'))
    const executeBits = info.mode & 0o111
    expect(executeBits).toBe(0)
  })
})
