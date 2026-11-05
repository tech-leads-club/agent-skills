import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { findWorkspaceRoot } from './support/mcp-client'

const readme = readFileSync(join(findWorkspaceRoot(), 'packages', 'mcp', 'README.md'), 'utf8')

function section(heading: string): string {
  const start = readme.indexOf(heading)
  if (start < 0) throw new Error(`README has no heading "${heading}"`)
  const next = readme.indexOf('\n## ', start + heading.length)
  return readme.slice(start, next < 0 ? undefined : next)
}

describe('README', () => {
  it('documents the global install for the four clients', () => {
    const install = section('### Global Install (Long-running sessions)')

    expect(install).toContain('npm i -g @tech-leads-club/agent-skills-mcp')
    expect(install).toContain('"command": "agent-skills-mcp"')
    expect(install).toContain('claude mcp add agent-skills -- agent-skills-mcp')
    expect(install).toContain('"type": "stdio"')
    expect(install).toContain('[mcp_servers.agent-skills]')
    expect(install).toContain('command = "agent-skills-mcp"')
  })
})
