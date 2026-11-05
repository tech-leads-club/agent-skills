import type { McpServer } from '@modelcontextprotocol/server'
import { join } from 'node:path'
import { z } from 'zod'

import type { Catalog } from '../catalog'
import { type StagedFile, getSkillStagingDir, pruneSupersededRevisions, stageSkillFiles } from '../staging'
import { buildDryRunPreview, buildFileUri, getMimeType, getUnsafeStagingPaths } from './core/staging'
import { readVerifiedSkill } from './skill-tool'

const TOOL_DESCRIPTION = `Step 3, for files the instructions tell you to RUN (typically scripts/). Writes them to the user's cache directory; contents never enter context.
Input: skill_name + optional paths (default: every bundled file). Set dry_run to list what would be written without writing.
Returns: skill_dir to export as $SKILL_DIR, plus a file:// link per file. Files are checksum-verified, and the directory is per skill revision.
Then: run the skill's command with SKILL_DIR set. To READ a file instead, use fetch_skill_files.`

export const PrepareSkillFilesOutputSchema = z.object({
  skill_name: z.string(),
  skill_dir: z.string(),
  dry_run: z.boolean(),
  files: z.array(z.object({ path: z.string(), uri: z.string(), written: z.boolean().optional() })),
  missing: z.array(z.string()),
  reclaimed_revisions: z.number().int(),
})

export function registerPrepareTool(server: McpServer, catalog: Catalog): void {
  server.registerTool(
    'prepare_skill_files',
    {
      description: TOOL_DESCRIPTION,
      inputSchema: z.strictObject({
        skill_name: z.string(),
        file_paths: z.array(z.string()).min(1).max(20).optional(),
        dry_run: z.boolean().optional(),
      }),
      outputSchema: PrepareSkillFilesOutputSchema,
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
    },
    async ({ skill_name, file_paths, dry_run }) => {
      const skill = await catalog.get(skill_name)
      if (!skill) throw new Error(`Skill '${skill_name}' not found. Use search_skills to find valid names.`)

      const requested = file_paths ?? skill.files.filter((file) => file !== 'SKILL.md')
      if (requested.length === 0) {
        throw new Error(`Skill '${skill_name}' has no reference files to stage.`)
      }

      const unknown = requested.filter((filePath) => !skill.files.includes(filePath))
      if (unknown.length > 0) {
        throw new Error(
          `Unknown paths for '${skill_name}': [${unknown.join(', ')}]. Use the reference list from read_skill.`,
        )
      }

      const unsafe = getUnsafeStagingPaths(requested)
      if (unsafe.length > 0) {
        throw new Error(
          `Refusing to stage unsafe paths: [${unsafe.join(', ')}]. Paths must be skill-relative files listed by read_skill.`,
        )
      }

      const skillDir = getSkillStagingDir(skill_name, skill.contentHash)

      // why: a write tool should be previewable without the client having to support elicitation.
      // Returns before any network fetch or filesystem write happens.
      if (dry_run === true) {
        return {
          content: [{ type: 'text', text: buildDryRunPreview(skill_name, skillDir, requested) }],
          structuredContent: {
            skill_name,
            skill_dir: skillDir,
            dry_run: true,
            files: requested.map((path) => ({ path, uri: buildFileUri(join(skillDir, path)) })),
            missing: [],
            reclaimed_revisions: 0,
          },
        }
      }

      const { files: verified } = await readVerifiedSkill(catalog, skill_name)

      const toStage = new Map<string, Uint8Array>()
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
        throw new Error(`None of the requested files exist for '${skill_name}': ${missing.join(', ')}`)
      }

      let staged: Map<string, StagedFile>
      try {
        staged = await stageSkillFiles(skill_name, skill.contentHash, toStage)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Could not write skill files to disk: ${message}`, { cause: error })
      }

      const pruned = await pruneSupersededRevisions(skill_name, skill.contentHash)

      const reused = [...staged.values()].filter((file) => !file.written).length
      const header = [
        `Staged ${staged.size} file(s) for '${skill_name}' — checksum verified.` +
          (reused > 0 ? ` ${reused} already present, unchanged.` : ''),
        `skill_dir: ${skillDir}`,
        `Run the skill's commands with SKILL_DIR=${skillDir}`,
        pruned.length > 0 ? `Reclaimed ${pruned.length} superseded revision(s).` : undefined,
        missing.length > 0 ? `Not in this skill: ${missing.join(', ')}` : undefined,
      ]
        .filter(Boolean)
        .join('\n')

      return {
        content: [
          { type: 'text', text: header },
          ...[...staged].map(([filePath, file]) => ({
            type: 'resource_link' as const,
            uri: buildFileUri(file.path),
            name: filePath,
            description: `${skill_name} — staged for execution`,
            mimeType: getMimeType(filePath),
          })),
        ],
        structuredContent: {
          skill_name,
          skill_dir: skillDir,
          dry_run: false,
          files: [...staged].map(([path, file]) => ({ path, uri: buildFileUri(file.path), written: file.written })),
          missing,
          reclaimed_revisions: pruned.length,
        },
      }
    },
  )
}
