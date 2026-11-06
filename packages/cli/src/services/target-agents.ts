import type { AgentType } from '@tech-leads-club/core'
import { detectInstalledAgents } from '@tech-leads-club/core'
import chalk from 'chalk'

import { ports } from '../ports'
import { loadConfig } from './config'

export interface TargetAgentsResult {
  agents: AgentType[]
  source: string
}

export async function getTargetAgents(cliAgents?: string[]): Promise<TargetAgentsResult> {
  if (cliAgents && cliAgents.length > 0) {
    return { agents: cliAgents as AgentType[], source: 'CLI flag' }
  }

  const config = await loadConfig()
  const userAgents = config.targetAgents
  if (userAgents && userAgents.length > 0) {
    return { agents: userAgents, source: 'user configuration' }
  }

  const detectedAgents = detectInstalledAgents(ports)
  if (detectedAgents.length > 0) {
    return { agents: detectedAgents, source: 'auto-detection' }
  }

  return { agents: [], source: '' }
}

export function reportNoTargetAgents(command: string, action: string): never {
  console.error(chalk.red('❌ No agents specified and none could be detected or found in configuration.'))
  console.error(
    chalk.dim(
      `You can use the "--agent" flag in the "agent-skills ${command}" command to specify the target agents for this ${action}.`,
    ),
  )
  console.error(chalk.dim('You can also use the "agent-skills agents" command to manage the target agents globally.'))
  process.exit(1)
}
