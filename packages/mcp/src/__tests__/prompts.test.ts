import { buildSkillPromptMessages, registerPrompts } from '../prompts'
import type { SkillEntry } from '../types'
import { buildPromptDescription, buildPromptName } from '../utils'

describe('buildPromptName', () => {
  it('uses the skill name directly', () => {
    expect(buildPromptName('docs-writer')).toBe('docs-writer')
  })

  it('handles single-word skill names', () => {
    expect(buildPromptName('sentry')).toBe('sentry')
  })

  it('handles long kebab-case names', () => {
    expect(buildPromptName('react-composition-patterns')).toBe('react-composition-patterns')
  })
})

describe('buildPromptDescription', () => {
  it('returns text before "Use when" clause', () => {
    const desc =
      'React composition patterns that scale. Use when refactoring components with boolean prop proliferation.'
    expect(buildPromptDescription(desc)).toBe('React composition patterns that scale.')
  })

  it('returns the first sentence when no "Use when" clause exists', () => {
    const desc = 'Expert AWS Cloud Advisor for architecture design. Leverages AWS MCP tools.'
    expect(buildPromptDescription(desc)).toBe('Expert AWS Cloud Advisor for architecture design.')
  })

  it('returns the full description when it is a single sentence without "Use when"', () => {
    const desc = 'A very simple skill'
    expect(buildPromptDescription(desc)).toBe('A very simple skill')
  })

  it('truncates descriptions longer than 160 characters', () => {
    const desc = 'A'.repeat(200)
    const result = buildPromptDescription(desc)
    expect(result.length).toBe(160)
    expect(result.endsWith('…')).toBe(true)
  })

  it('does NOT truncate descriptions at exactly 160 characters', () => {
    const desc = 'B'.repeat(160)
    const result = buildPromptDescription(desc)
    expect(result.length).toBe(160)
    expect(result.endsWith('…')).toBe(false)
  })

  it('trims whitespace around the extracted description', () => {
    const desc = '  Trim me.  Use when doing stuff.'
    expect(buildPromptDescription(desc)).toBe('Trim me.')
  })
})

describe('buildSkillPromptMessages', () => {
  const skill: SkillEntry = {
    name: 'docs-writer',
    description: 'Write documentation following best practices.',
    category: 'documentation',
    path: 'skills/docs-writer',
    files: ['SKILL.md'],
    contentHash: 'abc123',
  }

  it('returns a message instructing to call read_skill', () => {
    const result = buildSkillPromptMessages(skill)
    expect(result.messages).toHaveLength(1)
    expect(result.messages[0].role).toBe('user')
    expect(result.messages[0].content.type).toBe('text')
    expect(result.messages[0].content.text).toContain('read_skill')
    expect(result.messages[0].content.text).toContain('docs-writer')
  })

  it('includes context when provided', () => {
    const result = buildSkillPromptMessages(skill, 'write a README for my project')
    expect(result.messages[0].content.text).toContain('write a README for my project')
    expect(result.messages[0].content.text).toContain('Apply the skill to accomplish')
  })

  it('does NOT include "Apply" line when context is undefined', () => {
    const result = buildSkillPromptMessages(skill)
    expect(result.messages[0].content.text).not.toContain('Apply the skill to accomplish')
  })

  it('does NOT include "Apply" line when context is empty string', () => {
    const result = buildSkillPromptMessages(skill, '')
    expect(result.messages[0].content.text).not.toContain('Apply the skill to accomplish')
  })
})

describe('registerPrompts', () => {
  it('handles missing args when loading a skill prompt', async () => {
    const promptDefs: Array<{ name: string; load: (args?: { context?: string }) => Promise<unknown> }> = []
    const server = {
      addPrompt: (prompt: { name: string; load: (args?: { context?: string }) => Promise<unknown> }) => {
        promptDefs.push(prompt)
      },
    }

    const skill: SkillEntry = {
      name: 'component-flattening-analysis',
      description: 'Analyze component flattening opportunities.',
      category: 'frontend',
      path: 'skills/component-flattening-analysis',
      files: ['SKILL.md'],
      contentHash: 'def456',
    }

    registerPrompts(server as never, () => ({ fuse: {} as never, map: new Map([[skill.name, skill]]) }))

    const prompt = promptDefs.find((entry) => entry.name === 'component-flattening-analysis')
    expect(prompt).toBeDefined()

    await expect(prompt?.load(undefined)).resolves.toEqual(
      buildSkillPromptMessages(skill),
    )
  })
})
