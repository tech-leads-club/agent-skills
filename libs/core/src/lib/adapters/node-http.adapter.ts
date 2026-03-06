import type { HttpPort } from '../ports'

/**
 * Node.js implementation of {@link HttpPort} backed by native `fetch`.
 */
export class NodeHttpAdapter implements HttpPort {
  /**
   * Performs an HTTP GET request.
   *
   * @param url - Absolute URL to request.
   * @returns The HTTP response.
   */
  public async get(
    url: string,
  ): Promise<{ ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> }> {
    return fetch(url)
  }

  /**
   * Performs a GET request and retries using an optional fallback URL when the
   * primary request fails.
   *
   * @param url - Primary absolute URL.
   * @param fallbackUrl - Optional fallback absolute URL.
   * @returns The first successful HTTP response.
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
