import { SKILLS_CATALOG_DIR } from './index'

describe('core library', () => {
  it('should export SKILLS_CATALOG_DIR', () => {
    expect(SKILLS_CATALOG_DIR).toBeDefined()
    expect(SKILLS_CATALOG_DIR).toBe('packages/skills-catalog/skills')
  })
})
