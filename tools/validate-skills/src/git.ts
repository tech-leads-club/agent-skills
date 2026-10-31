import { spawnSync } from 'child_process'

import { isText } from './files'
import { domainsIn } from './urls'

function git(cwd: string, args: string[]): { ok: boolean; stdout: Buffer } {
  const result = spawnSync('git', ['-c', 'core.quotepath=off', ...args], {
    cwd,
    env: { ...process.env, GIT_LITERAL_PATHSPECS: '1' },
    maxBuffer: 256 * 1024 * 1024,
  })
  return { ok: result.status === 0, stdout: result.stdout ?? Buffer.alloc(0) }
}

const nulSeparated = (out: Buffer) => out.toString('utf-8').split('\0').filter(Boolean)

export function repoRoot(cwd: string): string | undefined {
  const { ok, stdout } = git(cwd, ['rev-parse', '--show-toplevel'])
  return ok ? stdout.toString('utf-8').trim() : undefined
}

export function refExists(root: string, ref: string): boolean {
  return git(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]).ok
}

/** Repo-relative paths under `dir` that differ between `ref` and the working tree, untracked files included. */
export function changedPaths(root: string, ref: string, dir: string): string[] {
  const tracked = git(root, ['diff', '--name-only', '-z', ref, '--', dir])
  const untracked = git(root, ['ls-files', '--others', '--exclude-standard', '-z', '--', dir])
  return [...nulSeparated(tracked.stdout), ...nulSeparated(untracked.stdout)]
}

/** External domains in the text files under the repo-relative `dir` at `ref`. */
export function domainsAtRef(root: string, ref: string, dir: string): Set<string> {
  const files = nulSeparated(git(root, ['ls-tree', '-r', '-z', '--name-only', ref, '--', dir]).stdout)
  const contents: string[] = []
  for (const file of files) {
    const { ok, stdout } = git(root, ['show', `${ref}:${file}`])
    if (ok && isText(stdout)) contents.push(stdout.toString('utf-8'))
  }
  return domainsIn(contents)
}
