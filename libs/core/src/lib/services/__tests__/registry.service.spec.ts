import { describe, expect, it } from '@jest/globals'

import { getCacheDir, getCachedContentHash, getSkillCachePath } from '../registry.service'

describe('registry cache path helpers', () => {
  it('returns the expected skill cache path format', () => {
    expect(getSkillCachePath('my-skill')).toBe('.cache/agent-skills/skills/my-skill')
  })

  it('returns the expected base cache directory', () => {
    expect(getCacheDir()).toBe('.cache/agent-skills')
  })

  it('returns undefined when no content hash was cached', () => {
    expect(getCachedContentHash('unknown-skill')).toBeUndefined()
  })
})
