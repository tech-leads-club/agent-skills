import { createServer } from 'node:http'
import type { AddressInfo, Socket } from 'node:net'

export interface TestProxy {
  url: string
  connects: string[]
  close(): Promise<void>
}

export async function startTestProxy(mode: 'refuse' | 'hang'): Promise<TestProxy> {
  const connects: string[] = []
  const held = new Set<Socket>()
  const server = createServer((_request, response) => {
    response.writeHead(502).end()
  })

  server.on('connect', (request, socket: Socket) => {
    connects.push(String(request.url))
    if (mode === 'refuse') {
      socket.end('HTTP/1.1 502 Bad Gateway\r\n\r\n')
      return
    }
    held.add(socket)
    socket.on('close', () => held.delete(socket))
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo

  return {
    url: `http://127.0.0.1:${port}`,
    connects,
    close: async () => {
      for (const socket of held) socket.destroy()
      await new Promise<void>((resolve) => server.close(() => resolve()))
    },
  }
}
