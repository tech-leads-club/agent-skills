import { planBatch } from '../../services/batch-execution-planner'

describe('batch-execution planner', () => {
  it('plans native install batches across scopes', () => {
    const plan = planBatch({
      action: 'install',
      skills: ['seo', 'access'],
      agents: ['cursor'],
      scope: 'all',
      source: 'command-palette',
    })
    expect(plan.invocations).toHaveLength(2)
    expect(plan.invocations[0]).toEqual(
      expect.objectContaining({
        operation: 'install',
        args: ['install', '-s', 'seo', 'access', '-a', 'cursor'],
        scope: 'local',
      }),
    )
    expect(plan.invocations[1]).toEqual(
      expect.objectContaining({
        operation: 'install',
        args: ['install', '-s', 'seo', 'access', '-a', 'cursor', '-g'],
        scope: 'global',
      }),
    )
  })

  it('emulates multi-skill update when CLI lacks variadic support', () => {
    const plan = planBatch({
      action: 'update',
      skills: ['seo', 'access'],
      agents: [],
      scope: 'auto',
      source: 'command-palette',
    })
    expect(plan.mode).toBe('emulated-batch')
    expect(plan.invocations).toHaveLength(2)
    expect(plan.invocations[0].args).toEqual(['update', '-s', 'seo'])
    expect(plan.invocations[1].args).toEqual(['update', '-s', 'access'])
  })

  it('uses CLI update-all when requested', () => {
    const plan = planBatch({
      action: 'update',
      skills: [],
      agents: [],
      scope: 'auto',
      source: 'command-palette',
      updateAll: true,
    })
    expect(plan.mode).toBe('native-batch')
    expect(plan.invocations).toHaveLength(1)
    expect(plan.invocations[0].args).toEqual(['update'])
  })

  it('maps repair to install --force', () => {
    const plan = planBatch({ action: 'repair', skills: ['seo'], agents: ['cursor'], scope: 'local', source: 'card' })
    expect(plan.invocations).toHaveLength(1)
    expect(plan.invocations[0]).toEqual(
      expect.objectContaining({
        operation: 'repair',
        args: ['install', '-f', '-s', 'seo', '-a', 'cursor'],
        scope: 'local',
        skillNames: ['seo'],
        agents: ['cursor'],
      }),
    )
  })
})
