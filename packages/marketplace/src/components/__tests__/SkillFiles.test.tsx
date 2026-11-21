import { groupSkillFiles } from '../SkillFiles'

describe('groupSkillFiles', () => {
  it('orders instructions, scripts, references, templates, then other folders', () => {
    const groups = groupSkillFiles([
      'references/b.md',
      'evals/case.json',
      'scripts/run.py',
      'SKILL.md',
      'templates/plan.md',
      'references/a.md',
    ])

    expect(groups).toEqual([
      { label: 'Instructions', files: ['SKILL.md'] },
      { label: 'Scripts the agent runs', files: ['scripts/run.py'] },
      { label: 'References loaded on demand', files: ['references/a.md', 'references/b.md'] },
      { label: 'Templates', files: ['templates/plan.md'] },
      { label: 'evals/', files: ['evals/case.json'] },
    ])
  })

  it('returns no groups for an empty list', () => {
    expect(groupSkillFiles([])).toEqual([])
  })
})
