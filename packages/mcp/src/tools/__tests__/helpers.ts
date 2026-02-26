import type { Registry, SkillEntry } from '../../types'

export function createSkillEntry(overrides: Partial<SkillEntry> = {}): SkillEntry {
  return {
    name: overrides.name ?? 'sample-skill',
    description: overrides.description ?? 'A sample skill for tests.',
    category: overrides.category ?? 'development',
    path: overrides.path ?? '(development)/sample-skill',
    files: overrides.files ?? ['SKILL.md'],
    contentHash: overrides.contentHash ?? 'hash',
    author: overrides.author,
    version: overrides.version,
  }
}

export function createRegistry(skills: Partial<SkillEntry>[]): Registry {
  return {
    version: '1.0.0',
    categories: {
      development: { name: 'Development', description: 'Dev skills' },
      cloud: { name: 'Cloud', description: 'Cloud skills' },
      quality: { name: 'Quality', description: 'Quality skills' },
      architecture: { name: 'Architecture', description: 'Architecture skills' },
      security: { name: 'Security', description: 'Security skills' },
    },
    skills: skills.map((skill) => createSkillEntry(skill)),
    deprecated: [],
  }
}
