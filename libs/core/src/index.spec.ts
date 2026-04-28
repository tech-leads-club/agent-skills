import {
  addSkillToLock,
  AGENTS_DIR,
  AUDIT_LOG_FILE,
  categoryExists,
  categoryIdToFolderName,
  createNodeAdapters,
  detectInstalledAgents,
  detectMode,
  extractCategoryId,
  getAgentConfig,
  getAllAgentTypes,
  getAllLockedSkills,
  getAuditLogPath,
  getCacheDir,
  getCategories,
  getCategoryById,
  getSkillCategory,
  getSkillCategoryId,
  getSkillFromLock,
  groupSkillsByCategory,
  installSkills,
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
  saveCategoryMetadata,
  SKILLS_CATALOG_DIR,
  writeSkillLock,
  type AgentType,
  type CorePorts,
  type InstallOptions,
  type PathsPort,
} from './index'

import * as core from './index'

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

  it('exports representative root APIs across modules', () => {
    expect(createNodeAdapters).toBeDefined()
    expect(installSkills).toBeDefined()
    expect(detectMode).toBeDefined()
    expect(getCacheDir).toBeDefined()
  })

  it('does not leak internal helpers through the root barrel', () => {
    expect('buildUrls' in core).toBe(false)
    expect('createSymlink' in core).toBe(false)
  })

  it('exports representative types and ports at compile time', () => {
    // This test validates that types are exported - TypeScript will fail at compile time if any are missing
    const agent: AgentType = 'cursor'
    const options: InstallOptions = {
      agents: [agent],
      global: false,
      method: 'copy',
      skills: [],
    }
    const ports = {} as CorePorts
    
    // Runtime validation that the types work correctly
    expect(agent).toBe('cursor')
    expect(options.method).toBe('copy')
    expect(options.global).toBe(false)
    expect(options.skills).toEqual([])
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
    expect(getCategoryById).toBeDefined()
    expect(groupSkillsByCategory).toBeDefined()
    expect(getSkillCategoryId).toBeDefined()
    expect(getSkillCategory).toBeDefined()
    expect(saveCategoryMetadata).toBeDefined()
    expect(categoryExists).toBeDefined()
  })
})
