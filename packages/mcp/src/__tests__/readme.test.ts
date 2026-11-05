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

function codeBlockAfter(text: string, marker: string): string {
  const at = text.indexOf(marker)
  if (at < 0) throw new Error(`README section has no "${marker}"`)
  const open = text.indexOf('```', at)
  const close = text.indexOf('```', open + 3)
  return text.slice(open, close)
}

describe('README', () => {
  it('documents the global install for the four clients', () => {
    const install = section('### Global Install (Long-running sessions)')

    expect(codeBlockAfter(install, '### Global Install')).toContain('npm i -g @tech-leads-club/agent-skills-mcp')
    expect(codeBlockAfter(install, 'Generic MCP config')).toContain('"command": "agent-skills-mcp"')
    expect(codeBlockAfter(install, 'Claude Code (CLI)')).toContain('claude mcp add agent-skills -- agent-skills-mcp')
    const vscode = codeBlockAfter(install, 'VS Code (GitHub Copilot)')
    expect(vscode).toContain('"type": "stdio"')
    expect(vscode).toContain('"command": "agent-skills-mcp"')
    const codex = codeBlockAfter(install, 'Codex')
    expect(codex).toContain('[mcp_servers.agent-skills]')
    expect(codex).toContain('command = "agent-skills-mcp"')
  })

  it('documents the catalog version refresh', () => {
    const caching = section('## ⚡ Caching')

    expect(caching).toContain('npm dist-tag `latest`')
    expect(caching).toContain('checked again on the first tool call after the 15-minute TTL expires')
    expect(caching).not.toContain('@latest/packages/skills-catalog')
  })
})
