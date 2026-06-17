import { Box, Text } from 'ink'

import type { AuditReport, DiscoveredSkill } from '@tech-leads-club/core'

import { colors } from '../../theme'
import { symbols } from '../../theme/symbols'

interface Props {
  skills: DiscoveredSkill[]
  tokenEstimates: AuditReport['tokenEstimates']
}

export function SkillsInventorySection({ skills, tokenEstimates }: Props) {
  const physicalSkills = skills.filter((s) => s.physicallyPresent)

  if (physicalSkills.length === 0) {
    return <Text color={colors.textDim}>No installed skills found.</Text>
  }

  const byAgent = new Map<string, DiscoveredSkill[]>()
  for (const skill of physicalSkills) {
    const existing = byAgent.get(skill.agent) ?? []
    existing.push(skill)
    byAgent.set(skill.agent, existing)
  }

  return (
    <Box flexDirection="column">
      {[...byAgent.entries()].map(([agent, agentSkills]) => (
        <Box key={agent} flexDirection="column" marginBottom={1}>
          <Text bold>
            {agent} ({agentSkills.length})
          </Text>
          {agentSkills.map((skill) => {
            const estimate = tokenEstimates.find(
              (e) => e.skillName === skill.name && e.agent === skill.agent,
            )
            return (
              <Box key={`${skill.agent}-${skill.name}-${skill.location}`} paddingLeft={2}>
                <Text>{symbols.bullet} {skill.name}</Text>
                {skill.location === 'global' && <Text color={colors.textDim}> (global)</Text>}
                {!skill.inLockfile && <Text color={colors.warning}> [orphaned]</Text>}
                {estimate && (
                  <Text color={colors.textDim}>
                    {' '}desc:{estimate.descriptionTokens} body:{estimate.bodyTokens} ref:{estimate.resourceTokens}
                  </Text>
                )}
                {estimate?.isHighCost && <Text color={colors.warning}> {symbols.warning}</Text>}
              </Box>
            )
          })}
        </Box>
      ))}
    </Box>
  )
}
