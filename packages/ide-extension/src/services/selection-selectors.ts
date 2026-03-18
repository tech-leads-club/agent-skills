import type {
  AvailableAgent,
  InstalledSkillInfo,
  InstalledSkillsMap,
  LifecycleScope,
  Skill,
  SkillRegistry,
} from '../shared/types'

export interface CategoryOption {
  id: string
  label: string
}

export interface SelectableSkillsInput {
  action: 'install' | 'uninstall'
  registry: SkillRegistry
  installedSkills: InstalledSkillsMap
  allAgents?: AvailableAgent[]
  selectedAgents?: string[]
  scope: LifecycleScope | 'all'
}

export interface OutdatedSkillsInput {
  registry: SkillRegistry
  installedSkills: InstalledSkillsMap
  effectiveScopes: LifecycleScope[]
}

export function getCategoryOptions(registry: SkillRegistry): CategoryOption[] {
  const categories = Object.entries(registry.categories)
    .map(([id, category]) => ({ id, label: category.name }))
    .sort((left, right) => left.label.localeCompare(right.label))

  return [{ id: 'all', label: 'All categories' }, ...categories]
}

export function getSelectableSkills({
  action,
  registry,
  installedSkills,
  allAgents = [],
  selectedAgents = [],
  scope,
}: SelectableSkillsInput): Skill[] {
  const targetAgents =
    selectedAgents.length > 0 ? allAgents.filter((agent) => selectedAgents.includes(agent.agent)) : allAgents

  return registry.skills.filter((skill) => {
    const installed = installedSkills[skill.name]

    if (action === 'install') {
      return !isInstalledForAllAgents(installed, targetAgents, scope)
    }

    if (!installed || !isInstalledInScope(installed, scope)) {
      return false
    }

    if (selectedAgents.length === 0) {
      return true
    }

    return installed.agents.some(
      (agent) => selectedAgents.includes(agent.agent) && isAgentInstalledInScope(agent, scope),
    )
  })
}

export function getOutdatedSkills({ registry, installedSkills, effectiveScopes }: OutdatedSkillsInput): Skill[] {
  return registry.skills.filter((skill) => {
    const installed = installedSkills[skill.name]
    if (!installed || !skill.contentHash || !hasAllowedInstallation(installed, effectiveScopes)) {
      return false
    }

    return effectiveScopes.some((scope) => isScopeOutdated(installed, scope, skill.contentHash))
  })
}

export function isSkillInstalledForScope(installed: InstalledSkillsMap[string], scope: LifecycleScope | 'all'): boolean {
  if (!installed) {
    return false
  }

  if (scope === 'all') {
    return installed.local || installed.global
  }

  return isInstalledInScope(installed, scope)
}

function hasAllowedInstallation(installed: InstalledSkillInfo, effectiveScopes: LifecycleScope[]): boolean {
  return effectiveScopes.some((scope) => isInstalledInScope(installed, scope))
}

function isInstalledInScope(installed: InstalledSkillInfo, scope: LifecycleScope | 'all'): boolean {
  if (scope === 'all') {
    return installed.local || installed.global
  }

  return scope === 'local' ? installed.local : installed.global
}

function isScopeOutdated(installed: InstalledSkillInfo, scope: LifecycleScope, registryHash: string): boolean {
  if (!isInstalledInScope(installed, scope)) {
    return false
  }

  const scopedHash = installed.scopeHashes?.[scope]
  const installedHash = scopedHash ?? installed.contentHash

  return installedHash !== registryHash || installedHash === undefined
}

function isInstalledForAllAgents(
  installed: InstalledSkillsMap[string],
  allAgents: AvailableAgent[],
  scope: LifecycleScope | 'all',
): boolean {
  if (!installed) {
    return false
  }

  if (allAgents.length === 0) {
    return isInstalledInScope(installed, scope)
  }

  return allAgents.every((agent) => {
    const installInfo = installed.agents.find((entry) => entry.agent === agent.agent)
    if (!installInfo) {
      return false
    }

    return isAgentInstalledInScope(installInfo, scope)
  })
}

function isAgentInstalledInScope(agent: InstalledSkillInfo['agents'][number], scope: LifecycleScope | 'all'): boolean {
  if (scope === 'all') {
    return agent.local || agent.global
  }

  return scope === 'local' ? agent.local : agent.global
}
