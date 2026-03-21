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
  getCacheDir,
  getCachedContentHash,
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
  getSkillWithPath,
  getSkillWithPathForced,
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

type Fn = (...args: never[]) => unknown
type IsPromise<T> = T extends Promise<unknown> ? true : false
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Assert<T extends true> = T
type PromiseShape<TFunctions extends Record<string, Fn>> = {
  [K in keyof TFunctions]: IsPromise<ReturnType<TFunctions[K]>>
}

const coreApiSurface = {
  installSkills,
  removeSkill,
  listInstalledSkills,
  isSkillInstalled,
  getInstallPath,
  getCanonicalPath,
  readSkillLock,
  writeSkillLock,
  addSkillToLock,
  removeSkillFromLock,
  getSkillFromLock,
  getAllLockedSkills,
  fetchRegistry,
  downloadSkill,
  getRemoteSkills,
  getRemoteCategories,
  getSkillMetadata,
  getDeprecatedSkills,
  getDeprecatedMap,
  getUpdatableSkills,
  needsUpdate,
  getSkillCachePath,
  isSkillCached,
  getCachedContentHash,
  ensureSkillDownloaded,
  forceDownloadSkill,
  clearCache,
  clearSkillCache,
  clearRegistryCache,
  getCacheDir,
  detectInstalledAgents,
  getAgentConfig,
  getAllAgentTypes,
  discoverSkills,
  discoverSkillsAsync,
  discoverCategories,
  discoverCategoriesAsync,
  getSkillByName,
  getSkillByNameAsync,
  ensureSkillAvailable,
  getSkillWithPath,
  getSkillWithPathForced,
  detectMode,
  getCategories,
  getCategoryById,
  getSkillCategoryId,
  getSkillCategory,
  groupSkillsByCategory,
  loadCategoryMetadata,
  saveCategoryMetadata,
  categoryExists,
  extractCategoryId,
  isCategoryFolder,
  categoryIdToFolderName,
  logAudit,
  readAuditLog,
  getAuditLogPath,
  findProjectRoot,
  getNpmGlobalRoot,
  isGloballyInstalled,
  parseMarkdown,
  parseInline,
  stripFrontmatter,
} satisfies Record<string, Fn>

type ExpectedPromiseShape = {
  installSkills: true
  removeSkill: true
  listInstalledSkills: true
  isSkillInstalled: true
  getInstallPath: false
  getCanonicalPath: false
  readSkillLock: true
  writeSkillLock: true
  addSkillToLock: true
  removeSkillFromLock: true
  getSkillFromLock: true
  getAllLockedSkills: true
  fetchRegistry: true
  downloadSkill: true
  getRemoteSkills: true
  getRemoteCategories: true
  getSkillMetadata: true
  getDeprecatedSkills: true
  getDeprecatedMap: true
  getUpdatableSkills: true
  needsUpdate: true
  getSkillCachePath: false
  isSkillCached: false
  getCachedContentHash: false
  ensureSkillDownloaded: true
  forceDownloadSkill: true
  clearCache: false
  clearSkillCache: false
  clearRegistryCache: false
  getCacheDir: false
  detectInstalledAgents: false
  getAgentConfig: false
  getAllAgentTypes: false
  discoverSkills: false
  discoverSkillsAsync: true
  discoverCategories: false
  discoverCategoriesAsync: true
  getSkillByName: false
  getSkillByNameAsync: true
  ensureSkillAvailable: true
  getSkillWithPath: true
  getSkillWithPathForced: true
  detectMode: false
  getCategories: false
  getCategoryById: false
  getSkillCategoryId: false
  getSkillCategory: false
  groupSkillsByCategory: false
  loadCategoryMetadata: false
  saveCategoryMetadata: false
  categoryExists: false
  extractCategoryId: false
  isCategoryFolder: false
  categoryIdToFolderName: false
  logAudit: true
  readAuditLog: true
  getAuditLogPath: false
  findProjectRoot: false
  getNpmGlobalRoot: false
  isGloballyInstalled: false
  parseMarkdown: false
  parseInline: false
  stripFrontmatter: false
}

// This type-level assertion ensures that the documented async/sync shape of the core API surface
// (ExpectedPromiseShape) stays in lockstep with the actual implementation in coreApiSurface.
type _ApiSurfaceParityChecks = Assert<Equal<PromiseShape<typeof coreApiSurface>, ExpectedPromiseShape>>

describe('core API surface', () => {
  it('exports every documented public function from the root barrel', () => {
    for (const exportedFunction of Object.values(coreApiSurface)) {
      expect(exportedFunction).toBeDefined()
    }
  })

  it('preserves the documented sync and async API shape', () => {
    expect(Object.keys(coreApiSurface)).toHaveLength(63)
  })
})
