import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  createNodeAdapters,
  NodeEnvAdapter,
  NodeFileSystemAdapter,
  NodeHttpAdapter,
  NodeLoggerAdapter,
  NodePackageResolverAdapter,
  NodeShellAdapter,
} from './index'

describe('NodeFileSystemAdapter', () => {
  it('writes and reads file content in a real temporary directory', async () => {
    const adapter = new NodeFileSystemAdapter()
    const tempDir = await mkdtemp(join(tmpdir(), 'core-node-fs-'))
    const filePath = join(tempDir, 'integration.txt')

    try {
      await adapter.writeFile(filePath, 'hello core', 'utf-8')
      const content = await adapter.readFile(filePath, 'utf-8')

      expect(content).toBe('hello core')
      expect(adapter.existsSync(filePath)).toBe(true)
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })
})

describe('NodeHttpAdapter', () => {
  let server: Server
  let serverUrl = ''

  beforeAll(async () => {
    server = createServer((req, res) => {
      if (req.url === '/json') {
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.end('{"ok":true}')
        return
      }

      res.statusCode = 200
      res.end('fallback-ok')
    })

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address()
        if (!address || typeof address === 'string') throw new Error('Unable to resolve test server address')
        serverUrl = `http://127.0.0.1:${address.port}`
        resolve()
      })
    })
  })

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      })
    })
  })

  it('returns a minimal response shape for get', async () => {
    const adapter = new NodeHttpAdapter()
    const response = await adapter.get(`${serverUrl}/json`)

    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it('uses fallback URL when primary request fails', async () => {
    const adapter = new NodeHttpAdapter()
    const response = await adapter.getWithFallback('http://127.0.0.1:1/unreachable', `${serverUrl}/fallback`)

    expect(response.ok).toBe(true)
    await expect(response.text()).resolves.toBe('fallback-ok')
  })
})

describe('NodeShellAdapter', () => {
  it('executes a shell command and returns output text', () => {
    const adapter = new NodeShellAdapter()
    const output = adapter.exec('node -e "process.stdout.write(\'hello\')"')

    expect(output).toBe('hello')
  })
})

describe('NodeEnvAdapter', () => {
  it('returns runtime environment values', () => {
    const adapter = new NodeEnvAdapter()

    expect(typeof adapter.cwd()).toBe('string')
    expect(typeof adapter.homedir()).toBe('string')
    expect(typeof adapter.platform()).toBe('string')

    process.env['CORE_ADAPTER_TEST'] = 'enabled'
    expect(adapter.getEnv('CORE_ADAPTER_TEST')).toBe('enabled')
    delete process.env['CORE_ADAPTER_TEST']
  })
})

describe('NodeLoggerAdapter', () => {
  it('delegates logging methods to console', () => {
    const adapter = new NodeLoggerAdapter()
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {})

    try {
      adapter.error('error-message')
      adapter.warn('warn-message')
      adapter.info('info-message')
      adapter.debug('debug-message')

      expect(errorSpy).toHaveBeenCalledWith('error-message')
      expect(warnSpy).toHaveBeenCalledWith('warn-message')
      expect(infoSpy).toHaveBeenCalledWith('info-message')
      expect(debugSpy).toHaveBeenCalledWith('debug-message')
    } finally {
      errorSpy.mockRestore()
      warnSpy.mockRestore()
      infoSpy.mockRestore()
      debugSpy.mockRestore()
    }
  })
})

describe('NodePackageResolverAdapter', () => {
  it('resolves the latest version using the configured resolver', async () => {
    const adapter = new NodePackageResolverAdapter(async () => ({ version: '9.9.9' }))

    await expect(adapter.getLatestVersion('demo-package')).resolves.toBe('9.9.9')
  })
})

describe('createNodeAdapters', () => {
  it('returns a complete CorePorts object with expected methods', () => {
    const adapters = createNodeAdapters()

    expect(typeof adapters.fs.readFile).toBe('function')
    expect(typeof adapters.http.get).toBe('function')
    expect(typeof adapters.shell.exec).toBe('function')
    expect(typeof adapters.env.cwd).toBe('function')
    expect(typeof adapters.logger.info).toBe('function')
    expect(typeof adapters.packageResolver.getLatestVersion).toBe('function')
  })
})

describe('NodeFileSystemAdapter directory listing helpers', () => {
  it('returns dirent-shaped data for async and sync reads', async () => {
    const adapter = new NodeFileSystemAdapter()
    const tempDir = await mkdtemp(join(tmpdir(), 'core-node-readdir-'))
    const nestedFile = join(tempDir, 'entry.txt')

    try {
      await adapter.writeFile(nestedFile, 'value', 'utf-8')

      const asyncEntries = await adapter.readdir(tempDir)
      const syncEntries = adapter.readdirSync(tempDir)

      expect(asyncEntries.some((entry: { name: string }) => entry.name === 'entry.txt')).toBe(true)
      expect(syncEntries.some((entry: { name: string }) => entry.name === 'entry.txt')).toBe(true)

      const fileContent = await readFile(nestedFile, 'utf-8')
      expect(fileContent).toBe('value')
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })
})
