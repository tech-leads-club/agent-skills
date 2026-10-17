import { run } from './cli'

process.exit(run({ argv: process.argv.slice(2) }))
