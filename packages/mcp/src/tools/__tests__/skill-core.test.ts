import { MAX_REFERENCE_FILES_DISPLAY } from '../../constants'
import {
  buildReadSkillOutput,
  formatReferenceList,
  getMainSkillFile,
  getReferenceFiles,
  stripFrontmatter,
} from '../core/skill'
import { createSkillEntry } from './helpers'

describe('stripFrontmatter', () => {
  it('should remove the YAML frontmatter and keep the body', () => {
    const content = '---\nname: demo\ndescription: Does a thing. Use when asked.\n---\n\n# Demo\n\nBody text.'
    expect(stripFrontmatter(content)).toBe('# Demo\n\nBody text.')
  })

  it('should handle CRLF line endings', () => {
    const content = '---\r\nname: demo\r\n---\r\n\r\n# Demo\r\n'
    expect(stripFrontmatter(content)).toBe('# Demo\r\n')
  })

  it('should return content unchanged when there is no frontmatter', () => {
    const content = '# Demo\n\nBody text with --- a dash rule.'
    expect(stripFrontmatter(content)).toBe(content)
  })

  it('should not swallow a horizontal rule in the body', () => {
    const content = '---\nname: demo\n---\n\n# Demo\n\nFirst part.\n\n---\n\nSecond part.'
    const stripped = stripFrontmatter(content)
    expect(stripped).toBe('# Demo\n\nFirst part.\n\n---\n\nSecond part.')
    expect(stripped).toContain('Second part.')
  })

  it('should leave a body that only starts with an unclosed rule intact', () => {
    const content = '---\n\n# Demo\n\nBody.'
    expect(stripFrontmatter(content)).toBe(content)
  })
})

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
