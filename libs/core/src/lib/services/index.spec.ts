import { describe, expect, it } from '@jest/globals'

import {
  addSkillToLock,
  categoryExists,
  categoryIdToFolderName,
  clearCache,
  clearRegistryCache,
  clearSkillCache,
  detectInstalledAgents,
  detectMode,
  discoverCategories,
  discoverCategoriesAsync,
  discoverSkills,
  discoverSkillsAsync,
  downloadSkill,
  ensureSkillAvailable,
  ensureSkillDownloaded,
  extractCategoryId,
  fetchRegistry,
  findProjectRoot,
  forceDownloadSkill,
  getAgentConfig,
  getAllAgentTypes,
  getAllLockedSkills,
  getAuditLogPath,
  getCachedContentHash,
  getCacheDir,
  getCanonicalPath,
  getCategories,
  getCategoryById,
  getDeprecatedMap,
  getDeprecatedSkills,
  getInstallPath,
  getNpmGlobalRoot,
  getRemoteCategories,
  getRemoteSkills,
  getSkillByName,
  getSkillByNameAsync,
  getSkillCachePath,
  getSkillCategory,
  getSkillCategoryId,
  getSkillFromLock,
  getSkillMetadata,
  getSkillsDirectory,
  getSkillWithPath,
  getUpdatableSkills,
  groupSkillsByCategory,
  installSkills,
  isCategoryFolder,
  isGloballyInstalled,
  isSkillCached,
  isSkillInstalled,
  listInstalledSkills,
  loadCategoryMetadata,
  logAudit,
  needsUpdate,
  parseInline,
  parseMarkdown,
  readAuditLog,
  readSkillLock,
  removeSkill,
  removeSkillFromLock,
  saveCategoryMetadata,
  stripFrontmatter,
  writeSkillLock,
} from './index'

describe('services barrel', () => {
  it('re-exports every public service function', () => {
    expect(installSkills).toBeDefined()
    expect(removeSkill).toBeDefined()
    expect(listInstalledSkills).toBeDefined()
    expect(isSkillInstalled).toBeDefined()
    expect(getInstallPath).toBeDefined()
    expect(getCanonicalPath).toBeDefined()

    expect(readSkillLock).toBeDefined()
    expect(writeSkillLock).toBeDefined()
    expect(addSkillToLock).toBeDefined()
    expect(removeSkillFromLock).toBeDefined()
    expect(getSkillFromLock).toBeDefined()
    expect(getAllLockedSkills).toBeDefined()

    expect(fetchRegistry).toBeDefined()
    expect(downloadSkill).toBeDefined()
    expect(getRemoteSkills).toBeDefined()
    expect(getRemoteCategories).toBeDefined()
    expect(getSkillMetadata).toBeDefined()
    expect(getDeprecatedSkills).toBeDefined()
    expect(getDeprecatedMap).toBeDefined()
    expect(getUpdatableSkills).toBeDefined()
    expect(needsUpdate).toBeDefined()
    expect(getSkillCachePath).toBeDefined()
    expect(isSkillCached).toBeDefined()
    expect(getCachedContentHash).toBeDefined()
    expect(ensureSkillDownloaded).toBeDefined()
    expect(forceDownloadSkill).toBeDefined()
    expect(clearCache).toBeDefined()
    expect(clearSkillCache).toBeDefined()
    expect(clearRegistryCache).toBeDefined()
    expect(getCacheDir).toBeDefined()

    expect(detectInstalledAgents).toBeDefined()
    expect(getAgentConfig).toBeDefined()
    expect(getAllAgentTypes).toBeDefined()

    expect(detectMode).toBeDefined()
    expect(getSkillsDirectory).toBeDefined()
    expect(discoverSkills).toBeDefined()
    expect(discoverSkillsAsync).toBeDefined()
    expect(discoverCategories).toBeDefined()
    expect(discoverCategoriesAsync).toBeDefined()
    expect(getSkillByName).toBeDefined()
    expect(getSkillByNameAsync).toBeDefined()
    expect(ensureSkillAvailable).toBeDefined()
    expect(getSkillWithPath).toBeDefined()

    expect(extractCategoryId).toBeDefined()
    expect(isCategoryFolder).toBeDefined()
    expect(categoryIdToFolderName).toBeDefined()
    expect(loadCategoryMetadata).toBeDefined()
    expect(saveCategoryMetadata).toBeDefined()
    expect(getCategories).toBeDefined()
    expect(getCategoryById).toBeDefined()
    expect(getSkillCategoryId).toBeDefined()
    expect(getSkillCategory).toBeDefined()
    expect(categoryExists).toBeDefined()
    expect(groupSkillsByCategory).toBeDefined()

    expect(getAuditLogPath).toBeDefined()
    expect(logAudit).toBeDefined()
    expect(readAuditLog).toBeDefined()

    expect(findProjectRoot).toBeDefined()
    expect(getNpmGlobalRoot).toBeDefined()
    expect(isGloballyInstalled).toBeDefined()
    expect(stripFrontmatter).toBeDefined()
    expect(parseMarkdown).toBeDefined()
    expect(parseInline).toBeDefined()
  })
})
