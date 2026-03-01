import { join } from 'node:path'

import type { AgentMetadata, AgentType } from './types'

interface AgentTemplate extends Omit<AgentMetadata, 'globalSkillsDir'> {
  globalSkillsDirRelative: string
}

export const AGENT_TEMPLATES: Record<AgentType, AgentTemplate> = {
  cursor: {
    name: 'cursor',
    displayName: 'Cursor',
    description: 'AI-first code editor built on VS Code',
    company: 'Anysphere',
    skillsDir: '.cursor/skills',
    globalSkillsDirRelative: '.cursor/skills',
  },
  'claude-code': {
    name: 'claude-code',
    displayName: 'Claude Code',
    description: "Anthropic's agentic coding tool",
    company: 'Anthropic',
    skillsDir: '.claude/skills',
    globalSkillsDirRelative: '.claude/skills',
  },
  'github-copilot': {
    name: 'github-copilot',
    displayName: 'GitHub Copilot',
    description: 'AI pair programmer by GitHub/Microsoft',
    company: 'GitHub',
    skillsDir: '.github/skills',
    globalSkillsDirRelative: '.copilot/skills',
  },
  windsurf: {
    name: 'windsurf',
    displayName: 'Windsurf',
    description: 'AI IDE with Cascade flow (Codeium)',
    company: 'Codeium',
    skillsDir: '.windsurf/skills',
    globalSkillsDirRelative: '.codeium/windsurf/skills',
  },
  cline: {
    name: 'cline',
    displayName: 'Cline',
    description: 'Autonomous AI coding agent for VS Code',
    company: 'Cline',
    skillsDir: '.cline/skills',
    globalSkillsDirRelative: '.cline/skills',
  },
  aider: {
    name: 'aider',
    displayName: 'Aider',
    description: 'AI pair programming in terminal',
    company: 'Aider-AI',
    skillsDir: '.aider/skills',
    globalSkillsDirRelative: '.aider/skills',
  },
  codex: {
    name: 'codex',
    displayName: 'OpenAI Codex',
    description: "OpenAI's coding agent",
    company: 'OpenAI',
    skillsDir: '.codex/skills',
    globalSkillsDirRelative: '.codex/skills',
  },
  gemini: {
    name: 'gemini',
    displayName: 'Gemini CLI',
    description: "Google's AI coding assistant",
    company: 'Google',
    skillsDir: '.gemini/skills',
    globalSkillsDirRelative: '.gemini/skills',
  },
  antigravity: {
    name: 'antigravity',
    displayName: 'Antigravity',
    description: "Google's agentic coding (VS Code)",
    company: 'Google',
    skillsDir: '.agent/skills',
    globalSkillsDirRelative: '.gemini/antigravity/global_skills',
  },
  roo: {
    name: 'roo',
    displayName: 'Roo Code',
    description: 'AI coding assistant for VS Code',
    company: 'Roo Code Inc.',
    skillsDir: '.roo/skills',
    globalSkillsDirRelative: '.roo/skills',
  },
  kilocode: {
    name: 'kilocode',
    displayName: 'Kilo Code',
    description: 'AI coding agent with auto-launch',
    company: 'Kilo Code',
    skillsDir: '.kilocode/skills',
    globalSkillsDirRelative: '.kilocode/skills',
  },
  'amazon-q': {
    name: 'amazon-q',
    displayName: 'Amazon Q',
    description: 'AWS AI coding assistant',
    company: 'Amazon Web Services',
    skillsDir: '.amazonq/skills',
    globalSkillsDirRelative: '.amazonq/skills',
  },
  augment: {
    name: 'augment',
    displayName: 'Augment',
    description: 'AI code assistant with context engine',
    company: 'Augment Code',
    skillsDir: '.augment/skills',
    globalSkillsDirRelative: '.augment/skills',
  },
  tabnine: {
    name: 'tabnine',
    displayName: 'Tabnine',
    description: 'AI code completions with privacy focus',
    company: 'Tabnine',
    skillsDir: '.tabnine/skills',
    globalSkillsDirRelative: '.tabnine/skills',
  },
  opencode: {
    name: 'opencode',
    displayName: 'OpenCode',
    description: 'Open-source AI coding terminal',
    company: 'SST',
    skillsDir: '.opencode/skills',
    globalSkillsDirRelative: '.config/opencode/skills',
  },
  sourcegraph: {
    name: 'sourcegraph',
    displayName: 'Sourcegraph Cody',
    description: 'AI assistant with codebase context',
    company: 'Sourcegraph',
    skillsDir: '.sourcegraph/skills',
    globalSkillsDirRelative: '.sourcegraph/skills',
  },
  droid: {
    name: 'droid',
    displayName: 'Droid (Factory.ai)',
    description: 'AI software engineer by Factory.ai',
    company: 'Factory',
    skillsDir: '.factory/skills',
    globalSkillsDirRelative: '.factory/skills',
  },
  trae: {
    name: 'trae',
    displayName: 'TRAE',
    description: 'AI IDE with SOLO mode and custom agents',
    company: 'ByteDance',
    skillsDir: '.trae/skills',
    globalSkillsDirRelative: '.trae/skills',
  },
  kiro: {
    name: 'kiro',
    displayName: 'Kiro',
    description: 'AI Agent with workspace and global skill scopes',
    company: 'Amazon Web Services',
    skillsDir: '.kiro/skills',
    globalSkillsDirRelative: '.kiro/skills',
  },
}

export function getAgentMetadata(homeDir: string): Record<AgentType, AgentMetadata> {
  return Object.fromEntries(
    Object.entries(AGENT_TEMPLATES).map(([agentType, template]) => [
      agentType,
      {
        name: template.name,
        displayName: template.displayName,
        description: template.description,
        company: template.company,
        skillsDir: template.skillsDir,
        globalSkillsDir: join(homeDir, template.globalSkillsDirRelative),
      },
    ]),
  ) as Record<AgentType, AgentMetadata>
}
