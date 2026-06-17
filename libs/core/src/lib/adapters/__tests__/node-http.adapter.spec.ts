import { createServer, type Server } from 'node:http'

import { NodeHttpAdapter } from '../index'

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
