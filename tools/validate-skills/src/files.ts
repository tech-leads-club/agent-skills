import { readdirSync, statSync } from 'fs'
import { join, relative, sep } from 'path'

/** Every file under the skill folder, relative to it with `/` separators, SKILL.md first then sorted. */
export function listSkillFiles(skillPath: string): string[] {
  const files: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else files.push(relative(skillPath, full).split(sep).join('/'))
    }
  }
  walk(skillPath)
  return files.sort((a, b) => (a === 'SKILL.md' ? -1 : b === 'SKILL.md' ? 1 : a.localeCompare(b)))
}

/** A file is text when it has no NUL byte. */
export const isText = (content: Buffer) => !content.includes(0)
