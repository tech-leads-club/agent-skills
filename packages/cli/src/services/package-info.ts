import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const require = createRequire(import.meta.url)

let pkg: { version?: string; description?: string }

try {
  pkg = require('./package.json')
} catch {
  pkg = require(join(__dirname, '../../package.json'))
}

export const PACKAGE_NAME = '@tech-leads-club/agent-skills'
export const PACKAGE_VERSION = pkg.version || '0.0.0'
export const PACKAGE_DESCRIPTION = pkg.description || 'CLI to install and manage skills for AI coding agents'
