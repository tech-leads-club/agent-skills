import { ErrorInfo } from '../shared/types'

export interface RetryOptions {
  maxRetries: number // Default: 3
  baseDelayMs: number // Default: 500
  shouldRetry: (error: ErrorInfo) => boolean // Predicate for retryable errors
  onRetry?: (attempt: number, maxRetries: number) => void // Progress callback
}

/**
 * Generic retry utility with exponential backoff for transient failures.
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @returns Result of the function or throws the last error
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= options.maxRetries + 1; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const errorInfo = error as ErrorInfo

      // If we've exhausted retries or the error isn't retryable, throw immediately
      if (attempt > options.maxRetries || !options.shouldRetry(errorInfo)) {
        throw error
      }

      // Exponential backoff: 500ms, 1000ms, 2000ms...
      const delay = options.baseDelayMs * Math.pow(2, attempt - 1)

      if (options.onRetry) {
        options.onRetry(attempt, options.maxRetries)
      }

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}
