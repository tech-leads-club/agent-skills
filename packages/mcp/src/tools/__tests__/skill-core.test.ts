import { MAX_REFERENCE_FILES_DISPLAY } from '../../constants'
import { buildReadSkillOutput, formatReferenceList, getMainSkillFile, getReferenceFiles } from '../core/skill'
import { createSkillEntry } from './helpers'

describe('skill-core', () => {
  it('should return SKILL.md as main file', () => {
    const skill = createSkillEntry({ files: ['SKILL.md', 'references/a.md'] })
    expect(getMainSkillFile(skill, 'demo')).toBe('SKILL.md')
  })

  it('should throw when SKILL.md does not exist', () => {
    const skill = createSkillEntry({ files: ['references/a.md'] })
    expect(() => getMainSkillFile(skill, 'demo')).toThrow("Skill 'demo' has no SKILL.md in files list")
  })

  it('should include only optional reference files', () => {
    const skill = createSkillEntry({
      files: ['SKILL.md', 'references/a.md', 'scripts/run.sh', 'assets/icon.svg', 'other.txt'],
    })
    expect(getReferenceFiles(skill)).toEqual(['references/a.md', 'scripts/run.sh', 'assets/icon.svg'])
  })

  it('should truncate reference list with omitted counter', () => {
    const refs = Array.from({ length: MAX_REFERENCE_FILES_DISPLAY + 2 }, (_, i) => `references/${i}.md`)
    const formatted = formatReferenceList(refs)

    expect(formatted).toContain('references/0.md')
    expect(formatted).toContain('(2 more files omitted)')
  })

  it('should return plain string when there are no references', () => {
    const output = buildReadSkillOutput('main content', [])
    expect(output).toBe('main content')
  })

  it('should return content blocks when references exist', () => {
    const output = buildReadSkillOutput('main content', ['references/a.md', 'scripts/run.sh'])
    expect(typeof output).toBe('object')
    if (typeof output === 'string') throw new Error('unexpected output shape')

    expect(output.content).toHaveLength(2)
    expect(output.content[0].text).toBe('main content')
    expect(output.content[1].text).toContain('references/a.md')
    expect(output.content[1].text).toContain('scripts/run.sh')
  })
})
