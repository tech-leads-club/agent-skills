import { buildCatalogPromptMessages, buildSkillPromptMessages, buildUsePromptNotFoundMessages, registerPrompts } from '../prompts'
import type { SkillEntry } from '../types'

describe('buildCatalogPromptMessages', () => {
  it('returns search-first instructions for catalog discovery', () => {
    const result = buildCatalogPromptMessages('refactor a large React component')
    expect(result.messages).toHaveLength(1)
    expect(result.messages[0].content.text).toContain('search_skills')
    expect(result.messages[0].content.text).toContain('read_skill')
    expect(result.messages[0].content.text).toContain('refactor a large React component')
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

describe('buildUsePromptNotFoundMessages', () => {
  it('returns fallback instructions when skill name does not exist', () => {
    const result = buildUsePromptNotFoundMessages('missing-skill')
    expect(result.messages).toHaveLength(1)
    expect(result.messages[0].content.text).toContain('"missing-skill"')
    expect(result.messages[0].content.text).toContain('search_skills')
  })
})

describe('registerPrompts', () => {
  it('registers simple entrypoint prompts and handles missing args', async () => {
    const promptDefs: Array<{ name: string; load: (args?: { name?: string; context?: string; task?: string }) => Promise<unknown> }> = []
    const server = {
      addPrompt: (
        prompt: { name: string; load: (args?: { name?: string; context?: string; task?: string }) => Promise<unknown> },
      ) => {
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

    expect(promptDefs.map((entry) => entry.name)).toEqual(expect.arrayContaining(['skills', 'find-skill', 'use', 'skills-help']))

    const usePrompt = promptDefs.find((entry) => entry.name === 'use')
    expect(usePrompt).toBeDefined()
    await expect(usePrompt?.load({ name: skill.name, context: undefined })).resolves.toEqual(
      buildSkillPromptMessages(skill),
    )

    await expect(usePrompt?.load(undefined)).resolves.toEqual(buildUsePromptNotFoundMessages(undefined))
  })
})
