import type { HttpPort } from '../ports'

/**
 * Node.js implementation of {@link HttpPort} backed by native `fetch`.
 */
export class NodeHttpAdapter implements HttpPort {
  /**
   * @inheritdoc
   */
  public async get(
    url: string,
  ): Promise<{ ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> }> {
    return fetch(url)
  }

  /**
   * @inheritdoc
   */
  public async getWithFallback(
    url: string,
    fallbackUrl?: string,
  ): Promise<{ ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> }> {
    try {
      return await fetch(url)
    } catch (error) {
      if (fallbackUrl) return fetch(fallbackUrl)
      throw error
    }
  }
}
