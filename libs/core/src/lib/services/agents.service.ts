import { join } from 'node:path'

import type { CorePorts } from '../ports'
import type { AgentConfig, AgentType } from '../types'

import { findProjectRoot } from './project-root.service'

const agentDisplayNames: Record<AgentType, string> = {
  cursor: 'Cursor',
  'claude-code': 'Claude Code',
  'github-copilot': 'GitHub Copilot',
  windsurf: 'Windsurf',
  cline: 'Cline',
  aider: 'Aider',
  codex: 'OpenAI Codex',
  gemini: 'Gemini CLI',
  antigravity: 'Antigravity',
  roo: 'Roo Code',
  kilocode: 'Kilo Code',
  'amazon-q': 'Amazon Q',
  augment: 'Augment',
  tabnine: 'Tabnine',
  opencode: 'OpenCode',
  sourcegraph: 'Sourcegraph Cody',
  droid: 'Droid (Factory.ai)',
  trae: 'TRAE',
  kiro: 'Kiro',
}

/**
 * Returns all supported agent types sorted alphabetically by display name.
 *
 * @returns All supported agent types in display-name order.
 * @example
 * ```ts
 * const agentTypes = getAllAgentTypes()
 * ```
 */
export function getAllAgentTypes(): AgentType[] {
  return (Object.keys(agentDisplayNames) as AgentType[]).sort((a, b) =>
    agentDisplayNames[a].localeCompare(agentDisplayNames[b]),
  )
}

const getAgents = (ports: CorePorts): Record<AgentType, AgentConfig> => {
  const home = ports.env.homedir()
  const projectRoot = findProjectRoot(ports)

  return {
    // Tier 1: Most popular AI coding agents
    cursor: {
      name: 'cursor',
      displayName: 'Cursor',
      description: 'AI-first code editor built on VS Code',
      skillsDir: '.cursor/skills',
      globalSkillsDir: join(home, '.cursor/skills'),
      detectInstalled: () =>
        ports.fs.existsSync(join(home, '.cursor')) || ports.fs.existsSync(join(projectRoot, '.cursor')),
    },
    'claude-code': {
      name: 'claude-code',
      displayName: 'Claude Code',
      description: "Anthropic's agentic coding tool",
      skillsDir: '.claude/skills',
      globalSkillsDir: join(home, '.claude/skills'),
      detectInstalled: () =>
        ports.fs.existsSync(join(home, '.claude')) || ports.fs.existsSync(join(projectRoot, '.claude')),
    },
    'github-copilot': {
      name: 'github-copilot',
      displayName: 'GitHub Copilot',
      description: 'AI pair programmer by GitHub/Microsoft',
      skillsDir: '.github/skills',
      globalSkillsDir: join(home, '.copilot/skills'),
      detectInstalled: () =>
        ports.fs.existsSync(join(home, '.copilot')) || ports.fs.existsSync(join(projectRoot, '.github')),
    },
    windsurf: {
      name: 'windsurf',
      displayName: 'Windsurf',
      description: 'AI IDE with Cascade flow (Codeium)',
      skillsDir: '.windsurf/skills',
      globalSkillsDir: join(home, '.codeium/windsurf/skills'),
      detectInstalled: () =>
        ports.fs.existsSync(join(home, '.codeium/windsurf')) || ports.fs.existsSync(join(projectRoot, '.windsurf')),
    },
    cline: {
      name: 'cline',
      displayName: 'Cline',
      description: 'Autonomous AI coding agent for VS Code',
      skillsDir: '.cline/skills',
      globalSkillsDir: join(home, '.cline/skills'),
      detectInstalled: () =>
        ports.fs.existsSync(join(home, '.cline')) ||
        ports.fs.existsSync(join(projectRoot, '.cline')) ||
        isExtensionInstalled(ports, home, 'saoudrizwan', 'claude-dev'),
    },

    // Tier 2: Rising stars
    aider: {
      name: 'aider',
      displayName: 'Aider',
      description: 'AI pair programming in terminal',
      skillsDir: '.aider/skills',
      globalSkillsDir: join(home, '.aider/skills'),
      detectInstalled: () =>
        ports.fs.existsSync(join(home, '.aider')) || ports.fs.existsSync(join(projectRoot, '.aider')),
    },
    codex: {
      name: 'codex',
      displayName: 'OpenAI Codex',
      description: "OpenAI's coding agent",
      skillsDir: '.codex/skills',
      globalSkillsDir: join(home, '.codex/skills'),
      detectInstalled: () =>
        ports.fs.existsSync(join(home, '.codex')) || ports.fs.existsSync(join(projectRoot, '.codex')),
    },
    gemini: {
      name: 'gemini',
      displayName: 'Gemini CLI',
      description: "Google's AI coding assistant",
      skillsDir: '.gemini/skills',
      globalSkillsDir: join(home, '.gemini/skills'),
      detectInstalled: () =>
        ports.fs.existsSync(join(home, '.gemini')) || ports.fs.existsSync(join(projectRoot, '.gemini')),
    },
    antigravity: {
      name: 'antigravity',
      displayName: 'Antigravity',
      description: "Google's agentic coding (VS Code)",
      skillsDir: '.agent/skills',
      globalSkillsDir: join(home, '.gemini/antigravity/skills'),
      detectInstalled: () =>
        ports.fs.existsSync(join(home, '.gemini/antigravity')) || ports.fs.existsSync(join(projectRoot, '.agent')),
    },
    roo: {
      name: 'roo',
      displayName: 'Roo Code',
      description: 'AI coding assistant for VS Code',
      skillsDir: '.roo/skills',
      globalSkillsDir: join(home, '.roo/skills'),
      detectInstalled: () =>
        ports.fs.existsSync(join(home, '.roo')) ||
        ports.fs.existsSync(join(projectRoot, '.roo')) ||
        isExtensionInstalled(ports, home, 'RooVetGit', 'roo-cline'),
    },
    kilocode: {
      name: 'kilocode',
      displayName: 'Kilo Code',
      description: 'AI coding agent with auto-launch',
      skillsDir: '.kilocode/skills',
      globalSkillsDir: join(home, '.kilocode/skills'),
      detectInstalled: () =>
        ports.fs.existsSync(join(home, '.kilocode')) || ports.fs.existsSync(join(projectRoot, '.kilocode')),
    },
    trae: {
      name: 'trae',
      displayName: 'TRAE',
      description: 'AI IDE with SOLO mode and custom agents',
      skillsDir: '.trae/skills',
      globalSkillsDir: join(home, '.trae/skills'),
      detectInstalled: () =>
        ports.fs.existsSync(join(home, '.trae')) || ports.fs.existsSync(join(projectRoot, '.trae')),
    },
    kiro: {
      name: 'kiro',
      displayName: 'Kiro',
      description: 'AI Agent with workspace and global skill scopes',
      skillsDir: '.kiro/skills',
      globalSkillsDir: join(home, '.kiro/skills'),
      detectInstalled: () =>
        ports.fs.existsSync(join(home, '.kiro')) || ports.fs.existsSync(join(projectRoot, '.kiro')),
    },

    // Tier 3: Enterprise & specialized
    'amazon-q': {
      name: 'amazon-q',
      displayName: 'Amazon Q',
      description: 'AWS AI coding assistant',
      skillsDir: '.amazonq/skills',
      globalSkillsDir: join(home, '.amazonq/skills'),
      detectInstalled: () =>
        ports.fs.existsSync(join(home, '.amazonq')) || ports.fs.existsSync(join(projectRoot, '.amazonq')),
    },
    augment: {
      name: 'augment',
      displayName: 'Augment',
      description: 'AI code assistant with context engine',
      skillsDir: '.augment/skills',
      globalSkillsDir: join(home, '.augment/skills'),
      detectInstalled: () =>
        ports.fs.existsSync(join(home, '.augment')) || ports.fs.existsSync(join(projectRoot, '.augment')),
    },
    tabnine: {
      name: 'tabnine',
      displayName: 'Tabnine',
      description: 'AI code completions with privacy focus',
      skillsDir: '.tabnine/skills',
      globalSkillsDir: join(home, '.tabnine/skills'),
      detectInstalled: () =>
        ports.fs.existsSync(join(home, '.tabnine')) || ports.fs.existsSync(join(projectRoot, '.tabnine')),
    },
    opencode: {
      name: 'opencode',
      displayName: 'OpenCode',
      description: 'Open-source AI coding terminal',
      skillsDir: '.opencode/skills',
      globalSkillsDir: join(home, '.config/opencode/skills'),
      detectInstalled: () =>
        ports.fs.existsSync(join(home, '.config/opencode')) ||
        ports.fs.existsSync(join(projectRoot, '.opencode')) ||
        ports.fs.existsSync(join(projectRoot, '.config/opencode')),
    },
    sourcegraph: {
      name: 'sourcegraph',
      displayName: 'Sourcegraph Cody',
      description: 'AI assistant with codebase context',
      skillsDir: '.sourcegraph/skills',
      globalSkillsDir: join(home, '.sourcegraph/skills'),
      detectInstalled: () =>
        ports.fs.existsSync(join(home, '.sourcegraph')) || ports.fs.existsSync(join(projectRoot, '.sourcegraph')),
    },
    droid: {
      name: 'droid',
      displayName: 'Droid (Factory.ai)',
      description: 'AI software engineer by Factory.ai',
      skillsDir: '.factory/skills',
      globalSkillsDir: join(home, '.factory/skills'),
      detectInstalled: () =>
        ports.fs.existsSync(join(home, '.factory')) || ports.fs.existsSync(join(projectRoot, '.factory')),
    },
  }
}

/**
 * Returns the full configuration for a supported agent type.
 *
 * @param type - The agent type to resolve.
 * @param ports - Core ports used to resolve environment-dependent paths and checks.
 * @returns The full configuration for the requested agent type.
 * @example
 * ```ts
 * const config = getAgentConfig('cursor', ports)
 * ```
 */
export function getAgentConfig(type: AgentType, ports: CorePorts): AgentConfig {
  return getAgents(ports)[type]
}

/**
 * Detects which supported agents are installed on the current system.
 *
 * @param ports - Core ports used to check filesystem presence.
 * @returns The installed agent types.
 * @example
 * ```ts
 * const installedAgents = detectInstalledAgents(ports)
 * ```
 */
export function detectInstalledAgents(ports: CorePorts): AgentType[] {
  return (Object.entries(getAgents(ports)) as [AgentType, AgentConfig][])
    .filter(([, config]) => config.detectInstalled())
    .map(([type]) => type)
}

const isExtensionInstalled = (ports: CorePorts, home: string, publisher: string, name: string): boolean => {
  const extensionsDirs = [
    join(home, '.vscode/extensions'),
    join(home, '.vscode-server/extensions'),
    join(home, '.vscode-oss/extensions'),
  ]

  for (const dir of extensionsDirs) {
    if (ports.fs.existsSync(dir)) {
      try {
        const entries = ports.fs.readdirSync(dir)
        if (entries.some((entry) => entry.name.startsWith(`${publisher}.${name}-`))) {
          return true
        }
      } catch {
        // Ignore errors accessing extension dirs
      }
    }
  }

  return false
}
