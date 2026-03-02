import type { FastMCP } from 'fastmcp'

import { buildIndexes } from '../../registry'
import { registerSearchTool } from '../search-tool'
import { createRegistry } from './helpers'

type RegisteredTool = {
  name: string
  execute: (args: { query: string }) => Promise<unknown>
}

class FakeServer {
  public tool?: RegisteredTool

  addTool(tool: RegisteredTool): void {
    this.tool = tool
  }
}

describe('registerSearchTool', () => {
  it('should register search_skills tool', () => {
    const server = new FakeServer()
    const indexes = buildIndexes(createRegistry([]))
    registerSearchTool(server as unknown as FastMCP, () => indexes)
    expect(server.tool?.name).toBe('search_skills')
  })

  it('should return explanatory message when no matches', async () => {
    const server = new FakeServer()
    const indexes = buildIndexes(createRegistry([{ name: 'aws-advisor', description: 'AWS helper.' }]))
    registerSearchTool(server as unknown as FastMCP, () => indexes)
    const output = (await server.tool?.execute({ query: 'kubernetes' })) as string
    const parsed = JSON.parse(output) as { results: unknown[]; message: string }
    expect(parsed.results).toEqual([])
    expect(parsed.message).toContain('No skills matched')
  })

  it('should map output fields for matched skills', async () => {
    const server = new FakeServer()
    const indexes = buildIndexes(
      createRegistry([
        { name: 'react-best-practices', description: 'React optimization guidance.', category: 'quality' },
      ]),
    )
    registerSearchTool(server as unknown as FastMCP, () => indexes)

    const output = (await server.tool?.execute({ query: 'react' })) as string
    const parsed = JSON.parse(output) as {
      results: Array<{
        name: string
        description: string
        category: string
        usage_hint: string
        score: number
        match_quality: 'exact' | 'strong' | 'partial' | 'weak'
      }>
    }

    expect(parsed.results.length).toBeGreaterThan(0)
    expect(parsed.results[0].name).toBe('react-best-practices')
    expect(parsed.results[0].category).toBe('quality')
    expect(parsed.results[0].score).toBeGreaterThanOrEqual(0)
    expect(parsed.results[0].score).toBeLessThanOrEqual(100)
  })
})
