import { access } from 'node:fs/promises'
import { join } from 'node:path'
import type { VerifyResult } from '../shared/types'
import { AGENT_CONFIGS } from './installed-skills-scanner'
import type { LoggingService } from './logging-service'

/**
 * Verifies that a skill was correctly installed by checking for SKILL.md
 * in the expected target directories.
 */
export class PostInstallVerifier {
  constructor(private readonly logger: LoggingService) {}

  /**
   * Verifies installation of a skill across specified agents and scope.
   * @param skillName - Name of the skill
   * @param agents - List of agent identifiers (e.g. ['cursor', 'vscode'])
   * @param scope - Installation scope
   * @param workspaceRoot - Root of the workspace (required for local scope)
   */
  async verify(
    skillName: string,
    agents: string[],
    scope: 'local' | 'global',
    workspaceRoot: string | null,
  ): Promise<VerifyResult> {
    const corrupted: VerifyResult['corrupted'] = []

    for (const agentName of agents) {
      const config = AGENT_CONFIGS.find((c) => c.name === agentName)
      if (!config) {
        this.logger.warn(`Unknown agent '${agentName}' in verification. Skipping.`)
        continue
      }

      let expectedPath: string
      if (scope === 'local') {
        if (!workspaceRoot) {
          this.logger.warn(`Skipping local verification for '${agentName}': no workspace root.`)
          continue
        }
        expectedPath = join(workspaceRoot, config.skillsDir, skillName, 'SKILL.md')
      } else {
        expectedPath = join(config.globalSkillsDir, skillName, 'SKILL.md')
      }

      try {
        await access(expectedPath)
        // File exists, verification passed for this agent
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          // File missing - definitely corrupted
          corrupted.push({
            agent: agentName,
            scope,
            expectedPath,
          })
        } else {
          // Permission error or other FS error.
          // Log warning but do not mark as corrupted to avoid false positives?
          // Task says: "On filesystem error (not ENOENT...) log warning, treat as 'unverified' (not corrupted)"
          this.logger.warn(`Verification failed for ${agentName} at ${expectedPath}: ${error.message}`)
        }
      }
    }

    return {
      ok: corrupted.length === 0,
      corrupted,
    }
  }
}
