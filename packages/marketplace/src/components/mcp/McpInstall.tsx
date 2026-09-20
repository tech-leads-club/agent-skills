'use client'

import { CopyButton } from '../CopyButton'
import { CLAUDE_CODE_CMD, CLAUDE_PLUGIN_CMDS, CURSOR_CMD, MANUAL_CONFIG, VSCODE_CONFIG } from './constants'

const blocks = [
  {
    title: 'Cursor',
    note: 'Or search for agent-skills on cursor.com/marketplace.',
    code: CURSOR_CMD,
  },
  {
    title: 'Claude Code — plugin',
    note: 'Two commands: add the marketplace, then install the plugin.',
    code: CLAUDE_PLUGIN_CMDS,
  },
  {
    title: 'Claude Code — CLI',
    note: 'One line, no JSON editing.',
    code: CLAUDE_CODE_CMD,
  },
  {
    title: 'VS Code (GitHub Copilot)',
    note: '.vscode/mcp.json uses a slightly different schema.',
    code: VSCODE_CONFIG,
  },
  {
    title: 'Any other MCP client',
    note: 'The standard mcpServers block — works with most agents, including Claude Desktop.',
    code: MANUAL_CONFIG,
  },
]

export function McpInstall() {
  return (
    <section className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 py-16 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-3">
            Add it to your agent
          </h2>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Zero config. The server needs Node 24 or newer and nothing else — no API key, no account, no build step.
          </p>
        </div>

        <div className="space-y-6">
          {blocks.map((block) => (
            <div key={block.title}>
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{block.title}</h3>
                <span className="text-[12px] text-gray-400 dark:text-gray-500 text-right">{block.note}</span>
              </div>
              <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-4 flex items-start justify-between gap-3 shadow-md">
                <pre className="text-left text-[13px] text-sky-400 font-mono overflow-x-auto flex-1">
                  <code>{block.code}</code>
                </pre>
                <CopyButton
                  text={block.code}
                  className="!bg-white/10 !text-white !px-4 !py-1.5 !text-xs hover:!bg-white/20 shrink-0"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
