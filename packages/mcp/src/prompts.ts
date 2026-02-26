import type { FastMCP } from 'fastmcp'

import type { Indexes, SkillEntry } from './types'
import { buildPromptDescription, buildPromptName } from './utils'

export function registerPrompts(server: FastMCP, getIndexes: () => Indexes): void {
  registerDiscoveryPrompt(server)
  registerSkillPrompts(server, getIndexes)
}

function registerDiscoveryPrompt(server: FastMCP): void {
  server.addPrompt({
    name: 'find-skill',
    description: "Search for the best skill to accomplish a task. Use when you don't know which skill you need.",
    arguments: [
      {
        name: 'task',
        description:
          'Describe what you are trying to accomplish (e.g. "optimize React performance", "create an architecture diagram")',
        required: true,
      },
    ],
    load: async (args) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Call search_skills with a concise intent phrase describing: ${args.task}\n` +
              `Review the results — pick the best match by score (highest) and category (most relevant).\n` +
              `Prefer results with match_quality "exact" or "strong".\n` +
              `Then call read_skill to load the selected skill and follow its instructions.`,
          },
        },
      ],
    }),
  })
}

function registerSkillPrompts(server: FastMCP, getIndexes: () => Indexes): void {
  const skills = getIndexes().map

  for (const skill of skills.values()) {
    const promptName = buildPromptName(skill.name)
    const description = buildPromptDescription(skill.description)

    server.addPrompt({
      name: promptName,
      description,
      arguments: [
        { name: 'context', description: 'Optional — describe what specifically you need help with', required: false },
      ],
      load: async (args) => buildSkillPromptMessages(skill, args.context),
    })
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
