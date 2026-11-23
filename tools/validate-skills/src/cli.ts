import { appendFileSync, readdirSync, realpathSync, statSync } from 'fs'
import { join, relative, sep } from 'path'

import { changedPaths, domainsAtRef, refExists, repoRoot } from './git'
import { annotations, findingsOf, printBatchSummary, printReport, skillLabel, stepSummary } from './report'
import { validateSkill, type ValidationResult } from './validate'

export interface RunOptions {
  argv: string[]
  env?: NodeJS.ProcessEnv
  write?: (line: string) => void
}

const DEFAULT_SKILLS_ROOT = 'packages/skills-catalog/skills'

interface Base {
  ref: string
  root: string
}

/** Runs the validator and returns the exit code. */
export function run({ argv, env = process.env, write = console.log }: RunOptions): number {
  const flag = (name: string) => {
    const index = argv.indexOf(name)
    return index === -1 ? undefined : argv[index + 1]
  }
  const batchDir = flag('--batch')
  const baseRef = flag('--base')
  const positional = argv.filter((arg, i) => !arg.startsWith('--') && !['--batch', '--base'].includes(argv[i - 1]))

  if (positional.length > 0 && !batchDir) {
    const results = validateSkill(positional[0])
    printReport(results, write)
    return results.failed === 0 ? 0 : 1
  }

  const skillsRoot = batchDir ?? DEFAULT_SKILLS_ROOT
  const base = baseRef === undefined ? undefined : resolveBase(baseRef, env, write)
  return validateBatch(skillsRoot, base, env, write) ? 0 : 1
}

function resolveBase(ref: string, env: NodeJS.ProcessEnv, write: (line: string) => void) {
  const root = repoRoot(process.cwd())
  if (root && refExists(root, ref)) return { ref, root }
  const message = `base ref ${ref} not found — diff checks skipped`
  write(env.GITHUB_ACTIONS === 'true' ? `::warning::${message}` : message)
  return undefined
}

function listSkills(skillsRoot: string): string[] {
  const skills: string[] = []
  for (const categoryDir of readdirSync(skillsRoot).sort()) {
    const categoryPath = join(skillsRoot, categoryDir)
    if (!statSync(categoryPath).isDirectory()) continue
    for (const skillDir of readdirSync(categoryPath).sort()) {
      const skillPath = join(categoryPath, skillDir)
      if (statSync(skillPath).isDirectory()) skills.push(skillPath)
    }
  }
  return skills
}

function validateBatch(
  skillsRoot: string,
  base: Base | undefined,
  env: NodeJS.ProcessEnv,
  write: (line: string) => void,
): boolean {
  const toRepoPath = (path: string) => relative(base!.root, realpathSync(path)).split(sep).join('/')
  const changedFiles = base ? changedPaths(base.root, base.ref, toRepoPath(skillsRoot)) : []
  const isChanged = (skillPath: string) => changedFiles.some((f) => f.startsWith(`${toRepoPath(skillPath)}/`))

  const allResults: ValidationResult[] = []
  const changed: ValidationResult[] = []
  for (const skillPath of listSkills(skillsRoot)) {
    if (base && isChanged(skillPath)) {
      const results = validateSkill(skillPath, {
        baseDomains: domainsAtRef(base.root, base.ref, toRepoPath(skillPath)),
      })
      changed.push(results)
      allResults.push(results)
    } else {
      allResults.push(validateSkill(skillPath))
    }
  }

  printBatchSummary(allResults, write)
  if (base) write(`  Changed skills since ${base.ref}: ${changed.length}\n`)

  for (const r of allResults) {
    if (changed.includes(r) || r.failed > 0) printReport(r, write)
  }

  if (base) {
    const perSkill = changed.map((r) => ({ label: skillLabel(r), findings: findingsOf(r, base.root) }))
    if (env.GITHUB_ACTIONS === 'true') {
      for (const line of annotations(perSkill.flatMap((s) => s.findings))) write(line)
    }
    if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `${stepSummary(perSkill)}\n`)
  }

  return allResults.every((r) => r.failed === 0)
}
