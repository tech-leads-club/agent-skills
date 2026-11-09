import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { Catalog } from '../catalog'
import { CatalogUnavailableError } from '../catalog'
import { buildIndexes } from '../registry'
import { createRegistry } from '../tools/__tests__/helpers'
import { FetchSkillFilesOutputSchema } from '../tools/fetcher-tool'
import { ListSkillsOutputSchema } from '../tools/list-tool'
import { PrepareSkillFilesOutputSchema } from '../tools/prepare-tool'
import { SearchSkillsOutputSchema } from '../tools/search-tool'
import { ReadSkillOutputSchema } from '../tools/skill-tool'
import type { Registry } from '../types'
import { connectInProcess, findWorkspaceRoot } from './support/mcp-client'

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
    const calls: Array<[string, Record<string, unknown>]> = [
      ['read_skill', { skill_name: 'nope' }],
      ['fetch_skill_files', { skill_name: 'nope', file_paths: ['references/style.md'] }],
      ['prepare_skill_files', { skill_name: 'nope' }],
      ['prepare_skill_files', { skill_name: 'nope', dry_run: true }],
    ]

    for (const [name, args] of calls) {
      const result = await callTool(fakeCatalog(skillRegistry, skillFiles), name, args)

      expect({ name, isError: result.isError }).toEqual({ name, isError: true })
      expect(result.content[0].text).toContain('search_skills')
    }
  })

  it('rejects an argument the input schema does not declare, as a tool error', async () => {
    const result = await callTool(fakeCatalog(sampleRegistry), 'search_skills', { query: 'react', limit: 3 })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('limit')
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

describe('fetch_skill_files', () => {
  it('returns the 0.1.11 text and the files as structuredContent', async () => {
    const result = await callTool(fakeCatalog(skillRegistry, skillFiles), 'fetch_skill_files', {
      skill_name: 'docs-writer',
      file_paths: ['references/style.md'],
    })

    expect(result.content[0].text).toBe('## references/style.md\n\n# Style\n')
    expect(result.structuredContent).toEqual({
      skill_name: 'docs-writer',
      files: [{ path: 'references/style.md', text: '# Style\n', truncated: false }],
      omitted: [],
    })
    expect(FetchSkillFilesOutputSchema.safeParse(result.structuredContent).success).toBe(true)
  })

  it('refuses a path read_skill does not list', async () => {
    const result = await callTool(fakeCatalog(skillRegistry, skillFiles), 'fetch_skill_files', {
      skill_name: 'docs-writer',
      file_paths: ['../../etc/passwd'],
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('Invalid paths: [../../etc/passwd]')
  })

  it('returns isError naming search_skills for an unknown skill', async () => {
    const result = await callTool(fakeCatalog(skillRegistry, skillFiles), 'fetch_skill_files', {
      skill_name: 'nope',
      file_paths: ['references/style.md'],
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('search_skills')
  })

  it('refuses more than 5 paths', async () => {
    const result = await callTool(fakeCatalog(skillRegistry, skillFiles), 'fetch_skill_files', {
      skill_name: 'docs-writer',
      file_paths: ['a', 'b', 'c', 'd', 'e', 'f'],
    })

    expect(result.isError).toBe(true)
  })
})

const TOOLS_0_1_11 = [
  {
    name: 'search_skills',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          minLength: 1,
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
    annotations: {
      title: 'Find Skills by Intent',
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  {
    name: 'list_skills',
    inputSchema: {
      type: 'object',
      properties: {
        explicit_request: {
          type: 'boolean',
          const: true,
        },
        description_max_chars: {
          default: 120,
          type: 'integer',
          minimum: 40,
          maximum: 240,
        },
      },
      required: ['explicit_request'],
      additionalProperties: false,
    },
    annotations: {
      title: 'Browse Skill Catalog',
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  {
    name: 'read_skill',
    inputSchema: {
      type: 'object',
      properties: {
        skill_name: {
          type: 'string',
        },
      },
      required: ['skill_name'],
      additionalProperties: false,
    },
    annotations: {
      title: 'Read Skill Instructions',
      readOnlyHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'fetch_skill_files',
    inputSchema: {
      type: 'object',
      properties: {
        skill_name: {
          type: 'string',
        },
        file_paths: {
          minItems: 1,
          maxItems: 5,
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
      required: ['skill_name', 'file_paths'],
      additionalProperties: false,
    },
    annotations: {
      title: 'Fetch Skill Reference Files',
      readOnlyHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'prepare_skill_files',
    inputSchema: {
      type: 'object',
      properties: {
        skill_name: {
          type: 'string',
        },
        file_paths: {
          minItems: 1,
          maxItems: 20,
          type: 'array',
          items: {
            type: 'string',
          },
        },
        dry_run: {
          type: 'boolean',
        },
      },
      required: ['skill_name'],
      additionalProperties: false,
    },
    annotations: {
      title: 'Stage Skill Files for Execution',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
]

type ListedTool = { name: string; inputSchema: Record<string, unknown>; outputSchema?: unknown; annotations?: unknown }

async function listTools(): Promise<ListedTool[]> {
  const client = await connectInProcess(fakeCatalog(skillRegistry, skillFiles))
  const response = await client.rpc('tools/list')
  return (response.result?.tools ?? []) as ListedTool[]
}

describe('tools/list', () => {
  it('lists the five tools in the 0.1.11 order', async () => {
    const tools = await listTools()

    expect(tools.map((tool) => tool.name)).toEqual([
      'search_skills',
      'list_skills',
      'read_skill',
      'fetch_skill_files',
      'prepare_skill_files',
    ])
  })

  it('keeps each tool input and hints from 0.1.11', async () => {
    const tools = await listTools()
    const surface = tools.map(({ name, inputSchema, annotations }) => {
      const schema = { ...inputSchema }
      delete schema.$schema
      return { name, inputSchema: schema, annotations }
    })

    expect(surface).toEqual(TOOLS_0_1_11)
  })

  it('declares an outputSchema on every tool', async () => {
    const tools = await listTools()

    for (const tool of tools) {
      expect(tool.outputSchema).toEqual(expect.objectContaining({ type: 'object' }))
    }
  })
})

describe('prepare_skill_files', () => {
  let stagingDir: string
  const previous = process.env.SKILLS_STAGING_DIR

  beforeEach(() => {
    stagingDir = mkdtempSync(join(tmpdir(), 'mcp-staging-'))
    process.env.SKILLS_STAGING_DIR = stagingDir
  })

  afterEach(() => {
    rmSync(stagingDir, { recursive: true, force: true })
    if (previous === undefined) delete process.env.SKILLS_STAGING_DIR
    else process.env.SKILLS_STAGING_DIR = previous
  })

  it('previews a dry run as structuredContent without writing', async () => {
    const result = await callTool(fakeCatalog(skillRegistry, skillFiles), 'prepare_skill_files', {
      skill_name: 'docs-writer',
      dry_run: true,
    })
    const payload = result.structuredContent as { dry_run: boolean; skill_dir: string; files: Array<{ path: string }> }

    expect(PrepareSkillFilesOutputSchema.safeParse(payload).success).toBe(true)
    expect(payload.dry_run).toBe(true)
    expect(payload.skill_dir.startsWith(stagingDir)).toBe(true)
    expect(payload.files.map((file) => file.path)).toEqual(['references/style.md', 'scripts/check.sh'])
    expect(result.content[0].text).toContain('Dry run — nothing was written.')
  })

  it('stages the files, links them and reports them as structuredContent', async () => {
    const result = await callTool(fakeCatalog(skillRegistry, skillFiles), 'prepare_skill_files', {
      skill_name: 'docs-writer',
      file_paths: ['scripts/check.sh'],
    })
    const payload = result.structuredContent as {
      dry_run: boolean
      files: Array<{ path: string; uri: string; written?: boolean }>
    }

    expect(PrepareSkillFilesOutputSchema.safeParse(payload).success).toBe(true)
    expect(payload.dry_run).toBe(false)
    expect(payload.files).toHaveLength(1)
    expect(payload.files[0].written).toBe(true)
    expect(result.content.filter((block) => block.type === 'resource_link')).toHaveLength(1)
    const stagedPath = decodeURIComponent(new URL(payload.files[0].uri).pathname)
    expect(readFileSync(stagedPath, 'utf8')).toBe('echo ok\n')
  })

  it('refuses a path read_skill does not list', async () => {
    const result = await callTool(fakeCatalog(skillRegistry, skillFiles), 'prepare_skill_files', {
      skill_name: 'docs-writer',
      file_paths: ['scripts/unknown.sh'],
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('Unknown paths')
  })
})

describe('structured output', () => {
  it('returns structuredContent matching the outputSchema of every tool', async () => {
    const catalog = fakeCatalog(skillRegistry, skillFiles)
    const calls: Array<[string, Record<string, unknown>, { safeParse: (value: unknown) => { success: boolean } }]> = [
      ['search_skills', { query: 'docs' }, SearchSkillsOutputSchema],
      ['list_skills', { explicit_request: true }, ListSkillsOutputSchema],
      ['read_skill', { skill_name: 'docs-writer' }, ReadSkillOutputSchema],
      [
        'fetch_skill_files',
        { skill_name: 'docs-writer', file_paths: ['references/style.md'] },
        FetchSkillFilesOutputSchema,
      ],
      ['prepare_skill_files', { skill_name: 'docs-writer', dry_run: true }, PrepareSkillFilesOutputSchema],
    ]

    for (const [name, args, schema] of calls) {
      const result = await callTool(catalog, name, args)

      expect(result.isError).not.toBe(true)
      expect(schema.safeParse(result.structuredContent).success).toBe(true)
    }
  })
})

const PROMPTS_0_1_11 = [
  {
    arguments: [
      {
        name: 'task',
        description:
          'Describe what you are trying to accomplish (e.g. "optimize React performance", "create an architecture diagram")',
        required: true,
      },
    ],
    description: 'Find the best skill in the catalog for a task.',
    name: 'skills',
  },
  {
    arguments: [
      {
        name: 'task',
        description:
          'Describe what you are trying to accomplish (e.g. "optimize React performance", "create an architecture diagram")',
        required: true,
      },
    ],
    description: 'Alias for /skills.',
    name: 'find-skill',
  },
  {
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
    description: 'Load and apply a specific skill by exact name.',
    name: 'use',
  },
  {
    description: 'Show examples for using the agent-skills catalog prompts.',
    name: 'skills-help',
  },
]

const RESOURCES_0_1_11 = [
  {
    description:
      'Full agent-skills registry in JSON format. Contains all available skills with their names, descriptions, categories, and file paths.',
    mimeType: 'application/json',
    name: 'Skills Catalog',
    uri: 'skills://catalog',
  },
]

describe('prompts and resources', () => {
  it('lists the four prompts', async () => {
    const client = await connectInProcess(fakeCatalog(skillRegistry, skillFiles))
    const response = await client.rpc('prompts/list')

    expect(response.result?.prompts).toEqual(PROMPTS_0_1_11)
  })

  it('lists the skills catalog resource as application/json', async () => {
    const client = await connectInProcess(fakeCatalog(skillRegistry, skillFiles))
    const response = await client.rpc('resources/list')

    expect(response.result?.resources).toEqual(RESOURCES_0_1_11)
  })

  it('reads the registry as JSON from skills://catalog', async () => {
    const client = await connectInProcess(fakeCatalog(skillRegistry, skillFiles))
    const response = await client.rpc('resources/read', { uri: 'skills://catalog' })
    const contents = response.result?.contents as Array<{ uri: string; mimeType: string; text: string }>

    expect(contents[0].uri).toBe('skills://catalog')
    expect(contents[0].mimeType).toBe('application/json')
    expect(JSON.parse(contents[0].text)).toEqual(skillRegistry)
  })

  it('points the use prompt at read_skill for a known skill', async () => {
    const client = await connectInProcess(fakeCatalog(skillRegistry, skillFiles))
    const response = await client.rpc('prompts/get', { name: 'use', arguments: { name: 'docs-writer' } })
    const messages = response.result?.messages as Array<{ content: { text: string } }>

    expect(messages[0].content.text).toContain('Call read_skill with skill_name="docs-writer"')
  })

  it('answers the use prompt with the catalog error when the catalog is unavailable', async () => {
    const client = await connectInProcess(unavailableCatalog())
    const response = await client.rpc('prompts/get', { name: 'use', arguments: { name: 'docs-writer' } })

    expect(response.error?.code).toBe(-32603)
    expect(response.error?.message).toContain('Skill catalog unavailable. Try again shortly.')
  })

  it('answers the catalog resource with the catalog error when the catalog is unavailable', async () => {
    const client = await connectInProcess(unavailableCatalog())
    const response = await client.rpc('resources/read', { uri: 'skills://catalog' })

    expect(response.error?.code).toBe(-32603)
    expect(response.error?.message).toContain('Skill catalog unavailable. Try again shortly.')
  })
})

describe('package manifest', () => {
  it('depends on the official SDK and not on fastmcp', () => {
    const manifestPath = join(findWorkspaceRoot(), 'packages', 'mcp', 'package.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { dependencies: Record<string, string> }

    expect(manifest.dependencies['@modelcontextprotocol/server']).toBeDefined()
    expect(manifest.dependencies.fastmcp).toBeUndefined()
  })
})
