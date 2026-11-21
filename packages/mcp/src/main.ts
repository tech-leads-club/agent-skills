#!/usr/bin/env node
import http from 'node:http'

import { serveStdio } from '@modelcontextprotocol/server/stdio'

import pkg from '../package.json' with { type: 'json' }
import { createCatalog } from './catalog'
import { createServer } from './server'
import { readPackageVersion } from './version'

const proxyAwareHttp = http as typeof http & { setGlobalProxyFromEnv?: () => () => void }
proxyAwareHttp.setGlobalProxyFromEnv?.()

const version = readPackageVersion(import.meta.url, pkg.version ?? '0.0.0')
const catalog = createCatalog()
const handle = serveStdio(() => createServer({ catalog, version }))

process.stderr.write(`[agent-skills-mcp] ${version} listening on stdio\n`)
catalog.warm()

const EXIT_GRACE_MS = 1000

const shutdown = () => {
  catalog.close()
  void handle.close()
  setTimeout(() => process.exit(0), EXIT_GRACE_MS).unref()
}
process.stdin.once('end', shutdown)
process.stdin.once('close', shutdown)
