import {
  addSkillToLock,
  AGENTS_DIR,
  AUDIT_LOG_FILE,
  categoryIdToFolderName,
  detectInstalledAgents,
  extractCategoryId,
  getAgentConfig,
  getAllAgentTypes,
  getAllLockedSkills,
  getAuditLogPath,
  getCategories,
  getSkillFromLock,
  isCategoryFolder,
  loadCategoryMetadata,
  LOCK_FILE,
  logAudit,
  MAX_CONCURRENT_DOWNLOADS,
  PACKAGE_NAME,
  parseInline,
  parseMarkdown,
  readAuditLog,
  readSkillLock,
  REGISTRY_CACHE_TTL_MS,
  removeSkillFromLock,
  sanitizeName,
  SKILLS_CATALOG_DIR,
  writeSkillLock,
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

  it('exports the lockfile service functions', () => {
    expect(readSkillLock).toBeDefined()
    expect(writeSkillLock).toBeDefined()
    expect(addSkillToLock).toBeDefined()
    expect(removeSkillFromLock).toBeDefined()
    expect(getSkillFromLock).toBeDefined()
    expect(getAllLockedSkills).toBeDefined()
  })

  it('exports the audit log service functions', () => {
    expect(getAuditLogPath).toBeDefined()
    expect(logAudit).toBeDefined()
    expect(readAuditLog).toBeDefined()
  })

  it('exports the agents service functions', () => {
    expect(detectInstalledAgents).toBeDefined()
    expect(getAgentConfig).toBeDefined()
    expect(getAllAgentTypes).toBeDefined()
  })

  it('exports the categories service functions', () => {
    expect(extractCategoryId).toBeDefined()
    expect(isCategoryFolder).toBeDefined()
    expect(categoryIdToFolderName).toBeDefined()
    expect(loadCategoryMetadata).toBeDefined()
    expect(getCategories).toBeDefined()
  })
})
