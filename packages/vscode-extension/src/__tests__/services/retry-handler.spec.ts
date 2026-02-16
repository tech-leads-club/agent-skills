import { jest } from '@jest/globals'
import { withRetry } from '../../services/retry-handler'
import type { ErrorInfo } from '../../shared/types'

describe('RetryHandler', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return result immediately if first attempt succeeds', async () => {
    const fn = jest.fn<() => Promise<string>>().mockResolvedValue('success')
    const result = await withRetry(fn, {
      maxRetries: 3,
      baseDelayMs: 100,
      shouldRetry: () => true,
    })

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry if function fails and shouldRetry returns true', async () => {
    const error = { category: 'file-locked', retryable: true } as ErrorInfo
    const fn = jest.fn<() => Promise<string>>().mockRejectedValueOnce(error).mockResolvedValue('success')

    const promise = withRetry(fn, {
      maxRetries: 3,
      baseDelayMs: 100,
      shouldRetry: (err) => err.retryable,
    })

    // Fast-forward time
    await jest.advanceTimersByTimeAsync(100)

    const result = await promise
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should exhaust retries and throw last error', async () => {
    const error = { category: 'file-locked', retryable: true } as ErrorInfo
    const fn = jest.fn<() => Promise<string>>().mockRejectedValue(error)

    const promise = withRetry(fn as any, {
      maxRetries: 2,
      baseDelayMs: 100,
      shouldRetry: (err) => err.retryable,
    })

    // Prevent unhandled rejection warning during timer advancement
    promise.catch(() => {})

    // Advance for attempt 2 (100ms)
    await jest.advanceTimersByTimeAsync(100)
    // Advance for attempt 3 (200ms)
    await jest.advanceTimersByTimeAsync(200)

    await expect(promise).rejects.toEqual(error)
    expect(fn).toHaveBeenCalledTimes(3) // Initial + 2 retries
  })

  it('should throw immediately if shouldRetry returns false', async () => {
    const error = { category: 'cli-error', retryable: false } as ErrorInfo
    const fn = jest.fn<() => Promise<string>>().mockRejectedValue(error)

    await expect(
      withRetry(fn as any, {
        maxRetries: 3,
        baseDelayMs: 100,
        shouldRetry: (err) => err.retryable,
      }),
    ).rejects.toEqual(error)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should implement exponential backoff', async () => {
    const error = { category: 'file-locked', retryable: true } as ErrorInfo
    const fn = jest.fn<() => Promise<string>>().mockRejectedValue(error)
    const onRetry = jest.fn()

    const promise = withRetry(fn as any, {
      maxRetries: 3,
      baseDelayMs: 100,
      shouldRetry: () => true,
      onRetry,
    })

    // Prevent unhandled rejection warning
    promise.catch(() => {})

    // 1st retry delay: 100ms
    await jest.advanceTimersByTimeAsync(100)
    // 2nd retry delay: 200ms
    await jest.advanceTimersByTimeAsync(200)
    // 3rd retry delay: 400ms
    await jest.advanceTimersByTimeAsync(400)

    try {
      await promise
    } catch {
      // Ignore
    }

    expect(fn).toHaveBeenCalledTimes(4) // 1 initial + 3 retries
    // onRetry called before each delay
    expect(onRetry).toHaveBeenCalledTimes(3)

    expect(onRetry).toHaveBeenNthCalledWith(1, 1, 3)
    expect(onRetry).toHaveBeenNthCalledWith(2, 2, 3)
    expect(onRetry).toHaveBeenNthCalledWith(3, 3, 3)
  })
})
