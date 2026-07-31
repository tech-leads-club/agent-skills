import { mkdtemp, readFile, readdir, rm, stat, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { getSkillStagingDir, getStagingRoot, pruneSupersededRevisions, stageSkillFiles } from '../staging'

const HASH_A = 'aaaaaaaaaaaabbbbbbbbbbbbcccccccccccc'
const HASH_B = 'ffffffffffffeeeeeeeeeeeedddddddddddd'

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
    expect(getSkillStagingDir('demo', HASH_A)).toBe(join(root, 'demo', HASH_A.slice(0, 12)))
  })

  it('should write files under the revision directory and return absolute paths', async () => {
    const staged = await stageSkillFiles(
      'demo',
      HASH_A,
      new Map([
        ['scripts/render.mjs', 'console.log("hi")'],
        ['references/guide.md', '# Guide'],
      ]),
    )

    const dir = getSkillStagingDir('demo', HASH_A)
    expect(staged.get('scripts/render.mjs')).toEqual({ path: join(dir, 'scripts', 'render.mjs'), written: true })
    await expect(readFile(join(dir, 'scripts', 'render.mjs'), 'utf8')).resolves.toBe('console.log("hi")')
    await expect(readFile(join(dir, 'references', 'guide.md'), 'utf8')).resolves.toBe('# Guide')
  })

  it('should create nested directories', async () => {
    await stageSkillFiles('demo', HASH_A, new Map([['scripts/nested/deep/tool.py', 'print(1)']]))
    const dir = getSkillStagingDir('demo', HASH_A)
    await expect(readFile(join(dir, 'scripts', 'nested', 'deep', 'tool.py'), 'utf8')).resolves.toBe('print(1)')
  })

  // invariant: destructiveHint: false depends on this — a new revision must not replace the old
  it('should keep a previous revision intact when a new one is staged', async () => {
    await stageSkillFiles('demo', HASH_A, new Map([['scripts/run.mjs', 'v1']]))
    await stageSkillFiles('demo', HASH_B, new Map([['scripts/run.mjs', 'v2']]))

    await expect(readFile(join(getSkillStagingDir('demo', HASH_A), 'scripts', 'run.mjs'), 'utf8')).resolves.toBe('v1')
    await expect(readFile(join(getSkillStagingDir('demo', HASH_B), 'scripts', 'run.mjs'), 'utf8')).resolves.toBe('v2')
    await expect(readdir(join(root, 'demo'))).resolves.toHaveLength(2)
  })

  // invariant: idempotentHint: true depends on this — repeating the call must be a no-op
  it('should leave an identical file untouched on a repeated call', async () => {
    const files = new Map([['scripts/run.mjs', 'same bytes']])
    const first = await stageSkillFiles('demo', HASH_A, files)
    expect(first.get('scripts/run.mjs')?.written).toBe(true)

    const target = join(getSkillStagingDir('demo', HASH_A), 'scripts', 'run.mjs')
    const before = await stat(target)

    const second = await stageSkillFiles('demo', HASH_A, files)
    expect(second.get('scripts/run.mjs')?.written).toBe(false)
    const after = await stat(target)
    expect(after.mtimeMs).toBe(before.mtimeMs)
  })

  it('should restore a staged file that no longer matches the verified content', async () => {
    const files = new Map([['scripts/run.mjs', 'verified']])
    await stageSkillFiles('demo', HASH_A, files)
    const target = join(getSkillStagingDir('demo', HASH_A), 'scripts', 'run.mjs')
    await writeFile(target, 'tampered', 'utf8')

    const again = await stageSkillFiles('demo', HASH_A, files)
    expect(again.get('scripts/run.mjs')?.written).toBe(true)
    await expect(readFile(target, 'utf8')).resolves.toBe('verified')
  })

  // hazard: second gate after isSafeStagingPath — a write must never land outside the skill dir
  it('should refuse to write outside the revision directory', async () => {
    await expect(stageSkillFiles('demo', HASH_A, new Map([['../escaped.sh', 'evil']]))).rejects.toThrow(
      'resolves outside the skill directory',
    )
    await expect(stat(join(root, 'escaped.sh'))).rejects.toThrow()
  })

  it('should not mark staged files executable', async () => {
    await stageSkillFiles('demo', HASH_A, new Map([['scripts/render.mjs', 'x']]))
    const info = await stat(join(getSkillStagingDir('demo', HASH_A), 'scripts', 'render.mjs'))
    const executeBits = info.mode & 0o111
    expect(executeBits).toBe(0)
  })
})

describe('pruneSupersededRevisions', () => {
  let root: string
  const previous = process.env.SKILLS_STAGING_DIR

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'prune-test-'))
    process.env.SKILLS_STAGING_DIR = root
  })

  afterEach(async () => {
    if (previous === undefined) delete process.env.SKILLS_STAGING_DIR
    else process.env.SKILLS_STAGING_DIR = previous
    await rm(root, { recursive: true, force: true })
  })

  const age = async (dir: string, ms: number) => {
    const when = new Date(Date.now() - ms)
    await utimes(dir, when, when)
  }

  it('should remove a superseded revision once it is stale', async () => {
    await stageSkillFiles('demo', HASH_A, new Map([['scripts/run.mjs', 'old']]))
    await stageSkillFiles('demo', HASH_B, new Map([['scripts/run.mjs', 'new']]))
    await age(getSkillStagingDir('demo', HASH_A), 2 * 60 * 60 * 1000)

    const removed = await pruneSupersededRevisions('demo', HASH_B)

    expect(removed).toEqual([HASH_A.slice(0, 12)])
    await expect(readdir(join(root, 'demo'))).resolves.toEqual([HASH_B.slice(0, 12)])
  })

  // hazard: a script from the previous revision may still be executing
  it('should keep a recently used revision', async () => {
    await stageSkillFiles('demo', HASH_A, new Map([['scripts/run.mjs', 'old']]))
    await stageSkillFiles('demo', HASH_B, new Map([['scripts/run.mjs', 'new']]))

    const removed = await pruneSupersededRevisions('demo', HASH_B)

    expect(removed).toEqual([])
    await expect(readdir(join(root, 'demo'))).resolves.toHaveLength(2)
  })

  it('should never remove the current revision', async () => {
    await stageSkillFiles('demo', HASH_A, new Map([['scripts/run.mjs', 'current']]))
    await age(getSkillStagingDir('demo', HASH_A), 30 * 24 * 60 * 60 * 1000)

    const removed = await pruneSupersededRevisions('demo', HASH_A)

    expect(removed).toEqual([])
    await expect(readFile(join(getSkillStagingDir('demo', HASH_A), 'scripts', 'run.mjs'), 'utf8')).resolves.toBe(
      'current',
    )
  })

  it('should not touch other skills', async () => {
    await stageSkillFiles('other', HASH_A, new Map([['scripts/run.mjs', 'keep']]))
    await age(getSkillStagingDir('other', HASH_A), 2 * 60 * 60 * 1000)

    await pruneSupersededRevisions('demo', HASH_B)

    await expect(readFile(join(getSkillStagingDir('other', HASH_A), 'scripts', 'run.mjs'), 'utf8')).resolves.toBe(
      'keep',
    )
  })

  it('should be a no-op when the skill was never staged', async () => {
    await expect(pruneSupersededRevisions('never-staged', HASH_A)).resolves.toEqual([])
  })
})
