import { type FastMCP, UserError } from 'fastmcp'
import ky from 'ky'
import { z } from 'zod'

import { buildSkillsBaseUrl, resolveCdnRef } from '../cdn'
import { fetchAndVerifySkillFiles } from '../integrity'
import { getSkillStagingDir, stageSkillFiles } from '../staging'
import type { Indexes } from '../types'
import { buildFileUri, getMimeType, getUnsafeStagingPaths } from './core/staging'

const TOOL_DESCRIPTION = `Step 3 of 3 (alternative to fetch_skill_files). Writes a skill's files to disk so you can RUN them, without loading their contents into context.
When: The skill's instructions tell you to execute something — e.g. "node $SKILL_DIR/scripts/render.mjs" or "python <path-to-skill>/scripts/check.py".
Input: skill_name + optional file_paths (defaults to every scripts/, references/ and assets/ file the skill has).
Returns: The absolute skill_dir to use as $SKILL_DIR, plus one resource_link per staged file. File contents are NOT returned — read them with your own file tools only if you actually need to inspect the code.
Then: Run the command from the skill's instructions with $SKILL_DIR set to the returned skill_dir.
Lifetime: Files persist on disk under the user's cache directory and are overwritten on the next call. Every file is verified against the registry checksum before being written.`

export function registerPrepareTool(server: FastMCP, getIndexes: () => Indexes): void {
  server.addTool({
    name: 'prepare_skill_files',
    description: TOOL_DESCRIPTION,
    parameters: z.object({
      skill_name: z.string(),
      file_paths: z.array(z.string()).min(1).max(20).optional(),
    }),
    // why: this is the one tool that writes to disk, so it must not claim readOnlyHint.
    // idempotent because staging the same verified content twice yields the same files.
    annotations: {
      title: 'Stage Skill Files for Execution',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    execute: async (args) => {
      const skill = getIndexes().map.get(args.skill_name)
      if (!skill) throw new UserError(`Skill '${args.skill_name}' not found. Use search_skills to find valid names.`)

      const requested = args.file_paths ?? skill.files.filter((file) => file !== 'SKILL.md')
      if (requested.length === 0) {
        throw new UserError(`Skill '${args.skill_name}' has no reference files to stage.`)
      }

      const unknown = requested.filter((filePath) => !skill.files.includes(filePath))
      if (unknown.length > 0) {
        throw new UserError(
          `Unknown paths for '${args.skill_name}': [${unknown.join(', ')}]. Use the reference list from read_skill.`,
        )
      }

      const unsafe = getUnsafeStagingPaths(requested)
      if (unsafe.length > 0) {
        throw new UserError(
          `Refusing to stage unsafe paths: [${unsafe.join(', ')}]. Only scripts/, references/ and assets/ files are staged.`,
        )
      }

      let verified: Map<string, string>
      try {
        const cdnRef = await resolveCdnRef()
        const skillsBaseUrl = buildSkillsBaseUrl(cdnRef)
        // why: verify the whole skill set before writing any of it to disk
        verified = await fetchAndVerifySkillFiles(skill, skillsBaseUrl, (url) => ky.get(url).text())
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (message.includes('Checksum mismatch')) throw new UserError(message)
        throw new UserError('CDN unavailable or skill integrity check failed. Try again shortly.')
      }

      const toStage = new Map<string, string>()
      const missing: string[] = []
      for (const filePath of requested) {
        const content = verified.get(filePath)
        if (content === undefined) {
          missing.push(filePath)
          continue
        }
        toStage.set(filePath, content)
      }

      if (toStage.size === 0) {
        throw new UserError(`None of the requested files exist for '${args.skill_name}': ${missing.join(', ')}`)
      }

      let staged: Map<string, string>
      try {
        staged = await stageSkillFiles(args.skill_name, toStage)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new UserError(`Could not write skill files to disk: ${message}`)
      }

      const skillDir = getSkillStagingDir(args.skill_name)
      const header = [
        `Staged ${staged.size} file(s) for '${args.skill_name}' — checksum verified.`,
        `skill_dir: ${skillDir}`,
        `Run the skill's commands with SKILL_DIR=${skillDir}`,
        missing.length > 0 ? `Not in this skill: ${missing.join(', ')}` : undefined,
      ]
        .filter(Boolean)
        .join('\n')

      return {
        content: [
          { type: 'text' as const, text: header },
          ...[...staged].map(([filePath, absolutePath]) => ({
            type: 'resource_link' as const,
            uri: buildFileUri(absolutePath),
            name: filePath,
            description: `${args.skill_name} — staged for execution`,
            mimeType: getMimeType(filePath),
          })),
        ],
      }
    },
  })
}
