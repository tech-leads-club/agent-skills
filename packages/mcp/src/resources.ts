import type { McpServer } from '@modelcontextprotocol/server'

import type { Catalog } from './catalog'

export function registerResources(server: McpServer, catalog: Catalog): void {
  server.registerResource(
    'Skills Catalog',
    'skills://catalog',
    {
      description:
        'Full agent-skills registry in JSON format. Contains all available skills with their names, descriptions, categories, and file paths.',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        { uri: uri.href, mimeType: 'application/json', text: JSON.stringify(await catalog.registry(), null, 2) },
      ],
    }),
  )
}
