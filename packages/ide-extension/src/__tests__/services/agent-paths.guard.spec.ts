import { createNodeAdapters } from '@tech-leads-club/core'
import { getLocalWatcherPatterns } from '../../services/agent-paths'

describe('agent-paths topology guard', () => {
  it('returns watcher patterns for all agents from core', () => {
    const ports = createNodeAdapters()
    const patterns = getLocalWatcherPatterns(ports)

    expect(patterns.length).toBeGreaterThan(0)
    expect(patterns.every((p) => p.endsWith('/**'))).toBe(true)
    expect(patterns).toContain('.cursor/skills/**')
    expect(patterns).toContain('.claude/skills/**')
  })
})
