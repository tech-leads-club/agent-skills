import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { InMemoryTransport } from '@modelcontextprotocol/server'

import type { Catalog } from '../../catalog'
import { createServer } from '../../server'

export type JsonRpcResponse = {
  id?: number
  result?: Record<string, unknown>
  error?: { code: number; message: string }
}

export type Era = 'legacy' | 'modern'

export const LEGACY_PROTOCOL = '2025-06-18'
export const MODERN_PROTOCOL = '2026-07-28'

const MODERN_META = {
  'io.modelcontextprotocol/protocolVersion': MODERN_PROTOCOL,
  'io.modelcontextprotocol/clientCapabilities': {},
  'io.modelcontextprotocol/clientInfo': { name: 'mcp-test-client', version: '0.0.0' },
}

export interface RpcClient {
  rpc(method: string, params?: Record<string, unknown>): Promise<JsonRpcResponse>
  notify(method: string): void
}

function createRpc(send: (message: unknown) => void, era: Era) {
  const pending = new Map<number, (response: JsonRpcResponse) => void>()
  let nextId = 0

  const client: RpcClient = {
    rpc: (method, params = {}) =>
      new Promise((resolve) => {
        const id = ++nextId
        pending.set(id, resolve)
        const withMeta = era === 'modern' ? { ...params, _meta: MODERN_META } : params
        send({ jsonrpc: '2.0', id, method, params: withMeta })
      }),
    notify: (method) => send({ jsonrpc: '2.0', method }),
  }

  const receive = (message: JsonRpcResponse) => {
    if (typeof message.id !== 'number') return
    pending.get(message.id)?.(message)
    pending.delete(message.id)
  }

  return { client, receive }
}

export async function initializeLegacy(client: RpcClient): Promise<JsonRpcResponse> {
  const response = await client.rpc('initialize', {
    protocolVersion: LEGACY_PROTOCOL,
    capabilities: {},
    clientInfo: { name: 'mcp-test-client', version: '0.0.0' },
  })
  client.notify('notifications/initialized')
  return response
}

export interface InProcessClient extends RpcClient {
  initialized: JsonRpcResponse
}

export async function connectInProcess(catalog: Catalog, version = '0.0.0-test'): Promise<InProcessClient> {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
  const server = createServer({ catalog, version })
  const { client, receive } = createRpc((message) => {
    void clientSide.send(message as Parameters<typeof clientSide.send>[0])
  }, 'legacy')
  clientSide.onmessage = (message) => receive(message as JsonRpcResponse)
  await server.connect(serverSide)
  await clientSide.start()
  const initialized = await initializeLegacy(client)
  return { ...client, initialized }
}

export function findWorkspaceRoot(start = process.cwd()): string {
  let dir = start
  while (!existsSync(join(dir, 'nx.json'))) {
    const parent = dirname(dir)
    if (parent === dir) throw new Error(`nx.json not found above ${start}`)
    dir = parent
  }
  return dir
}

export const BUILT_MAIN = join(findWorkspaceRoot(), 'dist', 'packages', 'mcp', 'main.js')

export interface SpawnedServer extends RpcClient {
  child: ChildProcessWithoutNullStreams
  stderr: () => string
  exited: Promise<{ code: number | null; signal: NodeJS.Signals | null; at: number }>
}

export function spawnServer(era: Era, env: NodeJS.ProcessEnv, mainPath = BUILT_MAIN): SpawnedServer {
  const child = spawn(process.execPath, [mainPath], { env, stdio: ['pipe', 'pipe', 'pipe'] })
  const { client, receive } = createRpc((message) => child.stdin.write(`${JSON.stringify(message)}\n`), era)
  let buffer = ''
  let errors = ''
  child.stdout.on('data', (chunk: Buffer) => {
    buffer += chunk.toString()
    let newline = buffer.indexOf('\n')
    while (newline >= 0) {
      const line = buffer.slice(0, newline)
      buffer = buffer.slice(newline + 1)
      if (line.trim()) receive(JSON.parse(line) as JsonRpcResponse)
      newline = buffer.indexOf('\n')
    }
  })
  child.stderr.on('data', (chunk: Buffer) => {
    errors += chunk.toString()
  })
  const exited = new Promise<{ code: number | null; signal: NodeJS.Signals | null; at: number }>((resolve) => {
    child.on('exit', (code, signal) => resolve({ code, signal, at: Date.now() }))
  })
  return { ...client, child, stderr: () => errors, exited }
}

export function offlineEnv(extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    HTTPS_PROXY: 'http://127.0.0.1:9',
    HTTP_PROXY: 'http://127.0.0.1:9',
    NO_PROXY: '',
    ...extra,
  }
}
