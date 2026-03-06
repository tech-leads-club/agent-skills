import {
  AGENTS_DIR,
  AUDIT_LOG_FILE,
  LOCK_FILE,
  MAX_CONCURRENT_DOWNLOADS,
  PACKAGE_NAME,
  REGISTRY_CACHE_TTL_MS,
  SKILLS_CATALOG_DIR,
  parseInline,
  parseMarkdown,
  sanitizeName,
} from './index'

describe('core library', () => {
  it('exports the catalog path constants', () => {
    expect(SKILLS_CATALOG_DIR).toBeDefined()
    expect(SKILLS_CATALOG_DIR).toBe('packages/skills-catalog/skills')
  })

  it('exports the migrated core constants', () => {
    expect(PACKAGE_NAME).toBe('@tech-leads-club/agent-skills')
    expect(AGENTS_DIR).toBe('.agents')
    expect(LOCK_FILE).toBe('.skill-lock.json')
    expect(AUDIT_LOG_FILE).toBe('audit.log')
    expect(REGISTRY_CACHE_TTL_MS).toBe(24 * 60 * 60 * 1000)
    expect(MAX_CONCURRENT_DOWNLOADS).toBe(10)
  })

  it('exports the migrated utility helpers', () => {
    expect(sanitizeName('../demo-skill')).toBe('demo-skill')
    expect(parseMarkdown('# Title')).toEqual([{ type: 'heading', level: 1, text: 'Title' }])
    expect(parseInline('`code`')).toEqual([{ text: 'code', code: true }])
  })
})
