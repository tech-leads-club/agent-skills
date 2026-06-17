import type { FastMCP } from 'fastmcp'

import type { Indexes, SkillEntry } from './types'

export function registerPrompts(server: FastMCP, getIndexes: () => Indexes): void {
  registerCatalogPrompt(server)
  registerDiscoveryAliasPrompt(server)
  registerUsePrompt(server, getIndexes)
  registerHelpPrompt(server)
}

function registerCatalogPrompt(server: FastMCP): void {
  server.addPrompt({
    name: 'skills',
    description: 'Find the best skill in the catalog for a task.',
    arguments: [
      {
        name: 'task',
        description:
          'Describe what you are trying to accomplish (e.g. "optimize React performance", "create an architecture diagram")',
        required: true,
      },
    ],
    load: async (args) => buildCatalogPromptMessages(args?.task),
  })
}

function registerDiscoveryAliasPrompt(server: FastMCP): void {
  server.addPrompt({
    name: 'find-skill',
    description: 'Alias for /skills.',
    arguments: [
      {
        name: 'task',
        description:
          'Describe what you are trying to accomplish (e.g. "optimize React performance", "create an architecture diagram")',
        required: true,
      },
    ],
    load: async (args) => buildCatalogPromptMessages(args?.task),
  })
}

function registerUsePrompt(server: FastMCP, getIndexes: () => Indexes): void {
  server.addPrompt({
    name: 'use',
    description: 'Load and apply a specific skill by exact name.',
    arguments: [
      {
        name: 'name',
        description: 'Exact skill name (for example: docs-writer)',
        required: true,
      },
      {
        name: 'context',
        description: 'Optional — describe what specifically you need help with',
        required: false,
      },
    ],
    load: async (args) => {
      const skillName = args?.name?.trim()
      const skill = skillName ? getIndexes().map.get(skillName) : undefined

      if (!skill) return buildUsePromptNotFoundMessages(skillName)
      return buildSkillPromptMessages(skill, args?.context)
    },
  })
}

function registerHelpPrompt(server: FastMCP): void {
  server.addPrompt({
    name: 'skills-help',
    description: 'Show examples for using the agent-skills catalog prompts.',
    load: async () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Use /skills when you want the best match from the catalog.\n` +
              `Examples:\n` +
              `- /skills task:"refactor a large React component"\n` +
              `- /skills task:"review accessibility issues in my UI"\n` +
              `- /skills task:"plan migration from monolith to modular architecture"\n\n` +
              `Use /use when you already know the skill name.\n` +
              `Examples:\n` +
              `- /use name:"docs-writer" context:"write a README for this package"\n` +
              `- /use name:"react-best-practices" context:"improve Next.js page performance"\n\n` +
              `If unsure, start with /skills.`,
          },
        },
      ],
    }),
  })
}

export function buildCatalogPromptMessages(
  task?: string,
): { messages: Array<{ role: 'user'; content: { type: 'text'; text: string } }> } {
  const taskText = task?.trim() ?? ''
  const instructions = [
    `Call search_skills with a concise intent phrase describing: ${taskText}`,
    `Review the results and compare score and match_quality.`,
    `If top result is strong enough, call read_skill with its name and apply it.`,
    `If results are weak or ambiguous, present up to 3 best matches and ask the user to choose.`,
  ]

  return {
    messages: [{ role: 'user', content: { type: 'text', text: instructions.join('\n') } }],
  }
}

export function buildSkillPromptMessages(
  skill: SkillEntry,
  context?: string,
): { messages: Array<{ role: 'user'; content: { type: 'text'; text: string } }> } {
  const instructions = [
    `Call read_skill with skill_name="${skill.name}" to load its full instructions.`,
    `Then follow the skill's guidance carefully.`,
  ]

  if (context) instructions.push(`Apply the skill to accomplish: ${context}`)

  return {
    messages: [{ role: 'user', content: { type: 'text', text: instructions.join('\n') } }],
  }
}

export function buildUsePromptNotFoundMessages(
  skillName?: string,
): { messages: Array<{ role: 'user'; content: { type: 'text'; text: string } }> } {
  const requested = skillName && skillName.length > 0 ? skillName : '(empty)'
  return {
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text:
            `Skill "${requested}" was not found in the catalog.\n` +
            `Call search_skills with a concise intent phrase to find the correct name,\n` +
            `then call read_skill with the selected result.`,
        },
      },
    ],
  }
}
