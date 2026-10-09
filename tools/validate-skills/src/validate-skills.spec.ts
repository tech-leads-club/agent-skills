import { execFileSync, spawnSync } from 'child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'fs'
import { getEncoding } from 'js-tiktoken'
import { tmpdir } from 'os'
import { dirname, join, resolve } from 'path'
import { parse as parseYaml } from 'yaml'

import { run } from './cli'
import { reviewUrls } from './urls'
import { validateSkill, type Check } from './validate'

const REPO_ROOT = resolve(__dirname, '../../..')
const CATALOG = join(REPO_ROOT, 'packages/skills-catalog/skills')
const TSX = join(REPO_ROOT, 'node_modules/.bin/tsx')
const ENTRY = join(REPO_ROOT, 'tools/validate-skills/src/index.ts')
const cl100k = getEncoding('cl100k_base')

const DESCRIPTION = 'Does a thing. Use when the user says do the thing. Do NOT use for other things.'

function skillMd({
  name = 'alpha',
  frontmatter = '',
  body = '# Alpha\n\nExample: run it. If it fails, retry.\n',
} = {}) {
  return `---\nname: ${name}\ndescription: ${DESCRIPTION}\nmetadata:\n  version: 1.0.0\n  author: tester\n${frontmatter}---\n${body}`
}

function tempDir(): string {
  return realpathSync(mkdtempSync(join(tmpdir(), 'validate-skills-')))
}

/** Writes files under `root`; keys are paths relative to it. */
function writeFiles(root: string, files: Record<string, string | Buffer>) {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), content)
  }
}

function makeSkill(files: Record<string, string | Buffer>, name = 'alpha'): string {
  const dir = join(tempDir(), 'cat', name)
  writeFiles(dir, files)
  return dir
}

const failed = (checks: Check[], name: string) => checks.filter((c) => c.name === name && !c.passed)
const named = (checks: Check[], prefix: string) => checks.filter((c) => c.name.startsWith(prefix))

function git(cwd: string, ...args: string[]) {
  return execFileSync('git', args, { cwd, encoding: 'utf-8' }).trim()
}

/** A git repo whose `skills/` tree is committed as the base; returns the repo and the base sha. */
function repoWithBase(files: Record<string, string | Buffer>): { repo: string; base: string } {
  const repo = tempDir()
  git(repo, 'init', '-q')
  git(repo, 'config', 'user.email', 'test@example.com')
  git(repo, 'config', 'user.name', 'test')
  git(repo, 'config', 'commit.gpgsign', 'false')
  writeFiles(repo, files)
  git(repo, 'add', '-A')
  git(repo, 'commit', '-q', '-m', 'base')
  return { repo, base: git(repo, 'rev-parse', 'HEAD') }
}

/** Runs the validator from `cwd` and returns the exit code and output lines. */
function runIn(cwd: string, argv: string[], env: NodeJS.ProcessEnv = {}): { code: number; lines: string[] } {
  const lines: string[] = []
  const previous = process.cwd()
  process.chdir(cwd)
  try {
    const code = run({ argv, env, write: (line) => lines.push(...line.split('\n')) })
    return { code, lines }
  } finally {
    process.chdir(previous)
  }
}

/** Paths of every full report in the output. */
const reportedPaths = (lines: string[]) =>
  lines.filter((l) => l.startsWith('  Path: ')).map((l) => l.replace('  Path: ', ''))
const annotationLines = (lines: string[]) => lines.filter((l) => l.startsWith('::'))

/** Validates one skill folder as a changed skill against `baseFiles` committed in a temp repo. */
function reviewChanged(baseFiles: Record<string, string>, nowFiles: Record<string, string | Buffer>): Check[] {
  const { repo, base } = repoWithBase(
    Object.fromEntries(Object.entries(baseFiles).map(([p, c]) => [`skills/c/alpha/${p}`, c])),
  )
  writeFiles(join(repo, 'skills/c/alpha'), nowFiles)
  const { lines } = runIn(repo, ['--batch', 'skills', '--base', base], { GITHUB_ACTIONS: 'true' })
  return annotationLines(lines).map((l) => {
    const [, severity, file, line, name, message] = l.match(/^::(\w+) file=([^,]+),line=(\d+),title=([^:]+)::(.*)$/)!
    return { name, severity: severity as Check['severity'], file, line: Number(line), message, passed: false }
  })
}

describe('Link Integrity', () => {
  it('C1: links resolving from the skill root or from the containing file pass', () => {
    const dir = makeSkill({
      'SKILL.md': skillMd({ body: 'See [a](references/a.md) and [img](./assets/x.png).\n' }),
      'references/a.md':
        'Root-relative [b](references/b.md), file-relative [c](b.md#section), [d](references/b.md#x).\n',
      'references/b.md': '# B\n',
      'assets/x.png': 'png',
    })
    const { checks } = validateSkill(dir)
    expect(failed(checks, 'link_broken')).toEqual([])
    expect(failed(checks, 'link_escapes_skill')).toEqual([])
    expect(checks.find((c) => c.name === 'links_resolve')).toMatchObject({
      passed: true,
      message: 'All 5 relative links resolve',
    })
  })

  it('C1: tlc-implement references/checklist-format.md -> references/test-policy.md passes (spec root resolution)', () => {
    const tlc = join(CATALOG, '(development)/tlc-implement')
    expect(readFileSync(join(tlc, 'references/checklist-format.md'), 'utf-8')).toContain('](references/test-policy.md)')
    expect(failed(validateSkill(tlc).checks, 'link_broken')).toEqual([])
  })

  it('C2: a link missing by both paths is link_broken (error) citing file, line and target, and exits 1', () => {
    const dir = makeSkill({
      'SKILL.md': skillMd({ body: 'Intro\n\n[gone](missing.md)\n' }),
      'references/r.md': 'line one\n[gone too](../assets/a.yaml)\n',
    })
    const broken = failed(validateSkill(dir).checks, 'link_broken')
    expect(broken).toHaveLength(2)
    const skillMdLine = skillMd({ body: 'Intro\n\n[gone](missing.md)\n' }).split('\n').indexOf('[gone](missing.md)') + 1
    expect(broken[0]).toMatchObject({ severity: 'error', file: 'SKILL.md', line: skillMdLine })
    expect(broken[0].message).toBe(`SKILL.md:${skillMdLine} links to missing missing.md`)
    expect(broken[1]).toMatchObject({ severity: 'error', file: 'references/r.md', line: 2 })
    expect(broken[1].message).toBe('references/r.md:2 links to missing ../assets/a.yaml')

    const cli = spawnSync(TSX, [ENTRY, dir], { encoding: 'utf-8' })
    expect(cli.status).toBe(1)
    expect(cli.stdout).toContain('❌ link_broken: SKILL.md:')
  })

  it('C2: a link leaving the skill to no catalog skill, or to a missing file in one, is link_broken', () => {
    const root = tempDir()
    const body =
      '[typo](../core-web-vitls/SKILL.md)\n[deep](../../../nowhere.md)\n[gone](../core-web-vitals/missing.md)\n'
    writeFiles(root, {
      'skills/(quality)/seo/SKILL.md': skillMd({ name: 'seo', body }),
      'skills/(performance)/core-web-vitals/SKILL.md': skillMd({ name: 'core-web-vitals' }),
    })
    const { checks } = validateSkill(join(root, 'skills/(quality)/seo'))
    expect(failed(checks, 'link_broken').map((c) => c.message.split(' links to missing ')[1])).toEqual([
      '../core-web-vitls/SKILL.md',
      '../../../nowhere.md',
      '../core-web-vitals/missing.md',
    ])
    expect(failed(checks, 'link_escapes_skill')).toEqual([])
    expect(runIn(root, ['--batch', 'skills']).code).toBe(1)
  })

  it('C3: a link leaving the skill is link_escapes_skill (warning) citing origin, line and target; exit code stays 0', () => {
    const root = tempDir()
    writeFiles(root, {
      'skills/(quality)/seo/SKILL.md': skillMd({ name: 'seo', body: 'One\n[cwv](../core-web-vitals/SKILL.md)\n' }),
      'skills/(performance)/core-web-vitals/SKILL.md': skillMd({ name: 'core-web-vitals' }),
    })
    const { checks } = validateSkill(join(root, 'skills/(quality)/seo'))
    const escapes = failed(checks, 'link_escapes_skill')
    const line =
      skillMd({ name: 'seo', body: 'One\n[cwv](../core-web-vitals/SKILL.md)\n' })
        .split('\n')
        .indexOf('[cwv](../core-web-vitals/SKILL.md)') + 1
    expect(escapes).toEqual([
      expect.objectContaining({
        severity: 'warning',
        file: 'SKILL.md',
        line,
        message: `SKILL.md:${line} links outside the skill: ../core-web-vitals/SKILL.md`,
      }),
    ])
    expect(failed(checks, 'link_broken')).toEqual([])
    expect(runIn(root, ['--batch', 'skills']).code).toBe(0)

    // the real catalog example from the task: seo -> ../core-web-vitals/SKILL.md
    const seo = failed(validateSkill(join(CATALOG, '(quality)/seo')).checks, 'link_escapes_skill')
    expect(seo.map((c) => c.message)).toContain('SKILL.md:23 links outside the skill: ../core-web-vitals/SKILL.md')
  })

  it('C4: anchors, mailto, http(s) and links inside fenced or inline code are not checked', () => {
    const body = [
      '[top](#section)',
      '[mail](mailto:someone@example.com)',
      '[web](http://docs.dev/missing.md)',
      '[tls](https://docs.dev/missing.md)',
      '```md',
      '[fenced](nope1.md)',
      '```',
      '~~~',
      '[tilde](nope2.md)',
      '~~~',
      'Inline `[code](nope3.md)` here.',
      '',
    ].join('\n')
    const { checks } = validateSkill(makeSkill({ 'SKILL.md': skillMd({ body }) }))
    expect(named(checks, 'link_')).toEqual([])
    expect(checks.find((c) => c.name === 'links_resolve')?.message).toBe('All 0 relative links resolve')
  })

  it('C5: the real catalog passes with no link_broken, and the dead links are plain text', () => {
    const { code, lines } = runIn(REPO_ROOT, ['--batch', 'packages/skills-catalog/skills'])
    expect(code).toBe(0)
    expect(lines.filter((l) => l.includes('link_broken'))).toEqual([])

    const read = (p: string) => readFileSync(join(CATALOG, p), 'utf-8')
    const render = read('(cloud)/render-deploy/SKILL.md')
    const details = read('(cloud)/render-deploy/references/deployment-details.md')
    expect(render).toContain('Template examples: assets/')
    expect(render).not.toContain('](assets/)')
    for (const yaml of ['node-express', 'nextjs-postgres', 'python-django', 'static-site', 'go-api', 'docker']) {
      expect(details).toContain(`../assets/${yaml}.yaml`)
      expect(details).not.toContain(`](../assets/${yaml}.yaml)`)
    }
    expect(read('(cloud)/cloudflare-deploy/references/durable-objects/README.md')).not.toContain(
      '](../websockets/README.md)',
    )
    const tunnel = read('(cloud)/cloudflare-deploy/references/tunnel/README.md')
    expect(tunnel).not.toContain('](../access/)')
    expect(tunnel).not.toContain('](../warp/)')
    expect(tunnel).toMatch(/^- access - /m)
    expect(tunnel).toMatch(/^- warp - /m)
  })
})

describe('Frontmatter Spec', () => {
  it('C6: a top-level field outside the spec is frontmatter_unknown_field (warning) naming it', () => {
    const dir = makeSkill({
      'SKILL.md': skillMd({ frontmatter: 'source: https://x.dev\ndisable-model-invocation: true\n' }),
    })
    const unknown = failed(validateSkill(dir).checks, 'frontmatter_unknown_field')
    expect(unknown.map((c) => c.severity)).toEqual(['warning', 'warning'])
    expect(unknown[0].message).toContain("'source'")
    expect(unknown[1].message).toContain("'disable-model-invocation'")

    const spec = makeSkill({
      'SKILL.md': skillMd({ frontmatter: 'license: MIT\ncompatibility: node 22\nallowed-tools: Read\n' }),
    })
    expect(failed(validateSkill(spec).checks, 'frontmatter_unknown_field')).toEqual([])

    const real = (p: string) => failed(validateSkill(join(CATALOG, p)).checks, 'frontmatter_unknown_field')
    expect(real('(design)/frontend-design')[0].message).toContain("'source'")
    expect(real('(development)/spec-driven-eval')[0].message).toContain("'disable-model-invocation'")
  })

  it('C7: compatibility over 500 chars is compatibility_length (warning) with the length; 500 passes', () => {
    const at = (n: number) =>
      validateSkill(makeSkill({ 'SKILL.md': skillMd({ frontmatter: `compatibility: ${'a'.repeat(n)}\n` }) })).checks
    expect(failed(at(500), 'compatibility_length')).toEqual([])
    const over = failed(at(501), 'compatibility_length')
    expect(over).toHaveLength(1)
    expect(over[0].severity).toBe('warning')
    expect(over[0].message).toContain('501')
  })

  it('C8: a metadata value that is not a string or has < > is metadata_format (warning) with the key', () => {
    const fm = 'metadata:\n  version: 1.0.0\n  author: tester\n  count: 3\n  argument-hint: <file>\n  ok: plain\n'
    const content = `---\nname: alpha\ndescription: ${DESCRIPTION}\n${fm}---\n# A\n`
    const bad = failed(validateSkill(makeSkill({ 'SKILL.md': content })).checks, 'metadata_format')
    expect(bad.map((c) => c.severity)).toEqual(['warning', 'warning'])
    expect(bad[0].message).toContain('metadata.count')
    expect(bad[1].message).toContain('metadata.argument-hint')

    const real = failed(validateSkill(join(CATALOG, '(design)/web-design-guidelines')).checks, 'metadata_format')
    expect(real.map((c) => c.message).join()).toContain('metadata.argument-hint')
  })

  it('C9: a name with -- is name_consecutive_hyphens (warning)', () => {
    const hyphens = failed(
      validateSkill(makeSkill({ 'SKILL.md': skillMd({ name: 'al--pha' }) }, 'al--pha')).checks,
      'name_consecutive_hyphens',
    )
    expect(hyphens).toHaveLength(1)
    expect(hyphens[0].severity).toBe('warning')
    expect(
      failed(
        validateSkill(makeSkill({ 'SKILL.md': skillMd({ name: 'al-pha' }) }, 'al-pha')).checks,
        'name_consecutive_hyphens',
      ),
    ).toEqual([])
  })
})

describe('Token Budget', () => {
  it('C10: every report carries token_budget: N tokens, N = cl100k_base over the whole SKILL.md', () => {
    const content = skillMd({ body: '# Alpha\n\nHello world, this is a skill body.\n' })
    const dir = makeSkill({ 'SKILL.md': content })
    const expected = cl100k.encode(content).length
    expect(expected).toBeGreaterThan(cl100k.encode('# Alpha\n\nHello world, this is a skill body.\n').length)

    const results = validateSkill(dir)
    expect(results.checks.find((c) => c.name === 'token_budget')).toMatchObject({
      passed: true,
      message: `${expected} tokens`,
    })
    const { lines } = runIn(dirname(dirname(dir)), [join('cat', 'alpha')])
    expect(lines).toContain(`  ✅ token_budget: ${expected} tokens`)

    const badYaml = '---\nname: [unclosed\n---\n# Body\n'
    const yamlChecks = validateSkill(makeSkill({ 'SKILL.md': badYaml })).checks
    expect(failed(yamlChecks, 'frontmatter_valid_yaml')).toHaveLength(1)
    expect(yamlChecks.find((c) => c.name === 'token_budget')?.message).toBe(`${cl100k.encode(badYaml).length} tokens`)
  })

  it('C11: over 5000 tokens is a token_budget warning with N/5000 tokens — move detail to references/; 5000 passes', () => {
    const withTokens = (target: number) => {
      const head = skillMd({ body: '' })
      let content = head + ' hello'.repeat(target - cl100k.encode(head).length)
      while (cl100k.encode(content).length > target) content = content.slice(0, -6)
      while (cl100k.encode(content).length < target) content += ' hello'
      expect(cl100k.encode(content).length).toBe(target)
      return validateSkill(makeSkill({ 'SKILL.md': content })).checks.find((c) => c.name === 'token_budget')
    }
    expect(withTokens(5000)).toMatchObject({ passed: true, message: '5000 tokens' })
    expect(withTokens(5001)).toMatchObject({
      passed: false,
      severity: 'warning',
      message: '5001/5000 tokens — move detail to references/',
    })
  })
})

describe('Changed Skill Report', () => {
  const clean = (name: string) => skillMd({ name })

  it('C12: changed skills (modified, untracked, absent from base) get the full report with passes and warnings', () => {
    const { repo, base } = repoWithBase({
      'skills/c/alpha/SKILL.md': clean('alpha'),
      'skills/c/beta/SKILL.md': clean('beta'),
      'skills/c/delta/SKILL.md': clean('delta'),
    })
    writeFiles(repo, {
      'skills/c/alpha/SKILL.md': `${clean('alpha')}more\n`,
      'skills/c/alpha/README.md': 'for humans\n',
      'skills/c/delta/references/new.md': 'new\n',
      'skills/c/gamma/SKILL.md': clean('gamma'),
    })

    const { code, lines } = runIn(repo, ['--batch', 'skills', '--base', base])
    expect(code).toBe(0)
    expect(reportedPaths(lines).sort()).toEqual(['skills/c/alpha', 'skills/c/delta', 'skills/c/gamma'])
    const alphaReport = lines.slice(lines.indexOf('  Path: skills/c/alpha'))
    expect(alphaReport).toContain('  ✅ folder_exists: Skill folder exists')
    expect(alphaReport.some((l) => l.startsWith('  ⚠️ no_readme: README.md found'))).toBe(true)
    const deltaReport = lines.slice(lines.indexOf('  Path: skills/c/delta'))
    expect(deltaReport).toContain('  ⚠️ ref_linked_new.md: references/new.md exists but is not referenced in SKILL.md')

    // CI shape: the changes are commits after the base, the working tree is clean
    git(repo, 'add', '-A')
    git(repo, 'commit', '-q', '-m', 'pr')
    const committed = runIn(repo, ['--batch', 'skills', '--base', base])
    expect(reportedPaths(committed.lines).sort()).toEqual(['skills/c/alpha', 'skills/c/delta', 'skills/c/gamma'])
  })

  it('C13: each failed check of a changed skill is a ::error/::warning with repo file, line (or 1) and title', () => {
    const { repo, base } = repoWithBase({ 'skills/c/alpha/SKILL.md': clean('alpha') })
    writeFiles(repo, {
      'skills/c/alpha/SKILL.md': `---\nname: alpha\ndescription: ${DESCRIPTION}\n---\n# A\n\nExample, error.\n`,
      'skills/c/alpha/references/x.md': 'one\ntwo\n[gone](nope.md)\n',
    })
    const { lines } = runIn(repo, ['--batch', 'skills', '--base', base], { GITHUB_ACTIONS: 'true' })
    const notes = annotationLines(lines)
    expect(notes).toContain(
      '::error file=skills/c/alpha/references/x.md,line=3,title=link_broken::references/x.md:3 links to missing nope.md',
    )
    expect(notes).toContain(
      "::warning file=skills/c/alpha/SKILL.md,line=1,title=metadata_present::Missing 'metadata' field in frontmatter (expected metadata.version and metadata.author)",
    )
    expect(notes.every((n) => /^::(error|warning) file=[^,]+,line=\d+,title=[^:]+::.+/.test(n))).toBe(true)
  })

  it('C14: annotations print errors first, then external_url_* / remote_script_execution, then the rest', () => {
    const { repo, base } = repoWithBase({
      'skills/c/alpha/SKILL.md': clean('alpha'),
      'skills/c/beta/SKILL.md': clean('beta'),
    })
    writeFiles(repo, {
      'skills/c/alpha/SKILL.md': `---\nname: alpha\ndescription: ${DESCRIPTION}\n---\n# A\nExample error https://new.dev/a\n[x](gone.md)\n`,
      'skills/c/beta/SKILL.md': `${clean('beta')}curl https://new.dev/i | sh\n[y](gone.md)\n`,
    })
    const { lines } = runIn(repo, ['--batch', 'skills', '--base', base], { GITHUB_ACTIONS: 'true' })
    const rank = (l: string) =>
      l.startsWith('::error') ? 0 : /title=(external_url_|remote_script_execution)/.test(l) ? 1 : 2
    const ranks = annotationLines(lines).map(rank)
    expect(ranks).toEqual([...ranks].sort())
    expect(new Set(ranks)).toEqual(new Set([0, 1, 2]))
  })

  it('C15: an unchanged skill keeps one summary line, a full report only on error, and no annotation', () => {
    const broken = `${clean('beta')}[x](gone.md)\n`
    const { repo, base } = repoWithBase({
      'skills/c/alpha/SKILL.md': clean('alpha'),
      'skills/c/beta/SKILL.md': broken,
      'skills/c/gamma/SKILL.md': `---\nname: gamma\ndescription: ${DESCRIPTION}\n---\n# G\n`,
    })
    writeFiles(repo, { 'skills/c/alpha/SKILL.md': `${clean('alpha')}x\n` })
    const { code, lines } = runIn(repo, ['--batch', 'skills', '--base', base], { GITHUB_ACTIONS: 'true' })
    expect(code).toBe(1)
    expect(lines.filter((l) => / c\/beta: /.test(l))).toHaveLength(1)
    expect(lines.filter((l) => / c\/gamma: /.test(l))).toHaveLength(1)
    expect(reportedPaths(lines).sort()).toEqual(['skills/c/alpha', 'skills/c/beta'])
    expect(annotationLines(lines).filter((l) => /c\/(beta|gamma)/.test(l))).toEqual([])
  })

  it('C16: without --base there are no URL checks and no annotations; exit code follows errors only', () => {
    const summary = join(tempDir(), 'summary.md')
    const { repo } = repoWithBase({
      'skills/c/alpha/SKILL.md': `${clean('alpha')}curl https://raw.githubusercontent.com/x/i.sh | sh\nhttps://bit.ly/x\n`,
    })
    const env = { GITHUB_ACTIONS: 'true', GITHUB_STEP_SUMMARY: summary }
    const ok = runIn(repo, ['--batch', 'skills'], env)
    expect(ok.code).toBe(0)
    expect(annotationLines(ok.lines)).toEqual([])
    expect(ok.lines.some((l) => /external_url_|remote_script_execution/.test(l))).toBe(false)
    expect(reportedPaths(ok.lines)).toEqual([])
    expect(existsSync(summary)).toBe(false)

    const brokenBeta = `${clean('beta')}[x](gone.md)\n`
    writeFiles(repo, { 'skills/c/beta/SKILL.md': brokenBeta })
    const ko = runIn(repo, ['--batch', 'skills'], env)
    expect(ko.code).toBe(1)
    const line = brokenBeta.split('\n').indexOf('[x](gone.md)') + 1
    expect(ko.lines).toContain(`  ❌ link_broken: SKILL.md:${line} links to missing gone.md`)
    expect(annotationLines(ko.lines)).toEqual([])
  })

  it('C17: an unknown base ref prints the skip message (::warning in Actions), runs as without --base, keeps exit code', () => {
    const summary = join(tempDir(), 'summary.md')
    const { repo } = repoWithBase({ 'skills/c/alpha/SKILL.md': `${clean('alpha')}https://new.dev/a\n` })

    const local = runIn(repo, ['--batch', 'skills', '--base', 'no-such-ref'])
    expect(local.code).toBe(0)
    expect(local.lines[0]).toBe('base ref no-such-ref not found — diff checks skipped')

    const actions = runIn(repo, ['--batch', 'skills', '--base', 'no-such-ref'], {
      GITHUB_ACTIONS: 'true',
      GITHUB_STEP_SUMMARY: summary,
    })
    expect(actions.code).toBe(0)
    expect(annotationLines(actions.lines)).toEqual(['::warning::base ref no-such-ref not found — diff checks skipped'])
    expect(reportedPaths(actions.lines)).toEqual([])
    expect(existsSync(summary)).toBe(false)

    const notRepo = tempDir()
    writeFiles(notRepo, { 'skills/c/alpha/SKILL.md': `${clean('alpha')}[x](gone.md)\n` })
    const outside = runIn(notRepo, ['--batch', 'skills', '--base', 'main'])
    expect(outside.lines[0]).toBe('base ref main not found — diff checks skipped')
    expect(outside.code).toBe(1)
  })

  it('C18: CI Checks passes NX_BASE as base after nx-set-shas; merge queue and main push do not; the action adds --base only when set', () => {
    const workflow = parseYaml(readFileSync(join(REPO_ROOT, '.github/workflows/release.yml'), 'utf-8'))
    type Step = { name?: string; uses?: string; with?: Record<string, string> }
    const steps = (job: string): Step[] => workflow.jobs[job].steps
    const validate = (job: string) => steps(job).find((s) => s.uses === './.github/actions/validate-skills')

    const ci = steps('ci')
    expect(workflow.jobs.ci.name).toBe('CI Checks')
    const shas = ci.findIndex((s) => s.uses?.startsWith('nrwl/nx-set-shas@'))
    expect(shas).toBeGreaterThanOrEqual(0)
    expect(ci.indexOf(validate('ci')!)).toBeGreaterThan(shas)
    expect(validate('ci')!.with).toEqual({ base: '${{ env.NX_BASE }}' })
    expect(validate('security-scan-merge-queue')!.with).toBeUndefined()
    expect(validate('security-scan')!.with).toBeUndefined()
    expect(validate('snapshot')).toBeUndefined()

    const action = parseYaml(readFileSync(join(REPO_ROOT, '.github/actions/validate-skills/action.yml'), 'utf-8'))
    expect(action.inputs.base).toMatchObject({ required: false, default: '' })
    const script: string = action.runs.steps[0].run
    expect(script).toContain('npx tsx tools/validate-skills/src/index.ts --batch packages/skills-catalog/skills')
    const argsFor = (base: string) =>
      execFileSync('bash', ['-c', script.replace('npx tsx', "printf '%s\\n'")], {
        env: { ...process.env, BASE_REF: base },
        encoding: 'utf-8',
      })
        .trim()
        .split('\n')
    expect(argsFor('')).toEqual(['tools/validate-skills/src/index.ts', '--batch', 'packages/skills-catalog/skills'])
    expect(argsFor('abc123')).toEqual([
      'tools/validate-skills/src/index.ts',
      '--batch',
      'packages/skills-catalog/skills',
      '--base',
      'abc123',
    ])
  })

  it('C19: the job summary gets ## Skill validation with one table per changed skill holding every failed check', () => {
    const { repo, base } = repoWithBase({
      'skills/c/alpha/SKILL.md': clean('alpha'),
      'skills/c/beta/SKILL.md': clean('beta'),
    })
    const sixtyBroken = Array.from({ length: 60 }, (_, i) => `[l${i}](gone${i}.md)`).join('\n')
    writeFiles(repo, {
      'skills/c/alpha/SKILL.md': `${clean('alpha')}${sixtyBroken}\n`,
      'skills/c/gamma/SKILL.md': clean('gamma'),
    })
    const summary = join(tempDir(), 'summary.md')
    writeFileSync(summary, 'previous step\n')

    runIn(repo, ['--batch', 'skills', '--base', base], { GITHUB_ACTIONS: 'true', GITHUB_STEP_SUMMARY: summary })
    const text = readFileSync(summary, 'utf-8')
    expect(text.startsWith('previous step\n## Skill validation\n')).toBe(true)
    expect(text).toContain('### c/alpha\n\n| Check | Severity | Location | Message |\n| --- | --- | --- | --- |\n')
    expect(
      text.match(
        /^\| link_broken \| error \| skills\/c\/alpha\/SKILL\.md:\d+ \| SKILL\.md:\d+ links to missing gone\d+\.md \|$/gm,
      ),
    ).toHaveLength(60)
    expect(text).toContain('### c/gamma')
    expect(text).not.toContain('### c/beta')

    git(repo, 'add', '-A')
    git(repo, 'commit', '-q', '-m', 'everything')
    const empty = join(tempDir(), 'summary.md')
    runIn(repo, ['--batch', 'skills', '--base', 'HEAD'], { GITHUB_STEP_SUMMARY: empty })
    expect(readFileSync(empty, 'utf-8')).toBe('## Skill validation\n\nNo changed skills\n\n')
  })

  it('C20: without GITHUB_STEP_SUMMARY or without --base nothing is written and the output is unchanged', () => {
    const { repo, base } = repoWithBase({ 'skills/c/alpha/SKILL.md': clean('alpha') })
    writeFiles(repo, { 'skills/c/alpha/SKILL.md': `${clean('alpha')}[x](gone.md)\n` })
    const summary = join(tempDir(), 'summary.md')
    writeFileSync(summary, 'seed\n')

    const noBase = runIn(repo, ['--batch', 'skills'], { GITHUB_STEP_SUMMARY: summary })
    expect(readFileSync(summary, 'utf-8')).toBe('seed\n')
    expect(noBase.lines).toEqual(runIn(repo, ['--batch', 'skills']).lines)

    const withSummary = runIn(repo, ['--batch', 'skills', '--base', base], {
      GITHUB_ACTIONS: 'true',
      GITHUB_STEP_SUMMARY: summary,
    })
    const withoutSummary = runIn(repo, ['--batch', 'skills', '--base', base], { GITHUB_ACTIONS: 'true' })
    expect(withoutSummary.lines).toEqual(withSummary.lines)
  })
})

describe('External URL Review', () => {
  it('C21: a domain absent from the skill at base is one external_url_new_domain per domain at its first occurrence', () => {
    const checks = reviewChanged(
      { 'SKILL.md': skillMd(), 'references/old.md': 'https://docs.known.dev/a\n' },
      {
        'SKILL.md': skillMd({ body: '# A\nhttps://docs.known.dev/b\n' }),
        'references/a.md': 'x\ny\nsee https://new.dev/one and https://other.dev/z\n',
        'references/b.md': 'https://new.dev/two\n',
        'bin/blob.dat': Buffer.from('https://binary.dev/\0'),
      },
    )
    const fresh = checks.filter((c) => c.name === 'external_url_new_domain')
    expect(fresh).toEqual([
      expect.objectContaining({
        severity: 'warning',
        file: 'skills/c/alpha/references/a.md',
        line: 3,
        message: expect.stringContaining('new.dev'),
      }),
      expect.objectContaining({
        severity: 'warning',
        file: 'skills/c/alpha/references/a.md',
        line: 3,
        message: expect.stringContaining('other.dev'),
      }),
    ])

    const { repo, base } = repoWithBase({ 'skills/c/beta/SKILL.md': skillMd({ name: 'beta' }) })
    writeFiles(repo, {
      'skills/c/alpha/SKILL.md': skillMd({ body: '# A\nhttps://one.dev https://two.dev https://one.dev/x\n' }),
    })
    const { lines } = runIn(repo, ['--batch', 'skills', '--base', base], { GITHUB_ACTIONS: 'true' })
    expect(annotationLines(lines).filter((l) => l.includes('title=external_url_new_domain'))).toHaveLength(2)
  })

  it('C22: placeholder hosts never produce a URL check', () => {
    const hosts = [
      'https://example.com/a',
      'https://docs.example.org/a',
      'http://example.net',
      'http://localhost:3000/x',
      'http://127.0.0.1:8080',
      'https://api.foo.test/x',
      'https://a.invalid',
      'https://b.example/x',
      'https://c.localhost',
    ]
    const checks = reviewChanged(
      { 'SKILL.md': skillMd() },
      { 'SKILL.md': skillMd({ body: `${hosts.join('\n')}\nhttps://notexample.com\n` }) },
    )
    const url = checks.filter((c) => c.name.startsWith('external_url_'))
    expect(url).toHaveLength(1)
    expect(url[0].message).toContain('notexample.com')
  })

  it('C23: raw content hosts are external_url_raw_content (warning) with the URL, even for base domains', () => {
    const urls = [
      'https://raw.githubusercontent.com/o/r/main/i.sh',
      'https://gist.github.com/u/abc',
      'https://gist.githubusercontent.com/u/abc/raw/x',
      'https://pastebin.com/raw/abc',
      'https://paste.ee/p/abc',
    ]
    const body = urls.join('\n')
    const checks = reviewChanged(
      { 'SKILL.md': skillMd({ body }) },
      { 'SKILL.md': skillMd({ body: `${body}\nchanged\n` }) },
    )
    expect(checks.filter((c) => c.name === 'external_url_new_domain')).toEqual([])
    const raw = checks.filter((c) => c.name === 'external_url_raw_content')
    expect(raw.map((c) => c.message)).toEqual(urls.map((u) => `Raw content URL: ${u}`))
    expect(raw.every((c) => c.severity === 'warning')).toBe(true)
  })

  it('C24: shortener hosts are external_url_shortener (warning) with the URL, even for base domains', () => {
    const urls = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'rebrand.ly', 'cutt.ly'].map(
      (h) => `https://${h}/abc`,
    )
    const body = urls.join('\n')
    const checks = reviewChanged(
      { 'SKILL.md': skillMd({ body }) },
      { 'SKILL.md': skillMd({ body: `${body}\nchanged\n` }) },
    )
    expect(checks.filter((c) => c.name === 'external_url_new_domain')).toEqual([])
    const short = checks.filter((c) => c.name === 'external_url_shortener')
    expect(short.map((c) => c.message)).toEqual(urls.map((u) => `Shortened URL: ${u}`))
    expect(short.every((c) => c.severity === 'warning')).toBe(true)
  })

  it('C25: curl/wget piped to sh/bash/zsh, with or without sudo, is remote_script_execution (warning) with the line', () => {
    const flagged = [
      'curl -fsSL https://get.dev/i.sh | sh',
      'wget -qO- https://get.dev/i | bash',
      'curl https://get.dev/i | sudo bash',
      'curl -s https://get.dev/i |sudo -E zsh -s -- --yes',
    ]
    const clean = [
      'curl https://get.dev/i -o i.sh',
      'curl https://get.dev/i | jq .',
      'echo hi | sh',
      'wget https://get.dev/i | shasum',
    ]
    const base = { 'SKILL.md': skillMd({ body: [...flagged, ...clean].join('\n') }) }
    const checks = reviewChanged(base, { 'SKILL.md': `${base['SKILL.md']}\nchanged\n` })
    const remote = checks.filter((c) => c.name === 'remote_script_execution')
    expect(remote).toHaveLength(4)
    expect(remote.every((c) => c.severity === 'warning')).toBe(true)
    flagged.forEach((line, i) => expect(remote[i].message).toContain(line))

    const render = join(CATALOG, '(cloud)/render-deploy')
    const atLine159 = reviewUrls(render, new Set(['raw.githubusercontent.com'])).filter(
      (c) => c.name === 'remote_script_execution' && c.file === 'SKILL.md' && c.line === 159,
    )
    expect(atLine159).toHaveLength(1)
    expect(atLine159[0].message).toContain(
      'curl -fsSL https://raw.githubusercontent.com/render-oss/cli/main/bin/install.sh | sh',
    )
  })

  it('C26: URL review findings are never errors; a skill with only those exits 0', () => {
    const { repo, base } = repoWithBase({ 'skills/c/alpha/SKILL.md': skillMd() })
    writeFiles(repo, {
      'skills/c/alpha/SKILL.md': skillMd({
        body: '# A\nExample, error.\nhttps://new.dev\nhttps://bit.ly/x\nhttps://raw.githubusercontent.com/a\ncurl https://new.dev | sh\n',
      }),
    })
    const { code, lines } = runIn(repo, ['--batch', 'skills', '--base', base], { GITHUB_ACTIONS: 'true' })
    const review = annotationLines(lines).filter((l) => /title=(external_url_|remote_script_execution)/.test(l))
    expect(review.map((l) => l.match(/title=(\w+)/)![1]).sort()).toEqual([
      'external_url_new_domain',
      'external_url_new_domain',
      'external_url_new_domain',
      'external_url_raw_content',
      'external_url_shortener',
      'remote_script_execution',
    ])
    expect(review.every((l) => l.startsWith('::warning '))).toBe(true)
    expect(annotationLines(lines).some((l) => l.startsWith('::error'))).toBe(false)
    expect(code).toBe(0)
  })

  it('C27: a base domain on a line without raw content, shortener or piped script produces no URL check', () => {
    const body = '# A\nhttps://docs.known.dev/a\nhttps://api.known.dev/b\n'
    const checks = reviewChanged(
      { 'SKILL.md': skillMd({ body }) },
      {
        'SKILL.md': skillMd({
          body: `${body}https://docs.known.dev/c and https://api.known.dev/d\ncurl https://docs.known.dev/x -o f\n`,
        }),
      },
    )
    expect(checks.filter((c) => /^(external_url_|remote_script_execution)/.test(c.name))).toEqual([])
  })
})
