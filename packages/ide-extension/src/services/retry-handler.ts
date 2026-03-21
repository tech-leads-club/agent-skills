import type { ErrorCategory, ErrorInfo } from '../shared/types'

const ERROR_CATEGORIES: readonly ErrorCategory[] = [
  'cancelled',
  'terminated',
  'file-locked',
  'npx-missing',
  'disk-full',
  'permission-denied',
  'cli-missing',
  'cli-error',
  'unknown',
]

function isErrorCategory(value: unknown): value is ErrorCategory {
  return typeof value === 'string' && (ERROR_CATEGORIES as readonly string[]).includes(value)
}

function isErrorInfo(value: unknown): value is ErrorInfo {
  if (value === null || typeof value !== 'object') {
    return false
  }
  const o = value as Record<string, unknown>
  if (!isErrorCategory(o.category) || typeof o.message !== 'string' || typeof o.retryable !== 'boolean') {
    return false
  }
  if (o.action !== undefined) {
    if (o.action === null || typeof o.action !== 'object') {
      return false
    }
    const a = o.action as Record<string, unknown>
    if (typeof a.label !== 'string' || typeof a.command !== 'string') {
      return false
    }
  }
  return true
}

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
      if (attempt > options.maxRetries || !isErrorInfo(error) || !options.shouldRetry(error)) {
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
