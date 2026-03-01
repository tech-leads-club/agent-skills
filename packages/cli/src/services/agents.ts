import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { getAgentMetadata } from '@tech-leads-club/core'
import type { AgentConfig, AgentType } from '../types'
import { findProjectRoot } from './project-root'

const home = homedir()
const projectRoot = findProjectRoot()
const agentMetadata = getAgentMetadata(home)

const withDetection = (agentType: AgentType, detectInstalled: () => boolean): AgentConfig => ({
  ...agentMetadata[agentType],
  detectInstalled,
})

export const agents: Record<AgentType, AgentConfig> = {
  // Tier 1: Most popular AI coding agents
  cursor: withDetection('cursor', () => existsSync(join(home, '.cursor')) || existsSync(join(projectRoot, '.cursor'))),
  'claude-code': withDetection(
    'claude-code',
    () => existsSync(join(home, '.claude')) || existsSync(join(projectRoot, '.claude')),
  ),
  'github-copilot': withDetection(
    'github-copilot',
    () => existsSync(join(home, '.copilot')) || existsSync(join(projectRoot, '.github')),
  ),
  windsurf: withDetection(
    'windsurf',
    () => existsSync(join(home, '.codeium/windsurf')) || existsSync(join(projectRoot, '.windsurf')),
  ),
  cline: withDetection(
    'cline',
    () =>
      existsSync(join(home, '.cline')) ||
      existsSync(join(projectRoot, '.cline')) ||
      isExtensionInstalled('saoudrizwan', 'claude-dev'),
  ),

  // Tier 2: Rising stars
  aider: withDetection('aider', () => existsSync(join(home, '.aider')) || existsSync(join(projectRoot, '.aider'))),
  codex: withDetection('codex', () => existsSync(join(home, '.codex')) || existsSync(join(projectRoot, '.codex'))),
  gemini: withDetection('gemini', () => existsSync(join(home, '.gemini')) || existsSync(join(projectRoot, '.gemini'))),
  antigravity: withDetection(
    'antigravity',
    () => existsSync(join(home, '.gemini/antigravity')) || existsSync(join(projectRoot, '.agent')),
  ),
  roo: withDetection(
    'roo',
    () =>
      existsSync(join(home, '.roo')) ||
      existsSync(join(projectRoot, '.roo')) ||
      isExtensionInstalled('RooVetGit', 'roo-cline'),
  ),
  kilocode: withDetection(
    'kilocode',
    () => existsSync(join(home, '.kilocode')) || existsSync(join(projectRoot, '.kilocode')),
  ),
  trae: withDetection('trae', () => existsSync(join(home, '.trae')) || existsSync(join(projectRoot, '.trae'))),
  kiro: withDetection('kiro', () => existsSync(join(home, '.kiro')) || existsSync(join(projectRoot, '.kiro'))),

  // Tier 3: Enterprise & specialized
  'amazon-q': withDetection(
    'amazon-q',
    () => existsSync(join(home, '.amazonq')) || existsSync(join(projectRoot, '.amazonq')),
  ),
  augment: withDetection(
    'augment',
    () => existsSync(join(home, '.augment')) || existsSync(join(projectRoot, '.augment')),
  ),
  tabnine: withDetection(
    'tabnine',
    () => existsSync(join(home, '.tabnine')) || existsSync(join(projectRoot, '.tabnine')),
  ),
  opencode: withDetection(
    'opencode',
    () =>
      existsSync(join(home, '.config/opencode')) ||
      existsSync(join(projectRoot, '.opencode')) ||
      existsSync(join(projectRoot, '.config/opencode')),
  ),
  sourcegraph: withDetection(
    'sourcegraph',
    () => existsSync(join(home, '.sourcegraph')) || existsSync(join(projectRoot, '.sourcegraph')),
  ),
  droid: withDetection('droid', () => existsSync(join(home, '.factory')) || existsSync(join(projectRoot, '.factory'))),
}

export function detectInstalledAgents(): AgentType[] {
  return (Object.entries(agents) as [AgentType, AgentConfig][])
    .filter(([, config]) => config.detectInstalled())
    .map(([type]) => type)
}

export function getAgentConfig(type: AgentType): AgentConfig {
  return agents[type]
}

export function getAllAgentTypes(): AgentType[] {
  return (Object.keys(agents) as AgentType[]).sort((a, b) => agents[a].displayName.localeCompare(agents[b].displayName))
}

function isExtensionInstalled(publisher: string, name: string): boolean {
  const extensionsDirs = [
    join(home, '.vscode/extensions'),
    join(home, '.vscode-server/extensions'),
    join(home, '.vscode-oss/extensions'),
  ]

  for (const dir of extensionsDirs) {
    if (existsSync(dir)) {
      try {
        const entries = readdirSync(dir)
        if (entries.some((e) => e.startsWith(`${publisher}.${name}-`))) {
          return true
        }
      } catch {
        // Ignore errors accessing extension dirs
      }
    }
  }

  return false
}
