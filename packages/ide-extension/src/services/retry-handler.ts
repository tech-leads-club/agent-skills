import { ErrorInfo } from '../shared/types'

/**
 * Configuration for retrying CLI operations with backoff and optional hooks.
 */
export interface RetryOptions {
  maxRetries: number
  baseDelayMs: number
  shouldRetry: (error: ErrorInfo) => boolean
  onRetry?: (attempt: number, maxRetries: number) => void
}

/**
 * Generic retry utility with exponential backoff for transient failures.
 *
 * @param fn - Async function to retry.
 * @param options - Retry configuration.
 * @returns Result of the function or throws the last error.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= options.maxRetries + 1; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const errorInfo = error as ErrorInfo

      if (attempt > options.maxRetries || !options.shouldRetry(errorInfo)) {
        throw error
      }

      const delay = options.baseDelayMs * Math.pow(2, attempt - 1)

      if (options.onRetry) {
        options.onRetry(attempt, options.maxRetries)
      }

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}
