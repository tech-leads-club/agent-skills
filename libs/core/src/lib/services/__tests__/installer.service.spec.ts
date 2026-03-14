import { describe, expect, it } from '@jest/globals'

import { getCanonicalPath, getInstallPath } from '../installer.service'

describe('installer service path helpers', () => {
  it('returns the expected local install path for an agent', () => {
    expect(
      getInstallPath('my-skill', 'cursor', {
        global: false,
        method: 'copy',
        agents: ['cursor'],
        skills: ['my-skill'],
        projectRoot: '/workspace/project',
      }),
    ).toBe('/workspace/project/.cursor/skills/my-skill')
  })

  it('returns the expected canonical local path', () => {
    expect(
      getCanonicalPath('my-skill', {
        global: false,
        method: 'copy',
        agents: ['cursor'],
        skills: ['my-skill'],
        projectRoot: '/workspace/project',
      }),
    ).toBe('/workspace/project/.agents/skills/my-skill')
  })
})
