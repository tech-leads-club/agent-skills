import { join } from 'node:path'

import { type Tiktoken, getEncoding } from 'js-tiktoken'

import type { CorePorts } from '../ports'
import type { AgentType, CostEstimate, ProviderPricing, SkillTokenEstimate } from '../types'

let _encoding: Tiktoken | null = null

function getEncoder(): Tiktoken {
  if (!_encoding) {
    _encoding = getEncoding('cl100k_base')
  }
  return _encoding
}

export const DEFAULT_PROVIDERS: ProviderPricing[] = [
  { name: 'Anthropic', model: 'Claude Opus', inputCostPerMTok: 15, outputCostPerMTok: 75 },
  { name: 'Anthropic', model: 'Claude Sonnet', inputCostPerMTok: 3, outputCostPerMTok: 15 },
  { name: 'OpenAI', model: 'GPT-4o', inputCostPerMTok: 2.5, outputCostPerMTok: 10 },
]

const HIGH_COST_THRESHOLD_DEFAULT = 5000

/** @deprecated Use `estimateTokensFromText` for accurate BPE token counts. */
export function estimateTokensFromChars(charCount: number): number {
  if (charCount <= 0) return 0
  return Math.ceil(charCount / 4)
}

export function estimateTokensFromText(text: string): number {
  if (!text) return 0
  return getEncoder().encode(text).length
}

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---/

function extractDescription(content: string): string {
  const match = content.match(FRONTMATTER_REGEX)
  if (!match) return ''
  const frontmatter = match[1]
  const descMatch = frontmatter.match(/^description:\s*(.+(?:\n(?!\S).*)*)/m)
  if (!descMatch) return ''
  return descMatch[1].trim()
}

function extractBody(content: string): string {
  const match = content.match(FRONTMATTER_REGEX)
  if (!match) return content
  return content.slice(match[0].length).trim()
}

async function sumResourceTokens(ports: CorePorts, skillPath: string): Promise<number> {
  const resourceDirs = ['scripts', 'references', 'assets', 'templates']
  let totalTokens = 0

  for (const dir of resourceDirs) {
    const dirPath = join(skillPath, dir)
    if (!ports.fs.existsSync(dirPath)) continue

    try {
      const entries = await ports.fs.readdir(dirPath, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory()) continue
        try {
          const content = await ports.fs.readFile(join(dirPath, entry.name), 'utf-8')
          totalTokens += estimateTokensFromText(content)
        } catch {
          // skip unreadable
        }
      }
    } catch {
      // skip unreadable dirs
    }
  }

  return totalTokens
}

export async function estimateSkillTokens(
  ports: CorePorts,
  skillPath: string,
  skillName: string,
  agent: AgentType,
  location: 'local' | 'global',
  highCostThreshold = HIGH_COST_THRESHOLD_DEFAULT,
): Promise<SkillTokenEstimate> {
  const skillMdPath = join(skillPath, 'SKILL.md')

  let description = ''
  let body = ''

  try {
    const content = await ports.fs.readFile(skillMdPath, 'utf-8')
    description = extractDescription(content)
    body = extractBody(content)
  } catch {
    // SKILL.md missing or unreadable
  }

  const descriptionTokens = estimateTokensFromText(description)
  const bodyTokens = estimateTokensFromText(body)
  const resourceTokens = await sumResourceTokens(ports, skillPath)
  const totalTokens = descriptionTokens + bodyTokens + resourceTokens

  return {
    skillName,
    agent,
    location,
    descriptionTokens,
    bodyTokens,
    resourceTokens,
    totalTokens,
    isHighCost: totalTokens > highCostThreshold,
  }
}

export function estimateCosts(totalTokens: number, providers?: ProviderPricing[]): CostEstimate[] {
  const pricingList = providers ?? DEFAULT_PROVIDERS

  return pricingList.map((provider) => ({
    provider,
    totalInputTokens: totalTokens,
    estimatedInputCost: (totalTokens / 1_000_000) * provider.inputCostPerMTok,
  }))
}
