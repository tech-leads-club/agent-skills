import { join } from 'node:path'

import type { CorePorts } from '../ports'
import type { AgentConfig, AgentType } from '../types'

import { findProjectRoot } from './project-root.service'

type AgentContext = {
  home: string
  projectRoot: string
  ports: CorePorts
}

type AgentDefinition = {
  displayName: string
  description: string
  skillsDir: string
  globalSkillsDir: (home: string) => string
  detectInstalled: (context: AgentContext) => boolean
}

const agentDefinitions: Record<AgentType, AgentDefinition> = {
  // Tier 1: Most popular AI coding agents
  cursor: {
    displayName: 'Cursor',
    description: 'AI-first code editor built on VS Code',
    skillsDir: '.cursor/skills',
    globalSkillsDir: (home) => join(home, '.cursor/skills'),
    detectInstalled: ({ home, projectRoot, ports }) =>
      ports.fs.existsSync(join(home, '.cursor')) || ports.fs.existsSync(join(projectRoot, '.cursor')),
  },
  'claude-code': {
    displayName: 'Claude Code',
    description: "Anthropic's agentic coding tool",
    skillsDir: '.claude/skills',
    globalSkillsDir: (home) => join(home, '.claude/skills'),
    detectInstalled: ({ home, projectRoot, ports }) =>
      ports.fs.existsSync(join(home, '.claude')) || ports.fs.existsSync(join(projectRoot, '.claude')),
  },
  'github-copilot': {
    displayName: 'GitHub Copilot',
    description: 'AI pair programmer by GitHub/Microsoft',
    skillsDir: '.github/skills',
    globalSkillsDir: (home) => join(home, '.copilot/skills'),
    detectInstalled: ({ home, projectRoot, ports }) =>
      ports.fs.existsSync(join(home, '.copilot')) || ports.fs.existsSync(join(projectRoot, '.github')),
  },
  windsurf: {
    displayName: 'Windsurf',
    description: 'AI IDE with Cascade flow (Codeium)',
    skillsDir: '.windsurf/skills',
    globalSkillsDir: (home) => join(home, '.codeium/windsurf/skills'),
    detectInstalled: ({ home, projectRoot, ports }) =>
      ports.fs.existsSync(join(home, '.codeium/windsurf')) || ports.fs.existsSync(join(projectRoot, '.windsurf')),
  },
  cline: {
    displayName: 'Cline',
    description: 'Autonomous AI coding agent for VS Code',
    skillsDir: '.cline/skills',
    globalSkillsDir: (home) => join(home, '.cline/skills'),
    detectInstalled: ({ home, projectRoot, ports }) =>
      ports.fs.existsSync(join(home, '.cline')) ||
      ports.fs.existsSync(join(projectRoot, '.cline')) ||
      isExtensionInstalled({ home, ports }, 'saoudrizwan', 'claude-dev'),
  },

  // Tier 2: Rising stars
  aider: {
    displayName: 'Aider',
    description: 'AI pair programming in terminal',
    skillsDir: '.aider/skills',
    globalSkillsDir: (home) => join(home, '.aider/skills'),
    detectInstalled: ({ home, projectRoot, ports }) =>
      ports.fs.existsSync(join(home, '.aider')) || ports.fs.existsSync(join(projectRoot, '.aider')),
  },
  codex: {
    displayName: 'OpenAI Codex',
    description: "OpenAI's coding agent",
    skillsDir: '.codex/skills',
    globalSkillsDir: (home) => join(home, '.codex/skills'),
    detectInstalled: ({ home, projectRoot, ports }) =>
      ports.fs.existsSync(join(home, '.codex')) || ports.fs.existsSync(join(projectRoot, '.codex')),
  },
  gemini: {
    displayName: 'Gemini CLI',
    description: "Google's AI coding assistant",
    skillsDir: '.gemini/skills',
    globalSkillsDir: (home) => join(home, '.gemini/skills'),
    detectInstalled: ({ home, projectRoot, ports }) =>
      ports.fs.existsSync(join(home, '.gemini')) || ports.fs.existsSync(join(projectRoot, '.gemini')),
  },
  antigravity: {
    displayName: 'Antigravity',
    description: "Google's agentic coding (VS Code)",
    skillsDir: '.agent/skills',
    globalSkillsDir: (home) => join(home, '.gemini/antigravity/skills'),
    detectInstalled: ({ home, projectRoot, ports }) =>
      ports.fs.existsSync(join(home, '.gemini/antigravity')) || ports.fs.existsSync(join(projectRoot, '.agent')),
  },
  roo: {
    displayName: 'Roo Code',
    description: 'AI coding assistant for VS Code',
    skillsDir: '.roo/skills',
    globalSkillsDir: (home) => join(home, '.roo/skills'),
    detectInstalled: ({ home, projectRoot, ports }) =>
      ports.fs.existsSync(join(home, '.roo')) ||
      ports.fs.existsSync(join(projectRoot, '.roo')) ||
      isExtensionInstalled({ home, ports }, 'RooVetGit', 'roo-cline'),
  },
  kilocode: {
    displayName: 'Kilo Code',
    description: 'AI coding agent with auto-launch',
    skillsDir: '.kilocode/skills',
    globalSkillsDir: (home) => join(home, '.kilocode/skills'),
    detectInstalled: ({ home, projectRoot, ports }) =>
      ports.fs.existsSync(join(home, '.kilocode')) || ports.fs.existsSync(join(projectRoot, '.kilocode')),
  },
  trae: {
    displayName: 'TRAE',
    description: 'AI IDE with SOLO mode and custom agents',
    skillsDir: '.trae/skills',
    globalSkillsDir: (home) => join(home, '.trae/skills'),
    detectInstalled: ({ home, projectRoot, ports }) =>
      ports.fs.existsSync(join(home, '.trae')) || ports.fs.existsSync(join(projectRoot, '.trae')),
  },
  kiro: {
    displayName: 'Kiro',
    description: 'AI Agent with workspace and global skill scopes',
    skillsDir: '.kiro/skills',
    globalSkillsDir: (home) => join(home, '.kiro/skills'),
    detectInstalled: ({ home, projectRoot, ports }) =>
      ports.fs.existsSync(join(home, '.kiro')) || ports.fs.existsSync(join(projectRoot, '.kiro')),
  },

  // Tier 3: Enterprise & specialized
  'amazon-q': {
    displayName: 'Amazon Q',
    description: 'AWS AI coding assistant',
    skillsDir: '.amazonq/skills',
    globalSkillsDir: (home) => join(home, '.amazonq/skills'),
    detectInstalled: ({ home, projectRoot, ports }) =>
      ports.fs.existsSync(join(home, '.amazonq')) || ports.fs.existsSync(join(projectRoot, '.amazonq')),
  },
  augment: {
    displayName: 'Augment',
    description: 'AI code assistant with context engine',
    skillsDir: '.augment/skills',
    globalSkillsDir: (home) => join(home, '.augment/skills'),
    detectInstalled: ({ home, projectRoot, ports }) =>
      ports.fs.existsSync(join(home, '.augment')) || ports.fs.existsSync(join(projectRoot, '.augment')),
  },
  tabnine: {
    displayName: 'Tabnine',
    description: 'AI code completions with privacy focus',
    skillsDir: '.tabnine/skills',
    globalSkillsDir: (home) => join(home, '.tabnine/skills'),
    detectInstalled: ({ home, projectRoot, ports }) =>
      ports.fs.existsSync(join(home, '.tabnine')) || ports.fs.existsSync(join(projectRoot, '.tabnine')),
  },
  opencode: {
    displayName: 'OpenCode',
    description: 'Open-source AI coding terminal',
    skillsDir: '.opencode/skills',
    globalSkillsDir: (home) => join(home, '.config/opencode/skills'),
    detectInstalled: ({ home, projectRoot, ports }) =>
      ports.fs.existsSync(join(home, '.config/opencode')) ||
      ports.fs.existsSync(join(projectRoot, '.opencode')) ||
      ports.fs.existsSync(join(projectRoot, '.config/opencode')),
  },
  sourcegraph: {
    displayName: 'Sourcegraph Cody',
    description: 'AI assistant with codebase context',
    skillsDir: '.sourcegraph/skills',
    globalSkillsDir: (home) => join(home, '.sourcegraph/skills'),
    detectInstalled: ({ home, projectRoot, ports }) =>
      ports.fs.existsSync(join(home, '.sourcegraph')) || ports.fs.existsSync(join(projectRoot, '.sourcegraph')),
  },
  droid: {
    displayName: 'Droid (Factory.ai)',
    description: 'AI software engineer by Factory.ai',
    skillsDir: '.factory/skills',
    globalSkillsDir: (home) => join(home, '.factory/skills'),
    detectInstalled: ({ home, projectRoot, ports }) =>
      ports.fs.existsSync(join(home, '.factory')) || ports.fs.existsSync(join(projectRoot, '.factory')),
  },
}

const createAgentContext = (ports: CorePorts): AgentContext => ({
  home: ports.env.homedir(),
  projectRoot: findProjectRoot(ports),
  ports,
})

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
  return (Object.keys(agentDefinitions) as AgentType[]).sort((a, b) =>
    agentDefinitions[a].displayName.localeCompare(agentDefinitions[b].displayName),
  )
}

/**
 * Returns the full configuration for a supported agent type.
 *
 * @param type - The agent type to resolve.
 * @param ports - Core ports used to resolve environment-dependent paths and checks.
 * @returns The full configuration for the requested agent type.
 * @example
 * ```ts
 * const config = getAgentConfig(ports, 'cursor')
 * ```
 */
export function getAgentConfig(ports: CorePorts, type: AgentType): AgentConfig {
  const definition = agentDefinitions[type]
  const context = createAgentContext(ports)

  return {
    name: type,
    displayName: definition.displayName,
    description: definition.description,
    skillsDir: definition.skillsDir,
    globalSkillsDir: definition.globalSkillsDir(context.home),
    detectInstalled: () => definition.detectInstalled(context),
  }
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
  const context = createAgentContext(ports)

  return (Object.entries(agentDefinitions) as [AgentType, AgentDefinition][])
    .filter(([, definition]) => definition.detectInstalled(context))
    .map(([type]) => type)
}

const isExtensionInstalled = (
  context: Pick<AgentContext, 'home' | 'ports'>,
  publisher: string,
  name: string,
): boolean => {
  const extensionsDirs = [
    join(context.home, '.vscode/extensions'),
    join(context.home, '.vscode-server/extensions'),
    join(context.home, '.vscode-oss/extensions'),
  ]

  for (const dir of extensionsDirs) {
    if (context.ports.fs.existsSync(dir)) {
      try {
        const entries = context.ports.fs.readdirSync(dir)
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
