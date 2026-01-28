import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { findProjectRoot } from './project-root'
import type { AgentConfig, AgentType } from './types'

const home = homedir()
const projectRoot = findProjectRoot()

export const agents: Record<AgentType, AgentConfig> = {
  // Tier 1: Most popular AI coding agents
  cursor: {
    name: 'cursor',
    displayName: 'Cursor',
    description: 'AI-first code editor built on VS Code',
    skillsDir: '.cursor/skills',
    globalSkillsDir: join(home, '.cursor/skills'),
    detectInstalled: () => existsSync(join(home, '.cursor')) || existsSync(join(projectRoot, '.cursor')),
  },
  'claude-code': {
    name: 'claude-code',
    displayName: 'Claude Code',
    description: "Anthropic's agentic coding tool",
    skillsDir: '.claude/skills',
    globalSkillsDir: join(home, '.claude/skills'),
    detectInstalled: () => existsSync(join(home, '.claude')) || existsSync(join(projectRoot, '.claude')),
  },
  'github-copilot': {
    name: 'github-copilot',
    displayName: 'GitHub Copilot',
    description: 'AI pair programmer by GitHub/Microsoft',
    skillsDir: '.github/skills',
    globalSkillsDir: join(home, '.copilot/skills'),
    detectInstalled: () => existsSync(join(home, '.copilot')) || existsSync(join(projectRoot, '.github')),
  },
  windsurf: {
    name: 'windsurf',
    displayName: 'Windsurf',
    description: 'AI IDE with Cascade flow (Codeium)',
    skillsDir: '.windsurf/skills',
    globalSkillsDir: join(home, '.codeium/windsurf/skills'),
    detectInstalled: () => existsSync(join(home, '.codeium/windsurf')) || existsSync(join(projectRoot, '.windsurf')),
  },
  cline: {
    name: 'cline',
    displayName: 'Cline',
    description: 'Autonomous AI coding agent for VS Code',
    skillsDir: '.cline/skills',
    globalSkillsDir: join(home, '.cline/skills'),
    detectInstalled: () => existsSync(join(home, '.cline')) || existsSync(join(projectRoot, '.cline')),
  },

  // Tier 2: Rising stars
  aider: {
    name: 'aider',
    displayName: 'Aider',
    description: 'AI pair programming in terminal',
    skillsDir: '.aider/skills',
    globalSkillsDir: join(home, '.aider/skills'),
    detectInstalled: () => existsSync(join(home, '.aider')) || existsSync(join(projectRoot, '.aider')),
  },
  codex: {
    name: 'codex',
    displayName: 'OpenAI Codex',
    description: "OpenAI's coding agent",
    skillsDir: '.codex/skills',
    globalSkillsDir: join(home, '.codex/skills'),
    detectInstalled: () => existsSync(join(home, '.codex')) || existsSync(join(projectRoot, '.codex')),
  },
  gemini: {
    name: 'gemini',
    displayName: 'Gemini CLI',
    description: "Google's AI coding assistant",
    skillsDir: '.gemini/skills',
    globalSkillsDir: join(home, '.gemini/skills'),
    detectInstalled: () => existsSync(join(home, '.gemini')) || existsSync(join(projectRoot, '.gemini')),
  },
  antigravity: {
    name: 'antigravity',
    displayName: 'Antigravity',
    description: "Google's agentic coding (VS Code)",
    skillsDir: '.agent/skills',
    globalSkillsDir: join(home, '.gemini/antigravity/global_skills'),
    detectInstalled: () => existsSync(join(home, '.gemini/antigravity')) || existsSync(join(projectRoot, '.agent')),
  },
  roo: {
    name: 'roo',
    displayName: 'Roo Code',
    description: 'AI coding assistant for VS Code',
    skillsDir: '.roo/skills',
    globalSkillsDir: join(home, '.roo/skills'),
    detectInstalled: () => existsSync(join(home, '.roo')) || existsSync(join(projectRoot, '.roo')),
  },
  kilocode: {
    name: 'kilocode',
    displayName: 'Kilo Code',
    description: 'AI coding agent with auto-launch',
    skillsDir: '.kilocode/skills',
    globalSkillsDir: join(home, '.kilocode/skills'),
    detectInstalled: () => existsSync(join(home, '.kilocode')) || existsSync(join(projectRoot, '.kilocode')),
  },

  // Tier 3: Enterprise & specialized
  'amazon-q': {
    name: 'amazon-q',
    displayName: 'Amazon Q',
    description: 'AWS AI coding assistant',
    skillsDir: '.amazonq/skills',
    globalSkillsDir: join(home, '.amazonq/skills'),
    detectInstalled: () => existsSync(join(home, '.amazonq')) || existsSync(join(projectRoot, '.amazonq')),
  },
  augment: {
    name: 'augment',
    displayName: 'Augment',
    description: 'AI code assistant with context engine',
    skillsDir: '.augment/skills',
    globalSkillsDir: join(home, '.augment/skills'),
    detectInstalled: () => existsSync(join(home, '.augment')) || existsSync(join(projectRoot, '.augment')),
  },
  tabnine: {
    name: 'tabnine',
    displayName: 'Tabnine',
    description: 'AI code completions with privacy focus',
    skillsDir: '.tabnine/skills',
    globalSkillsDir: join(home, '.tabnine/skills'),
    detectInstalled: () => existsSync(join(home, '.tabnine')) || existsSync(join(projectRoot, '.tabnine')),
  },
  opencode: {
    name: 'opencode',
    displayName: 'OpenCode',
    description: 'Open-source AI coding terminal',
    skillsDir: '.opencode/skills',
    globalSkillsDir: join(home, '.config/opencode/skills'),
    detectInstalled: () =>
      existsSync(join(home, '.config/opencode')) ||
      existsSync(join(projectRoot, '.opencode')) ||
      existsSync(join(projectRoot, '.config/opencode')),
  },
  sourcegraph: {
    name: 'sourcegraph',
    displayName: 'Sourcegraph Cody',
    description: 'AI assistant with codebase context',
    skillsDir: '.sourcegraph/skills',
    globalSkillsDir: join(home, '.sourcegraph/skills'),
    detectInstalled: () => existsSync(join(home, '.sourcegraph')) || existsSync(join(projectRoot, '.sourcegraph')),
  },
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
