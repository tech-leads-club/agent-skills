import type { McpServer } from '@modelcontextprotocol/server'
import { z } from 'zod'

import type { Catalog } from '../catalog'
import { decodeSkillText } from '../integrity'
import { buildReadSkillOutput, getMainSkillFile, getReferenceFiles, stripFrontmatter } from './core/skill'

const TOOL_DESCRIPTION =
  "Step 2 of 3. Returns a skill's instructions plus the list of files it bundles.\n" +
  'Input: the exact name from search_skills, or one the user named directly.\n' +
  'Then: apply the instructions. Only fetch a bundled file if they tell you to.'

const CDN_FAILURE_MESSAGE = 'CDN unavailable or skill integrity check failed. Try again shortly.'

export const ReadSkillOutputSchema = z.object({
  skill_name: z.string(),
  instructions: z.string(),
  reference_files: z.array(z.string()),
})

export async function readVerifiedSkill(catalog: Catalog, skillName: string) {
  const skill = await catalog.get(skillName)
  if (!skill) throw new Error(`Skill '${skillName}' not found. Use search_skills to find valid names.`)

  try {
    return { skill, files: await catalog.read(skill) }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(message.includes('Checksum mismatch') ? message : CDN_FAILURE_MESSAGE, { cause: error })
  }
}

export function registerSkillTool(server: McpServer, catalog: Catalog): void {
  server.registerTool(
    'read_skill',
    {
      description: TOOL_DESCRIPTION,
      inputSchema: z.strictObject({ skill_name: z.string() }),
      outputSchema: ReadSkillOutputSchema,
      annotations: { title: 'Read Skill Instructions', readOnlyHint: true, openWorldHint: true },
    },
    async ({ skill_name }) => {
      const { skill, files } = await readVerifiedSkill(catalog, skill_name)
      const mainFile = getMainSkillFile(skill, skill_name)
      const mainBytes = files.get(mainFile)
      if (mainBytes === undefined) {
        throw new Error(`Skill '${skill_name}' is missing ${mainFile} after integrity verification.`)
      }

      const instructions = stripFrontmatter(decodeSkillText(mainBytes))
      const referenceFiles = getReferenceFiles(skill)
      const output = buildReadSkillOutput(instructions, referenceFiles)

      return {
        content: typeof output === 'string' ? [{ type: 'text', text: output }] : output.content,
        structuredContent: { skill_name, instructions, reference_files: referenceFiles },
      }
    },
  )
}
