import chalk from 'chalk'
import { generateAuditReport } from '@tech-leads-club/core'
import type { AuditReport, ReportRecommendation } from '@tech-leads-club/core'

import { ports } from '../ports'

interface ReportCliOptions {
  global?: boolean
  threshold?: string
  json?: boolean
}

export async function runCliReport(options: ReportCliOptions): Promise<void> {
  const highCostThreshold = options.threshold ? parseInt(options.threshold, 10) : 5000

  console.log(chalk.blue('⏳ Scanning AI integrations...'))

  const report = await generateAuditReport(ports, {
    includeGlobal: options.global !== false,
    highCostThreshold,
  })

  if (options.json) {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  printReport(report)
}

function printReport(report: AuditReport): void {
  const { summary } = report

  console.log('')
  console.log(chalk.hex('#3b82f6').bold('━'.repeat(60)))
  console.log(chalk.hex('#3b82f6').bold('  Agent Skills — Audit Report'))
  console.log(chalk.hex('#3b82f6').bold('━'.repeat(60)))
  console.log(chalk.dim(`  Generated: ${new Date(report.generatedAt).toLocaleString()}`))
  console.log(chalk.dim(`  Project:   ${report.projectRoot}`))
  console.log('')

  printSummaryBar(summary)
  printAgentOverview(report)
  printSkillsInventory(report)
  printTokenCostAnalysis(report)
  printMcpServers(report)
  printRecommendations(report.recommendations)

  console.log(chalk.hex('#3b82f6').bold('━'.repeat(60)))
  console.log('')
}

function printSummaryBar(summary: AuditReport['summary']): void {
  console.log(
    chalk.bold('  Summary: ') +
      chalk.hex('#22c55e')(`${summary.totalAgentsDetected} agents`) +
      chalk.dim(' · ') +
      chalk.hex('#06b6d4')(`${summary.totalSkillsInstalled} skills`) +
      chalk.dim(' · ') +
      chalk.hex('#f59e0b')(`${summary.alwaysOnTokens.toLocaleString()} always-on tokens`) +
      chalk.dim(' · ') +
      chalk.hex('#8b5cf6')(`${summary.totalMcpServers} MCP servers`),
  )

  const warnings: string[] = []
  if (summary.highCostSkillCount > 0) warnings.push(`${summary.highCostSkillCount} high-cost`)
  if (summary.orphanedSkillCount > 0) warnings.push(`${summary.orphanedSkillCount} orphaned`)
  if (summary.duplicateSkillCount > 0) warnings.push(`${summary.duplicateSkillCount} duplicated`)

  if (warnings.length > 0) {
    console.log(chalk.dim('           ') + chalk.hex('#f59e0b')(`⚠ ${warnings.join(', ')}`))
  }
  console.log('')
}

function printAgentOverview(report: AuditReport): void {
  if (report.agents.length === 0) return

  console.log(chalk.hex('#06b6d4').bold('  ▸ Agent Overview'))
  console.log('')

  const nameWidth = Math.max(...report.agents.map((a) => a.displayName.length), 10)

  console.log(
    chalk.dim(
      `    ${'Agent'.padEnd(nameWidth)}  ${'Status'.padEnd(10)}  ${'Local'.padEnd(7)}  ${'Global'.padEnd(7)}  ${'Tokens'.padEnd(10)}  MCP`,
    ),
  )
  console.log(chalk.dim(`    ${'─'.repeat(nameWidth + 50)}`))

  for (const agent of report.agents) {
    const status = agent.isInstalled ? chalk.hex('#22c55e')('✓ active') : chalk.dim('  —')
    const local = agent.localSkillCount > 0 ? String(agent.localSkillCount) : chalk.dim('0')
    const global = agent.globalSkillCount > 0 ? String(agent.globalSkillCount) : chalk.dim('0')
    const tokens =
      agent.totalTokens > 0 ? agent.totalTokens.toLocaleString() : chalk.dim('0')
    const mcp = agent.mcpServerCount > 0 ? String(agent.mcpServerCount) : chalk.dim('0')

    console.log(
      `    ${agent.displayName.padEnd(nameWidth)}  ${String(status).padEnd(10)}  ${String(local).padEnd(7)}  ${String(global).padEnd(7)}  ${String(tokens).padEnd(10)}  ${mcp}`,
    )
  }
  console.log('')
}

function printSkillsInventory(report: AuditReport): void {
  const physicalSkills = report.skills.filter((s) => s.physicallyPresent)
  if (physicalSkills.length === 0) {
    console.log(chalk.hex('#06b6d4').bold('  ▸ Skills Inventory'))
    console.log(chalk.dim('    No installed skills found.'))
    console.log('')
    return
  }

  console.log(chalk.hex('#06b6d4').bold(`  ▸ Skills Inventory (${physicalSkills.length} installations)`))
  console.log('')

  const byAgent = new Map<string, typeof physicalSkills>()
  for (const skill of physicalSkills) {
    const key = skill.agent
    const existing = byAgent.get(key) ?? []
    existing.push(skill)
    byAgent.set(key, existing)
  }

  for (const [agent, skills] of byAgent) {
    console.log(chalk.bold(`    ${agent} (${skills.length}):`))
    for (const skill of skills) {
      const orphanBadge = !skill.inLockfile ? chalk.hex('#f59e0b')(' [orphaned]') : ''
      const locationBadge = skill.location === 'global' ? chalk.dim(' (global)') : ''
      const estimate = report.tokenEstimates.find(
        (e) => e.skillName === skill.name && e.agent === skill.agent,
      )
      const tokenInfo = estimate
        ? chalk.dim(` desc:${estimate.descriptionTokens} body:${estimate.bodyTokens} ref:${estimate.resourceTokens}`)
        : ''

      console.log(`      • ${skill.name}${locationBadge}${orphanBadge}${tokenInfo}`)
    }
    console.log('')
  }
}

function printTokenCostAnalysis(report: AuditReport): void {
  console.log(chalk.hex('#06b6d4').bold('  ▸ Token Cost Analysis'))
  console.log(chalk.dim('    Skills use progressive disclosure (see agentskills.io/specification):'))
  console.log(chalk.dim('    1. Description (~100 tok) — always loaded at startup for all skills'))
  console.log(chalk.dim('    2. Body (< 5000 tok) — loaded when the skill is activated'))
  console.log(chalk.dim('    3. Resources — loaded on demand (scripts, references, assets)'))
  console.log('')

  if (report.tokenEstimates.length === 0) {
    console.log(chalk.dim('    No skills to analyze.'))
    console.log('')
    return
  }

  console.log(
    chalk.bold('    Always-on cost (descriptions): ') +
      chalk.hex('#f59e0b')(`${report.summary.alwaysOnTokens.toLocaleString()} tokens`),
  )
  console.log(
    chalk.bold('    Full activation cost (all):    ') +
      chalk.hex('#f59e0b')(`${report.summary.totalTokens.toLocaleString()} tokens`),
  )
  console.log('')

  const highCost = report.tokenEstimates.filter((e) => e.isHighCost)
  if (highCost.length > 0) {
    console.log(chalk.hex('#f59e0b')('    ⚠ High-cost skills (total tokens):'))
    for (const e of highCost.sort((a, b) => b.totalTokens - a.totalTokens)) {
      console.log(
        chalk.hex('#f59e0b')(
          `      • ${e.skillName} (${e.agent}): ${e.totalTokens.toLocaleString()} tok` +
            chalk.dim(` [desc:${e.descriptionTokens} body:${e.bodyTokens} ref:${e.resourceTokens}]`),
        ),
      )
    }
    console.log('')
  }

  console.log(chalk.bold('    Estimated always-on cost (descriptions loaded at startup):'))
  console.log('')

  for (const cost of report.costEstimates) {
    const formattedCost =
      cost.estimatedInputCost < 0.01
        ? `$${cost.estimatedInputCost.toFixed(6)}`
        : `$${cost.estimatedInputCost.toFixed(4)}`

    console.log(
      `      ${cost.provider.name} ${chalk.dim(`(${cost.provider.model})`)}: ${chalk.hex('#22c55e')(formattedCost)}`,
    )
  }
  console.log('')
}

function printMcpServers(report: AuditReport): void {
  console.log(chalk.hex('#06b6d4').bold('  ▸ MCP Servers'))
  console.log('')

  if (report.mcpServers.length === 0) {
    console.log(chalk.dim('    No MCP servers detected.'))
    console.log('')
    return
  }

  const byAgent = new Map<string, typeof report.mcpServers>()
  for (const server of report.mcpServers) {
    const existing = byAgent.get(server.agent) ?? []
    existing.push(server)
    byAgent.set(server.agent, existing)
  }

  for (const [agent, servers] of byAgent) {
    console.log(chalk.bold(`    ${agent} (${servers.length}):`))
    for (const server of servers) {
      const locationBadge = server.location === 'global' ? chalk.dim(' (global)') : ''
      const conflictBadge = report.mcpConflicts.some((c) => c.serverName === server.name)
        ? chalk.hex('#ef4444')(' [conflict]')
        : ''

      console.log(
        `      • ${server.name}${locationBadge}${conflictBadge}` +
          chalk.dim(` → ${server.command} ${(server.args ?? []).join(' ')}`),
      )
    }
    console.log('')
  }

  if (report.mcpConflicts.length > 0) {
    console.log(chalk.hex('#ef4444')(`    ⚠ ${report.mcpConflicts.length} conflict(s) detected`))
    console.log('')
  }
}

function printRecommendations(recommendations: ReportRecommendation[]): void {
  if (recommendations.length === 0) return

  console.log(chalk.hex('#06b6d4').bold(`  ▸ Recommendations (${recommendations.length})`))
  console.log('')

  const severityColors = {
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  }
  const severityIcons = {
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
  }

  for (const rec of recommendations) {
    const color = severityColors[rec.severity]
    const icon = severityIcons[rec.severity]

    console.log(chalk.hex(color)(`    ${icon} ${rec.message}`))
    if (rec.details) {
      console.log(chalk.dim(`      ${rec.details}`))
    }
  }
  console.log('')
}
