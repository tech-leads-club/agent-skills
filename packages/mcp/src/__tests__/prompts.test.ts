import type { Catalog } from '../catalog'
import { buildCatalogPromptMessages, buildSkillPromptMessages, buildUsePromptNotFoundMessages } from '../prompts'
import type { SkillEntry } from '../types'
import { connectInProcess } from './support/mcp-client'

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
  it('registers simple entrypoint prompts and answers unknown names with the fallback', async () => {
    const skill: SkillEntry = {
      name: 'component-flattening-analysis',
      description: 'Analyze component flattening opportunities.',
      category: 'frontend',
      path: 'skills/component-flattening-analysis',
      files: ['SKILL.md'],
      contentHash: 'def456',
    }
    const unused = async (): Promise<never> => {
      throw new Error('not used by prompts')
    }
    const catalog: Catalog = {
      warm: () => undefined,
      close: () => undefined,
      get: async (name) => (name === skill.name ? skill : undefined),
      list: unused,
      search: unused,
      registry: unused,
      read: unused,
    }
    const client = await connectInProcess(catalog)

    const listed = await client.rpc('prompts/list')
    const names = (listed.result?.prompts as Array<{ name: string }>).map((entry) => entry.name)
    expect(names).toEqual(expect.arrayContaining(['skills', 'find-skill', 'use', 'skills-help']))

    const known = await client.rpc('prompts/get', { name: 'use', arguments: { name: skill.name } })
    expect(known.result?.messages).toBeDefined()
    expect(known.result?.messages).toEqual(buildSkillPromptMessages(skill).messages)

    const unknown = await client.rpc('prompts/get', { name: 'use', arguments: { name: 'absent-skill' } })
    expect(unknown.result?.messages).toEqual(buildUsePromptNotFoundMessages('absent-skill').messages)
  })
})
