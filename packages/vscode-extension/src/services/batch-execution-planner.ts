import { randomUUID } from 'node:crypto'

import type { LifecycleBatchSelection, LifecycleScopeHint, OperationType } from '../shared/types'

/**
 * Expresses the capabilities of the CLI version currently installed.
 */
export interface CliCapabilities {
  installVariadicSkills: boolean
  removeVariadicSkills: boolean
  updateVariadicSkills: boolean
  updateAllSupported: boolean
  repairViaInstallForce: boolean
}

/**
 * Represents a single planned CLI invocation.
 */
export interface PlannedInvocation {
  operation: OperationType
  args: string[]
  scope: LifecycleScopeHint
  agents: string[]
  skillNames: string[]
}

/**
 * Represents a sequence of CLI invocations to fulfill a batch operation.
 */
export interface CliInvocationPlan {
  batchId: string
  mode: 'native-batch' | 'emulated-batch'
  invocations: PlannedInvocation[]
  notes: string[]
}

const DEFAULT_CAPABILITIES: CliCapabilities = {
  installVariadicSkills: true,
  removeVariadicSkills: true,
  updateVariadicSkills: false,
  updateAllSupported: true,
  repairViaInstallForce: true,
}

/**
 * Returns the CLI capabilities currently available.
 *
 * @returns An object defining supported CLI features.
 */
export function getCliCapabilities(): CliCapabilities {
  return DEFAULT_CAPABILITIES
}

/**
 * Normalizes a scope hint into a list of specific scopes.
 *
 * @param scope - The requested scope hint.
 * @returns An array of concrete scopes to target.
 */
function buildScopeList(scope: LifecycleScopeHint): LifecycleScopeHint[] {
  if (scope === 'all') {
    return ['local', 'global']
  }
  return [scope]
}

/**
 * Appends skill name arguments to a command base.
 *
 * @param commonArgs - The base command arguments.
 * @param skills - The skill names to append.
 * @returns The new argument array including skills.
 */
function buildSkillArgs(commonArgs: string[], skills: string[]): string[] {
  if (skills.length === 0) return commonArgs
  return [...commonArgs, '-s', ...skills]
}

/**
 * Appends agent id arguments to a command base.
 *
 * @param commonArgs - The base command arguments.
 * @param agents - The agent ids to append.
 * @returns The new argument array including agents.
 */
function buildAgentArgs(commonArgs: string[], agents?: string[]): string[] {
  if (!agents?.length) return commonArgs
  return [...commonArgs, '-a', ...agents]
}

/**
 * Plans a sequence of CLI invocations to fulfill a batch selection.
 *
 * @param selection - The batch operation details.
 * @param capabilities - The CLI capabilities available.
 * @returns The planned sequence of CLI invocations.
 */
export function planBatch(
  selection: LifecycleBatchSelection,
  capabilities: CliCapabilities = getCliCapabilities(),
): CliInvocationPlan {
  const notes: string[] = []
  const batchId = randomUUID()
  const invocations: PlannedInvocation[] = []

  const agentList = selection.agents ?? []

  switch (selection.action) {
    case 'install':
    case 'remove': {
      if (selection.skills.length === 0) {
        throw new Error('No skills selected for batch install/remove')
      }

      for (const scope of buildScopeList(selection.scope)) {
        const base = [selection.action]
        const args = buildAgentArgs(buildSkillArgs(base, selection.skills), agentList)
        const invocation: PlannedInvocation = {
          operation: selection.action,
          args: scope === 'global' ? [...args, '-g'] : args,
          scope,
          agents: agentList,
          skillNames: selection.skills,
        }
        invocations.push(invocation)
      }
      break
    }
    case 'update': {
      if (selection.updateAll) {
        if (!capabilities.updateAllSupported) {
          throw new Error('Update-all is not supported by the CLI')
        }
        invocations.push({
          operation: 'update',
          args: ['update'],
          scope: 'auto',
          agents: [],
          skillNames: [],
        })
        notes.push('Using CLI update-all command')
      } else {
        if (selection.skills.length === 0) {
          throw new Error('No skills selected for update')
        }

        if (selection.skills.length === 1) {
          invocations.push({
            operation: 'update',
            args: ['update', '-s', selection.skills[0]],
            scope: 'auto',
            agents: [],
            skillNames: [selection.skills[0]],
          })
        } else {
          notes.push('Emulating multi-skill update via sequential invocations due to CLI limitations')
          for (const skill of selection.skills) {
            invocations.push({
              operation: 'update',
              args: ['update', '-s', skill],
              scope: 'auto',
              agents: [],
              skillNames: [skill],
            })
          }
        }
      }
      break
    }
    case 'repair': {
      if (selection.skills.length === 0) {
        throw new Error('No skills selected for repair')
      }

      for (const scope of buildScopeList(selection.scope)) {
        const base = ['install']
        const args = buildAgentArgs(buildSkillArgs([...base, '-f'], selection.skills), agentList)
        const invocation: PlannedInvocation = {
          operation: 'repair',
          args: scope === 'global' ? [...args, '-g'] : args,
          scope,
          agents: agentList,
          skillNames: selection.skills,
        }
        invocations.push(invocation)
      }
      notes.push('Repair maps to install --force semantics')
      break
    }
  }

  const mode =
    selection.action === 'update' && selection.skills.length > 1 && !selection.updateAll
      ? 'emulated-batch'
      : 'native-batch'

  return {
    batchId,
    mode,
    invocations,
    notes,
  }
}
