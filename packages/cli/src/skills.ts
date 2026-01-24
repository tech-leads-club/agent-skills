import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { SkillInfo } from './types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function getSkillsDirectory(): string {
  const devSkillsDir = join(__dirname, '..', '..', '..', 'skills')
  if (existsSync(devSkillsDir)) return devSkillsDir
  const pkgSkillsDir = join(__dirname, '..', 'skills')
  if (existsSync(pkgSkillsDir)) return pkgSkillsDir
  throw new Error(`Skills directory not found. Checked: ${devSkillsDir}, ${pkgSkillsDir}`)
}

export function discoverSkills(): SkillInfo[] {
  const skillsDir = getSkillsDirectory()
  const skills: SkillInfo[] = []
  if (!existsSync(skillsDir)) return skills
  const entries = readdirSync(skillsDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const skillMdPath = join(skillsDir, entry.name, 'SKILL.md')
    if (!existsSync(skillMdPath)) continue
    const content = readFileSync(skillMdPath, 'utf-8')
    const { name, description } = parseSkillFrontmatter(content)

    skills.push({
      name: name || entry.name,
      description: description || 'No description',
      path: join(skillsDir, entry.name),
    })
  }

  return skills
}

function parseSkillFrontmatter(content: string): { name?: string; description?: string } {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) return {}
  const frontmatter = frontmatterMatch[1]
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m)
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m)
  return { name: nameMatch?.[1]?.trim(), description: descMatch?.[1]?.trim() }
}

export function getSkillByName(name: string): SkillInfo | undefined {
  const skills = discoverSkills()
  return skills.find((s) => s.name === name)
}
