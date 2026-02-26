import type { FastMCP } from 'fastmcp'

import type { Registry } from './types'

export function registerResources(server: FastMCP, getRegistryFn: () => Promise<Registry>): void {
  server.addResource({
    uri: 'skills://catalog',
    name: 'Skills Catalog',
    description:
      'Full agent-skills registry in JSON format. Contains all available skills with their names, descriptions, categories, and file paths.',
    mimeType: 'application/json',
    load: async () => {
      const registry = await getRegistryFn()
      return { text: JSON.stringify(registry, null, 2) }
    },
  })
}
