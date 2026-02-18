import chalk from 'chalk'

import { clearCache, clearRegistryCache, getCacheDir } from '../services/registry'

interface CacheCliOptions {
  clear?: boolean
  clearRegistry?: boolean
  path?: boolean
}

export function runCliCache(options: CacheCliOptions): void {
  if (options.clear) {
    clearCache()
    console.log(chalk.green('✅ Cache cleared'))
  } else if (options.clearRegistry) {
    clearRegistryCache()
    console.log(chalk.green('✅ Registry cache cleared'))
  } else if (options.path) {
    console.log(getCacheDir())
  } else {
    console.log(chalk.bold('Cache management:'))
    console.log(`  ${chalk.blue('--clear')}           Clear all cached skills and registry`)
    console.log(`  ${chalk.blue('--clear-registry')}  Clear only the registry cache`)
    console.log(`  ${chalk.blue('--path')}            Show cache directory path`)
    console.log()
    console.log(chalk.dim(`Cache location: ${getCacheDir()}`))
  }
}
