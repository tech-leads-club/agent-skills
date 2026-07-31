import { type FastMCP, UserError } from 'fastmcp'
import ky from 'ky'
import { z } from 'zod'

import { buildSkillsBaseUrl, resolveCdnRef } from '../cdn'
import { fetchAndVerifySkillFiles } from '../integrity'
import { type StagedFile, getSkillStagingDir, stageSkillFiles } from '../staging'
import type { Indexes } from '../types'
import { buildFileUri, getMimeType, getUnsafeStagingPaths } from './core/staging'

const TOOL_DESCRIPTION = `Step 3, for files the instructions tell you to RUN (typically scripts/). Writes them to the user's cache directory; contents never enter context.
Input: skill_name + optional paths (default: every bundled file). Set dry_run to list what would be written without writing.
Returns: skill_dir to export as $SKILL_DIR, plus a file:// link per file. Files are checksum-verified, and the directory is per skill revision.
Then: run the skill's command with SKILL_DIR set. To READ a file instead, use fetch_skill_files.`

export function registerPrepareTool(server: FastMCP, getIndexes: () => Indexes): void {
  server.addTool({
    name: 'prepare_skill_files',
    description: TOOL_DESCRIPTION,
    parameters: z.object({
      skill_name: z.string(),
      file_paths: z.array(z.string()).min(1).max(20).optional(),
      dry_run: z.boolean().optional(),
    }),
    // why: the one tool that writes to disk, so it cannot claim readOnlyHint. destructiveHint
    // is false because the write is genuinely additive — the directory is keyed on the skill
    // revision, so a new revision lands beside the old one rather than replacing it — and
    // idempotent because an identical file already on disk is left untouched. Both hints are
    // properties of the implementation here, not assurances about intent.
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

      // why: a write tool should be previewable without the client having to support elicitation.
      // Returns the exact destinations, before any network fetch or filesystem write happens.
      if (args.dry_run === true) {
        const skillDir = getSkillStagingDir(args.skill_name, skill.contentHash)
        return [
          `Dry run — nothing was written. ${requested.length} file(s) would be staged for '${args.skill_name}':`,
          `skill_dir: ${skillDir}`,
          ...requested.map((filePath) => `  ${filePath}`),
          'Call again without dry_run to write them.',
        ].join('\n')
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

      let staged: Map<string, StagedFile>
      try {
        staged = await stageSkillFiles(args.skill_name, skill.contentHash, toStage)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new UserError(`Could not write skill files to disk: ${message}`)
      }

      const skillDir = getSkillStagingDir(args.skill_name, skill.contentHash)
      const reused = [...staged.values()].filter((file) => !file.written).length
      const header = [
        `Staged ${staged.size} file(s) for '${args.skill_name}' — checksum verified.` +
          (reused > 0 ? ` ${reused} already present, unchanged.` : ''),
        `skill_dir: ${skillDir}`,
        `Run the skill's commands with SKILL_DIR=${skillDir}`,
        missing.length > 0 ? `Not in this skill: ${missing.join(', ')}` : undefined,
      ]
        .filter(Boolean)
        .join('\n')

      return {
        content: [
          { type: 'text' as const, text: header },
          ...[...staged].map(([filePath, file]) => ({
            type: 'resource_link' as const,
            uri: buildFileUri(file.path),
            name: filePath,
            description: `${args.skill_name} — staged for execution`,
            mimeType: getMimeType(filePath),
          })),
        ],
      }
    },
  })
}
