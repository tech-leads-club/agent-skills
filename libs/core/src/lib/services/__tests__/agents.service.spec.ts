import { describe, expect, it } from '@jest/globals'

import { getAllAgentTypes } from '../agents.service'

describe('agents service', () => {
  it('returns all supported agent types sorted alphabetically', () => {
    expect(getAllAgentTypes()).toEqual([
      'aider',
      'amazon-q',
      'antigravity',
      'augment',
      'claude-code',
      'cline',
      'cursor',
      'droid',
      'gemini',
      'github-copilot',
      'kilocode',
      'kiro',
      'codex',
      'opencode',
      'roo',
      'sourcegraph',
      'tabnine',
      'trae',
      'windsurf',
    ])
  })
})
