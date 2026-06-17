import { buildListSkillsResponse } from '../core/list'
import { ListSkillsParamsSchema } from '../list-tool'
import { createSkillEntry } from './helpers'

describe('list_skills parameters schema', () => {
  it('should require explicit_request=true', () => {
    expect(() => ListSkillsParamsSchema.parse({ description_max_chars: 120 })).toThrow()
    expect(() => ListSkillsParamsSchema.parse({ explicit_request: false, description_max_chars: 120 })).toThrow()
    expect(() => ListSkillsParamsSchema.parse({ explicit_request: true, description_max_chars: 120 })).not.toThrow()
  })

  it('should apply default description_max_chars', () => {
    const parsed = ListSkillsParamsSchema.parse({ explicit_request: true })
    expect(parsed.description_max_chars).toBe(120)
  })
})

describe('buildListSkillsResponse', () => {
  it('should group and sort skills by category', () => {
    const output = buildListSkillsResponse(
      [
        createSkill({ name: 'zeta', category: 'quality' }),
        createSkill({ name: 'alpha', category: 'quality' }),
        createSkill({ name: 'beta', category: 'development' }),
      ],
      120,
    )

    expect(output.total_skills).toBe(3)
    expect(output.total_categories).toBe(2)
    expect(output.categories.map((c) => c.category)).toEqual(['development', 'quality'])
    expect(output.categories[1].skills.map((s) => s.name)).toEqual(['alpha', 'zeta'])
  })

  it('should truncate descriptions to max chars', () => {
    const longDescription =
      'This is a long description that should be truncated to avoid large payloads and keep token usage efficient.'
    const output = buildListSkillsResponse([createSkill({ description: longDescription })], 50)
    const description = output.categories[0].skills[0].description
    expect(description.length).toBeLessThanOrEqual(50)
    expect(description.endsWith('...')).toBe(true)
  })

  it('should keep only the first sentence when it fits max chars', () => {
    const description = 'First sentence for quick summary. Second sentence should not be included.'
    const output = buildListSkillsResponse([createSkill({ description })], 120)
    const listed = output.categories[0].skills[0].description
    expect(listed).toBe('First sentence for quick summary.')
  })

  it('should not split on dot-prefixed paths like .notebook', () => {
    const description = 'Use this to document in .notebook and keep findings tracked. Then continue with details.'
    const output = buildListSkillsResponse([createSkill({ description })], 160)
    const listed = output.categories[0].skills[0].description
    expect(listed).toBe('Use this to document in .notebook and keep findings tracked.')
  })

  it('should not split on decimal values', () => {
    const description = 'Supports version 1.2 for compatibility checks. Additional details come after.'
    const output = buildListSkillsResponse([createSkill({ description })], 160)
    const listed = output.categories[0].skills[0].description
    expect(listed).toBe('Supports version 1.2 for compatibility checks.')
  })
})

function createSkill(overrides: Parameters<typeof createSkillEntry>[0] = {}) {
  return createSkillEntry(overrides)
}
