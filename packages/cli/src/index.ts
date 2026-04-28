import { Command } from 'commander'
import { render } from 'ink'
import React from 'react'

import { App } from './app'
import { PACKAGE_VERSION } from './services/package-info'

const program = new Command()

// Root command
program
  .name('agent-skills')
  .description('CLI to install and manage skills for AI coding agents')
  .version(PACKAGE_VERSION)

program.action(() => {
  render(React.createElement(App, { command: 'install' }))
})

// Install command
program
  .command('install')
  .description('Install skills (interactive by default)')
  .option('-g, --global', 'Install globally to user home', false)
  .option('-s, --skill <names...>', 'Install one or more skills')
  .option('-a, --agent <agents...>', 'Target specific agents')
  .option('--symlink', 'Use symlink instead of copy', false)
  .option('-f, --force', 'Force re-download skills (bypass cache)', false)
  .action(async (options) => {
    if (shouldUseInteractiveMode(options)) {
      render(React.createElement(App, { command: 'install' }))
      return
    }

    // CLI mode - dynamic import
    const { runCliInstall } = await import('./cli/install')
    await runCliInstall(options)
  })

// List command
program
  .command('list')
  .alias('ls')
  .description('List available/installed agent skills')
  .action(() => {
    render(React.createElement(App, { command: 'list' }))
  })

// Remove command
program
  .command('remove')
  .alias('rm')
  .description('Remove installed skills')
  .option('-g, --global', 'Remove from global installation', false)
  .option('-s, --skill <names...>', 'Remove one or more skills')
  .option('-a, --agent <agents...>', 'Target specific agents')
  .option('-f, --force', 'Force removal even if not in lockfile', false)
  .action(async (options) => {
    if (shouldUseInteractiveMode(options)) {
      render(React.createElement(App, { command: 'remove' }))
      return
    }

    // CLI mode - dynamic import
    const { runCliRemove } = await import('./cli/remove')
    await runCliRemove(options)
  })

// Update command
program
  .command('update')
  .description('Update installed skills to the latest version')
  .option('-s, --skill <name>', 'Update a specific skill')
  .action(async (options) => {
    if (shouldUseInteractiveMode(options)) {
      render(React.createElement(App, { command: 'update' }))
      return
    }

    // CLI mode - dynamic import
    const { runCliUpdate } = await import('./cli/update')
    await runCliUpdate(options)
  })

// Cache command
program
  .command('cache')
  .description('Manage the skills cache')
  .option('--clear', 'Clear all cached skills and registry')
  .option('--clear-registry', 'Clear only the registry cache')
  .option('--path', 'Show cache directory path')
  .action(async (options) => {
    // CLI mode - dynamic import
    const { runCliCache } = await import('./cli/cache')
    runCliCache(options)
  })

// Credits command
program
  .command('credits')
  .description('Show project contributors and credits')
  .action(() => {
    render(React.createElement(App, { command: 'credits' }))
  })

// Audit log command
program
  .command('audit')
  .description('View audit log of skill operations')
  .option('-n, --limit <number>', 'Number of entries to show', '10')
  .option('--path', 'Show audit log file path')
  .action(async (options) => {
    const { runCliAudit } = await import('./cli/audit')
    await runCliAudit(options)
  })

program.parse(process.argv)

function shouldUseInteractiveMode(options: Record<string, unknown>): boolean {
  const optionKeys = Object.keys(options).filter((key) => key !== 'parent')
  return optionKeys.length === 0
}
