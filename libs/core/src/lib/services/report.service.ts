import type { CorePorts } from '../ports'
import type {
  AgentReportSummary,
  AgentType,
  AuditReport,
  CostEstimate,
  DiscoveredSkill,
  ReportOptions,
  ReportRecommendation,
  SkillDuplicate,
  SkillTokenEstimate,
} from '../types'

import { detectInstalledAgents, getAgentConfig, getAllAgentTypes } from './agents.service'
import { detectMcpServers } from './mcp-detector.service'
import { findProjectRoot } from './project-root.service'
import { scanInstalledSkills } from './skill-scanner.service'
import { DEFAULT_PROVIDERS, estimateCosts, estimateSkillTokens } from './token-estimator.service'

const DEFAULT_OPTIONS: ReportOptions = {
  includeGlobal: true,
  highCostThreshold: 5000,
}

export async function generateAuditReport(
  ports: CorePorts,
  options?: Partial<ReportOptions>,
): Promise<AuditReport> {
  const opts: ReportOptions = { ...DEFAULT_OPTIONS, ...options }
  const projectRoot = findProjectRoot(ports)
  const installedAgents = detectInstalledAgents(ports)

  const { skills, orphans } = await scanInstalledSkills(ports, { includeGlobal: opts.includeGlobal })

  const physicalSkills = skills.filter((s) => s.physicallyPresent)
  const tokenEstimates: SkillTokenEstimate[] = []
  for (const skill of physicalSkills) {
    const estimate = await estimateSkillTokens(
      ports,
      skill.path,
      skill.name,
      skill.agent,
      skill.location,
      opts.highCostThreshold,
    )
    tokenEstimates.push(estimate)
  }

  const alwaysOnTokens = tokenEstimates.reduce((sum, e) => sum + e.descriptionTokens, 0)
  const totalTokens = tokenEstimates.reduce((sum, e) => sum + e.totalTokens, 0)
  const costEstimates: CostEstimate[] = estimateCosts(alwaysOnTokens, opts.providers ?? DEFAULT_PROVIDERS)

  const { servers: mcpServers, conflicts: mcpConflicts } = await detectMcpServers(ports, {
    includeGlobal: opts.includeGlobal,
  })

  const duplicates = findDuplicates(skills)
  const recommendations = generateRecommendations(orphans, tokenEstimates, duplicates, mcpConflicts)
  const agents = buildAgentSummaries(ports, installedAgents, skills, tokenEstimates, mcpServers)

  return {
    generatedAt: new Date().toISOString(),
    projectRoot,
    agents,
    skills,
    tokenEstimates,
    costEstimates,
    duplicates,
    orphans,
    mcpServers,
    mcpConflicts,
    recommendations,
    summary: {
      totalAgentsDetected: installedAgents.length,
      totalSkillsInstalled: new Set(skills.map((s) => s.name)).size,
      alwaysOnTokens,
      totalTokens,
      totalMcpServers: mcpServers.length,
      highCostSkillCount: tokenEstimates.filter((e) => e.isHighCost).length,
      orphanedSkillCount: orphans.length,
      duplicateSkillCount: duplicates.length,
    },
  }
}

function findDuplicates(skills: DiscoveredSkill[]): SkillDuplicate[] {
  const byName = new Map<string, DiscoveredSkill[]>()
  for (const skill of skills) {
    const existing = byName.get(skill.name) ?? []
    existing.push(skill)
    byName.set(skill.name, existing)
  }

  const duplicates: SkillDuplicate[] = []
  for (const [skillName, entries] of byName) {
    const uniqueAgents = new Set(entries.map((e) => e.agent))
    if (uniqueAgents.size > 1) {
      duplicates.push({
        skillName,
        agents: entries.map((e) => ({ agent: e.agent, location: e.location, path: e.path })),
      })
    }
  }
  return duplicates
}

function generateRecommendations(
  orphans: { skillName: string; agent: AgentType; path: string }[],
  tokenEstimates: SkillTokenEstimate[],
  duplicates: SkillDuplicate[],
  mcpConflicts: { serverName: string }[],
): ReportRecommendation[] {
  const recommendations: ReportRecommendation[] = []

  for (const orphan of orphans) {
    recommendations.push({
      type: 'orphaned',
      severity: 'warning',
      message: `Orphaned skill "${orphan.skillName}" for ${orphan.agent} — on disk but not in lockfile`,
      details: `Path: ${orphan.path}. Run "agent-skills install" to register or remove the directory.`,
    })
  }

  const seenHighCost = new Set<string>()
  for (const estimate of tokenEstimates.filter((e) => e.isHighCost)) {
    if (seenHighCost.has(estimate.skillName)) continue
    seenHighCost.add(estimate.skillName)
    recommendations.push({
      type: 'high-cost',
      severity: 'info',
      message: `High-cost skill "${estimate.skillName}" uses ~${estimate.totalTokens.toLocaleString()} tokens`,
      details: `Consider splitting into smaller referenced documents or removing unused sections.`,
    })
  }

  for (const dup of duplicates) {
    const agentNames = dup.agents.map((a) => a.agent).join(', ')
    recommendations.push({
      type: 'duplicate',
      severity: 'info',
      message: `Skill "${dup.skillName}" installed across ${dup.agents.length} agents: ${agentNames}`,
      details: `This is expected if you use multiple agents. Use symlinks to save disk space.`,
    })
  }

  for (const conflict of mcpConflicts) {
    recommendations.push({
      type: 'mcp-conflict',
      severity: 'error',
      message: `MCP server "${conflict.serverName}" has conflicting configurations across agents`,
      details: `Check that the command and args match across all agent config files.`,
    })
  }

  return recommendations.sort((a, b) => {
    const severityOrder = { error: 0, warning: 1, info: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
}

function buildAgentSummaries(
  ports: CorePorts,
  installedAgents: AgentType[],
  skills: DiscoveredSkill[],
  tokenEstimates: SkillTokenEstimate[],
  mcpServers: { agent: AgentType }[],
): AgentReportSummary[] {
  const allAgents = getAllAgentTypes()

  return allAgents
    .filter((agent) => {
      const hasSkills = skills.some((s) => s.agent === agent)
      const hasMcp = mcpServers.some((m) => m.agent === agent)
      return installedAgents.includes(agent) || hasSkills || hasMcp
    })
    .map((agent) => {
      const config = getAgentConfig(ports, agent)
      const agentSkills = skills.filter((s) => s.agent === agent)
      const agentTokens = tokenEstimates.filter((e) => e.agent === agent)
      const agentMcp = mcpServers.filter((m) => m.agent === agent)

      return {
        agent,
        displayName: config.displayName,
        isInstalled: installedAgents.includes(agent),
        localSkillCount: agentSkills.filter((s) => s.location === 'local').length,
        globalSkillCount: agentSkills.filter((s) => s.location === 'global').length,
        totalTokens: agentTokens.reduce((sum, e) => sum + e.descriptionTokens, 0),
        mcpServerCount: agentMcp.length,
      }
    })
}
