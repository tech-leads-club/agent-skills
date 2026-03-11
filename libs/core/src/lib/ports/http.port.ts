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
  get(url: string): Promise<{ ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> }>

  /**
   * Performs an HTTP GET request and optionally retries against a fallback URL.
   *
   * @param url - Primary absolute URL to request.
   * @param fallbackUrl - Optional fallback URL used when the primary request fails.
   * @returns A promise that resolves to a minimal response object.
   */
  getWithFallback(
    url: string,
    fallbackUrl?: string,
  ): Promise<{ ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> }>
}
