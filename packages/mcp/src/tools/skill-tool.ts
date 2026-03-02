import { type FastMCP, UserError } from 'fastmcp'
import ky from 'ky'
import { z } from 'zod'

import { Indexes } from '../types'
import { buildCdnUrl } from '../utils'
import { buildReadSkillOutput, getMainSkillFile, getReferenceFiles } from './core/skill'

const TOOL_DESCRIPTION =
  'Step 2 of 3. Retrieves a skill by name and returns its full instructions.\n' +
  'When to call: (a) After search_skills, using the skill name from results. ' +
  '(b) Directly, if the user explicitly requests a skill by name (e.g. "use the codenavi skill").\n' +
  'Input: The exact skill name (kebab-case, e.g. "react-composition-patterns").\n' +
  "Returns: [0] The skill's main instructions (SKILL.md). [1] A list of available reference file paths (scripts/, references/, assets/).\n" +
  'Then: Apply the skill instructions. Only call fetch_skill_files if the instructions reference specific files you need.'

export function registerSkillTool(server: FastMCP, getIndexes: () => Indexes): void {
  server.addTool({
    name: 'read_skill',
    description: TOOL_DESCRIPTION,
    parameters: z.object({ skill_name: z.string() }),
    annotations: { readOnlyHint: true, openWorldHint: true },
    execute: async (args) => {
      const skill = getIndexes().map.get(args.skill_name)
      if (!skill) throw new UserError(`Skill '${args.skill_name}' not found. Use search_skills to find valid names.`)
      const mainFile = getMainSkillFile(skill, args.skill_name)
      let mainContent: string

      try {
        mainContent = await ky.get(buildCdnUrl(skill.path, mainFile)).text()
      } catch {
        throw new UserError('CDN unavailable. Try again shortly.')
      }

      const referenceFiles = getReferenceFiles(skill)
      return buildReadSkillOutput(mainContent, referenceFiles)
    },
  })
}
