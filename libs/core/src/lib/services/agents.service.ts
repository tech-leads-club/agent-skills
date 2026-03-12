import type { AgentType } from '../types'

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
