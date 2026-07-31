import { type FastMCP, UserError } from 'fastmcp'
import ky from 'ky'
import { z } from 'zod'

import { buildSkillsBaseUrl, resolveCdnRef } from '../cdn'
import { fetchAndVerifySkillFiles } from '../integrity'
import type { Indexes } from '../types'
import { buildReadSkillOutput, getMainSkillFile, getReferenceFiles, stripFrontmatter } from './core/skill'

const TOOL_DESCRIPTION =
  "Step 2 of 3. Returns a skill's instructions plus the list of files it bundles.\n" +
  'Input: the exact name from search_skills, or one the user named directly.\n' +
  'Then: apply the instructions. Only fetch a bundled file if they tell you to.'

export function registerSkillTool(server: FastMCP, getIndexes: () => Indexes): void {
  server.addTool({
    name: 'read_skill',
    description: TOOL_DESCRIPTION,
    parameters: z.object({ skill_name: z.string() }),
    annotations: { title: 'Read Skill Instructions', readOnlyHint: true, openWorldHint: true },
    execute: async (args) => {
      const skill = getIndexes().map.get(args.skill_name)
      if (!skill) throw new UserError(`Skill '${args.skill_name}' not found. Use search_skills to find valid names.`)
      const mainFile = getMainSkillFile(skill, args.skill_name)

      let verifiedFiles: Map<string, string>
      try {
        const cdnRef = await resolveCdnRef()
        const skillsBaseUrl = buildSkillsBaseUrl(cdnRef)
        verifiedFiles = await fetchAndVerifySkillFiles(skill, skillsBaseUrl, (url) => ky.get(url).text())
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (message.includes('Checksum mismatch')) {
          throw new UserError(message)
        }
        throw new UserError('CDN unavailable or skill integrity check failed. Try again shortly.')
      }

      const mainContent = verifiedFiles.get(mainFile)
      if (mainContent === undefined) {
        throw new UserError(`Skill '${args.skill_name}' is missing ${mainFile} after integrity verification.`)
      }

      const referenceFiles = getReferenceFiles(skill)
      return buildReadSkillOutput(stripFrontmatter(mainContent), referenceFiles)
    },
  })
}
