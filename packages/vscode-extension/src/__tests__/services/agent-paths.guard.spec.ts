import { getAgentTopology } from '@tech-leads-club/core'
import { homedir } from 'node:os'
import { getLocalWatcherPatterns } from '../../services/agent-paths'

describe('agent-paths topology guard', () => {
  it('keeps watcher patterns in sync with shared topology', () => {
    const expected = getAgentTopology(homedir())
      .map((entry) => entry.localWatcherGlob)
      .sort()
    const actual = getLocalWatcherPatterns().slice().sort()

    const missing = expected.filter((pattern) => !actual.includes(pattern))
    const extra = actual.filter((pattern) => !expected.includes(pattern))

    if (missing.length > 0 || extra.length > 0) {
      throw new Error(
        `Watcher topology mismatch. Missing: ${missing.join(', ') || 'none'} | Extra: ${extra.join(', ') || 'none'}`,
      )
    }

    expect({ missing, extra, expectedCount: expected.length, actualCount: actual.length }).toEqual({
      missing: [],
      extra: [],
      expectedCount: expected.length,
      actualCount: expected.length,
    })
  })
})
