/**
 * Minimal HTTP response used by core services.
 *
 * `bytes()` returns the body unchanged. `text()` decodes it as UTF-8 and is only safe for text.
 */
export interface HttpResponse {
  ok: boolean
  status: number
  json(): Promise<unknown>
  text(): Promise<string>
  bytes(): Promise<Uint8Array>
}

/**
 * HTTP operations required by core services.
 */
export interface HttpPort {
  /**
   * Performs an HTTP GET request.
   *
   * @param url - Absolute URL to request.
   * @returns A promise that resolves to a minimal response object.
   */
  get(url: string): Promise<HttpResponse>

  /**
   * Performs an HTTP GET request and optionally retries against a fallback URL.
   *
   * @param url - Primary absolute URL to request.
   * @param fallbackUrl - Optional fallback URL used when the primary request fails.
   * @returns A promise that resolves to a minimal response object.
   */
  getWithFallback(url: string, fallbackUrl?: string): Promise<HttpResponse>
}
