import type { Catalog } from '../catalog'
import { CatalogUnavailableError } from '../catalog'
import { buildIndexes } from '../registry'
import { createRegistry } from '../tools/__tests__/helpers'
import { ListSkillsOutputSchema } from '../tools/list-tool'
import { SearchSkillsOutputSchema } from '../tools/search-tool'
import { ReadSkillOutputSchema } from '../tools/skill-tool'
import type { Registry } from '../types'
import { connectInProcess } from './support/mcp-client'

type ToolResult = {
  content: Array<{ type: string; text?: string }>
  structuredContent?: unknown
  isError?: boolean
}

function fakeCatalog(registry: Registry, files: Record<string, Record<string, string>> = {}): Catalog {
  const indexes = buildIndexes(registry)
  return {
    warm: () => undefined,
    close: () => undefined,
    list: async () => [...indexes.map.values()],
    get: async (name) => indexes.map.get(name),
    search: async (query, limit) => indexes.fuse.search(query).slice(0, limit),
    registry: async () => registry,
    read: async (skill) =>
      new Map(Object.entries(files[skill.name] ?? {}).map(([path, text]) => [path, new TextEncoder().encode(text)])),
  }
}

function unavailableCatalog(): Catalog {
  const fail = async (): Promise<never> => {
    throw new CatalogUnavailableError()
  }
  return {
    warm: () => undefined,
    close: () => undefined,
    list: fail,
    get: fail,
    search: fail,
    registry: fail,
    read: fail,
  }
}

async function callTool(catalog: Catalog, name: string, args: Record<string, unknown>): Promise<ToolResult> {
  const client = await connectInProcess(catalog)
  const response = await client.rpc('tools/call', { name, arguments: args })
  return response.result as ToolResult
}

const sampleRegistry = createRegistry([
  { name: 'react-best-practices', description: 'React optimization guidance.', category: 'quality' },
  { name: 'aws-advisor', description: 'AWS cloud advisor.', category: 'cloud' },
])

describe('createServer', () => {
  it('returns instructions naming the four workflow tools', async () => {
    const client = await connectInProcess(fakeCatalog(sampleRegistry))
    const instructions = String(client.initialized.result?.instructions)

    for (const tool of ['search_skills', 'read_skill', 'fetch_skill_files', 'prepare_skill_files']) {
      expect(instructions).toContain(tool)
    }
  })

  it('reports the version it was created with in serverInfo', async () => {
    const client = await connectInProcess(fakeCatalog(sampleRegistry), '9.8.7')

    expect(client.initialized.result?.serverInfo).toEqual({ name: 'agent-skills-mcp', version: '9.8.7' })
  })
})

describe('search_skills', () => {
  it('returns the no-match message when nothing matches', async () => {
    const result = await callTool(fakeCatalog(sampleRegistry), 'search_skills', { query: 'kubernetes' })

    expect(result.structuredContent).toEqual({
      results: [],
      message: 'No skills matched your query. Try different keywords.',
    })
  })

  it('maps the fields of a matched skill', async () => {
    const result = await callTool(fakeCatalog(sampleRegistry), 'search_skills', { query: 'react' })
    const payload = result.structuredContent as { results: Array<{ name: string; category: string; score: number }> }

    expect(payload.results[0].name).toBe('react-best-practices')
    expect(payload.results[0].category).toBe('quality')
    expect(payload.results[0].score).toBeGreaterThanOrEqual(0)
    expect(payload.results[0].score).toBeLessThanOrEqual(100)
  })

  it('returns structuredContent conforming to its outputSchema and the same JSON as text', async () => {
    for (const query of ['react', 'kubernetes-helm-chart-nothing-matches']) {
      const result = await callTool(fakeCatalog(sampleRegistry), 'search_skills', { query })

      expect(SearchSkillsOutputSchema.safeParse(result.structuredContent).success).toBe(true)
      expect(JSON.parse(String(result.content[0].text))).toEqual(result.structuredContent)
    }
  })

  it('returns the catalog unavailable error as a tool error', async () => {
    const result = await callTool(unavailableCatalog(), 'search_skills', { query: 'react' })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toBe('Skill catalog unavailable. Try again shortly.')
  })

  it('rejects an empty query as a tool error', async () => {
    const result = await callTool(fakeCatalog(sampleRegistry), 'search_skills', { query: '' })

    expect(result.isError).toBe(true)
  })
})

describe('list_skills', () => {
  it('returns the catalog grouped by category as structuredContent', async () => {
    const result = await callTool(fakeCatalog(sampleRegistry), 'list_skills', { explicit_request: true })
    const payload = result.structuredContent as { total_skills: number; categories: Array<{ category: string }> }

    expect(ListSkillsOutputSchema.safeParse(payload).success).toBe(true)
    expect(payload.total_skills).toBe(2)
    expect(payload.categories.map((group) => group.category).sort()).toEqual(['cloud', 'quality'])
  })

  it('refuses a call without the explicit request flag', async () => {
    const result = await callTool(fakeCatalog(sampleRegistry), 'list_skills', {})

    expect(result.isError).toBe(true)
  })
})

const skillRegistry = createRegistry([
  {
    name: 'docs-writer',
    description: 'Write docs.',
    files: ['SKILL.md', 'references/style.md', 'scripts/check.sh'],
  },
])
const skillFiles = {
  'docs-writer': {
    'SKILL.md': '---\nname: docs-writer\ndescription: Write docs.\n---\n\n# Docs writer\n\nRead references/style.md.\n',
    'references/style.md': '# Style\n',
    'scripts/check.sh': 'echo ok\n',
  },
}

describe('read_skill', () => {
  it('returns isError naming search_skills for an unknown skill', async () => {
    const result = await callTool(fakeCatalog(skillRegistry, skillFiles), 'read_skill', { skill_name: 'nope' })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('search_skills')
  })

  it('returns the instructions without frontmatter and the bundled files as structuredContent', async () => {
    const result = await callTool(fakeCatalog(skillRegistry, skillFiles), 'read_skill', { skill_name: 'docs-writer' })

    expect(result.structuredContent).toEqual({
      skill_name: 'docs-writer',
      instructions: '# Docs writer\n\nRead references/style.md.\n',
      reference_files: ['references/style.md', 'scripts/check.sh'],
    })
    expect(ReadSkillOutputSchema.safeParse(result.structuredContent).success).toBe(true)
  })

  it('keeps the 0.1.11 text blocks: the instructions, then the file list', async () => {
    const result = await callTool(fakeCatalog(skillRegistry, skillFiles), 'read_skill', { skill_name: 'docs-writer' })

    expect(result.content.map((block) => block.text)).toEqual([
      '# Docs writer\n\nRead references/style.md.\n',
      'references/style.md\nscripts/check.sh',
    ])
  })

  it('returns the CDN message when a file download fails without a checksum mismatch', async () => {
    const catalog: Catalog = {
      ...fakeCatalog(skillRegistry, skillFiles),
      read: async () => {
        throw new Error("Failed to download skill files for 'docs-writer': SKILL.md")
      },
    }

    const result = await callTool(catalog, 'read_skill', { skill_name: 'docs-writer' })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toBe('CDN unavailable or skill integrity check failed. Try again shortly.')
  })

  it('passes a checksum mismatch through as the tool error', async () => {
    const catalog: Catalog = {
      ...fakeCatalog(skillRegistry, skillFiles),
      read: async () => {
        throw new Error("Checksum mismatch for skill 'docs-writer': expected a, got b.")
      },
    }

    const result = await callTool(catalog, 'read_skill', { skill_name: 'docs-writer' })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toBe("Checksum mismatch for skill 'docs-writer': expected a, got b.")
  })
})
