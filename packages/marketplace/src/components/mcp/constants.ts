export const MCP_PACKAGE = '@tech-leads-club/agent-skills-mcp'

export const CLI_INSTALL_CMD = 'npx @tech-leads-club/agent-skills install'

export const CLAUDE_CODE_CMD = 'claude mcp add agent-skills -- npx -y @tech-leads-club/agent-skills-mcp'

export const CURSOR_CMD = '/add-plugin agent-skills'

export const CLAUDE_PLUGIN_CMDS = [
  '/plugin marketplace add tech-leads-club/agent-skills',
  '/plugin install agent-skills-mcp@tech-leads-club',
].join('\n')

export const MANUAL_CONFIG = `{
  "mcpServers": {
    "agent-skills": {
      "command": "npx",
      "args": ["-y", "@tech-leads-club/agent-skills-mcp"]
    }
  }
}`

export const VSCODE_CONFIG = `{
  "servers": {
    "agent-skills": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@tech-leads-club/agent-skills-mcp"]
    }
  }
}`

export const LEVELS = [
  {
    level: '1',
    tag: 'DISCOVERY',
    color: 'bg-blue-600',
    tool: 'search_skills',
    title: 'Find by intent',
    body: 'A plain phrase like "react component testing" returns up to 5 ranked candidates with name, category, usage hint and a 0-100 relevance score. No query syntax, no guessing skill names.',
    cost: '~50–250 tokens',
  },
  {
    level: '2',
    tag: 'ACTIVATION',
    color: 'bg-violet-500',
    tool: 'read_skill',
    title: 'Load one skill',
    body: 'Returns the SKILL.md body with the YAML frontmatter stripped, plus the index of reference files the skill declares. Only the skill the agent actually picked gets loaded.',
    cost: 'the skill body only',
  },
  {
    level: '3',
    tag: 'EXECUTION',
    color: 'bg-emerald-500',
    tool: 'fetch_skill_files',
    title: 'Read only what it needs',
    body: 'Fetches up to 5 reference files the instructions asked for, validated against the registry file list. Capped at a 50,000-char response budget so a big reference set cannot blow the context.',
    cost: 'bounded at ~12.5k tokens',
  },
  {
    level: '3',
    tag: 'EXECUTION',
    color: 'bg-emerald-500',
    tool: 'prepare_skill_files',
    title: 'Or run what it needs',
    body: 'Writes checksum-verified files to disk and returns a skill_dir plus file:// links instead of contents — for skills whose instructions run a script. Nothing enters the context.',
    cost: '~700 tokens for a whole skill',
  },
] as const

export const TOOLS = [
  {
    name: 'search_skills',
    color: 'bg-blue-600',
    summary: 'Step 1. Fuzzy search over name, extracted triggers, description and category.',
    bullets: [
      'Per-token matching, so natural phrases work without operators',
      'Each result carries a 0-100 score and a match_quality label',
      'Weak matches are dropped, so "no skill applies" is an answer the agent can reach',
    ],
  },
  {
    name: 'read_skill',
    color: 'bg-violet-500',
    summary: 'Step 2. Loads the canonical SKILL.md for one skill.',
    bullets: [
      'Frontmatter stripped — search already delivered name and description',
      'Content hash verified over the original bytes before anything is returned',
      'Second block lists every reference file the registry declares',
    ],
  },
  {
    name: 'fetch_skill_files',
    color: 'bg-emerald-500',
    summary: 'Step 3. Returns the text of reference files meant to be read.',
    bullets: [
      'All paths validated against the registry before any network call',
      'Files fetched in parallel; a partial failure still returns what succeeded',
      'Response budget names anything it had to leave out',
    ],
  },
  {
    name: 'prepare_skill_files',
    color: 'bg-amber-500',
    summary: 'Step 3, alternative. Stages files on disk for skills that run scripts.',
    bullets: [
      'Every file is checksum-verified before it is written',
      'Written without the execute bit, under ~/.cache/agent-skills-mcp/',
      'dry_run previews the destination and file list before any fetch or write',
    ],
  },
  {
    name: 'list_skills',
    color: 'bg-slate-500',
    summary: 'Catalog browse, on explicit request only.',
    bullets: [
      'Category-grouped list with truncated descriptions',
      'Served from the in-memory index — no extra registry fetch',
      'Requires explicit_request: true so agents do not call it mid-workflow',
    ],
  },
] as const

export const PROMPTS = [
  {
    command: '/skills',
    args: 'task',
    body: 'The main entrypoint. Describe the task in natural language and the prompt drives search → read → apply.',
    example: '/skills task:"refactor a large React component"',
  },
  {
    command: '/use',
    args: 'name, context',
    body: 'A direct shortcut when you already know the skill name.',
    example: '/use name:"docs-writer" context:"write a README for this package"',
  },
  {
    command: '/skills-help',
    args: '—',
    body: 'Quick examples and when to reach for /skills versus /use.',
    example: '/skills-help',
  },
  {
    command: '/find-skill',
    args: 'task',
    body: 'Compatibility alias for /skills, same argument.',
    example: '/find-skill task:"plan a migration"',
  },
] as const
