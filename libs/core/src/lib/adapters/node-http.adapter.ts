import type { HttpPort, HttpResponse } from '../ports'

function toHttpResponse(response: Response): HttpResponse {
  return {
    ok: response.ok,
    status: response.status,
    json: () => response.json() as Promise<unknown>,
    text: () => response.text(),
    bytes: async () => new Uint8Array(await response.arrayBuffer()),
  }
}

/**
 * Node.js implementation of {@link HttpPort} backed by native `fetch`.
 */
export class NodeHttpAdapter implements HttpPort {
  /**
   * @inheritdoc
   */
  public async get(url: string): Promise<HttpResponse> {
    return toHttpResponse(await fetch(url))
  }

  /**
   * @inheritdoc
   */
  public async getWithFallback(url: string, fallbackUrl?: string): Promise<HttpResponse> {
    try {
      return toHttpResponse(await fetch(url))
    } catch (error) {
      if (fallbackUrl) return toHttpResponse(await fetch(fallbackUrl))
      throw error
    }
  }
}
