import { classifyError } from '../../services/error-classifier'

describe('ErrorClassifier', () => {
  it('should classify SIGTERM signal as cancelled', () => {
    const result = classifyError('', null, 'SIGTERM')
    expect(result.category).toBe('cancelled')
    expect(result.retryable).toBe(false)
  })

  it('should classify SIGKILL signal as terminated', () => {
    const result = classifyError('', null, 'SIGKILL')
    expect(result.category).toBe('terminated')
    expect(result.retryable).toBe(false)
  })

  it('should classify EPERM in stderr as file-locked and retryable', () => {
    const result = classifyError('Error: EPERM: operation not permitted', 1, null)
    expect(result.category).toBe('file-locked')
    expect(result.retryable).toBe(true)
  })

  it('should classify EBUSY in stderr as file-locked and retryable', () => {
    const result = classifyError('Error: EBUSY: resource busy or locked', 1, null)
    expect(result.category).toBe('file-locked')
    expect(result.retryable).toBe(true)
  })

  it('should classify ENOENT + npx in stderr as npx-missing', () => {
    const result = classifyError("'npx' is not recognized... ENOENT", 1, null)
    expect(result.category).toBe('npx-missing')
    expect(result.retryable).toBe(false)
  })

  it('should classify ENOSPC in stderr as disk-full', () => {
    const result = classifyError('ENOSPC: no space left on device', 1, null)
    expect(result.category).toBe('disk-full')
    expect(result.retryable).toBe(false)
  })

  it('should classify EACCES in stderr as permission-denied', () => {
    const result = classifyError('EACCES: permission denied', 1, null)
    expect(result.category).toBe('permission-denied')
    expect(result.retryable).toBe(false)
  })

  it('should classify MODULE_NOT_FOUND in stderr as cli-missing', () => {
    const result = classifyError('Error: MODULE_NOT_FOUND', 1, null)
    expect(result.category).toBe('cli-missing')
    expect(result.retryable).toBe(false)
    expect(result.action).toBeDefined()
    expect(result.action?.label).toBe('Install CLI')
  })

  it('should classify ERR_MODULE_NOT_FOUND in stderr as cli-missing', () => {
    const result = classifyError('Error: ERR_MODULE_NOT_FOUND', 1, null)
    expect(result.category).toBe('cli-missing')
    expect(result.retryable).toBe(false)
  })

  it('should classify generic non-zero exit code as cli-error', () => {
    const result = classifyError('Some random error', 1, null)
    expect(result.category).toBe('cli-error')
    expect(result.retryable).toBe(false)
    expect(result.message).toBe('Some random error')
  })

  it('should fallback to unknown if no exit code or signal', () => {
    const result = classifyError('', null, null)
    expect(result.category).toBe('unknown')
    expect(result.retryable).toBe(false)
  })

  it('should prioritize signal over stderr', () => {
    // Even if stderr has EPERM, if signal is SIGTERM, it is cancelled
    const result = classifyError('EPERM error', null, 'SIGTERM')
    expect(result.category).toBe('cancelled')
  })

  it('should match stderr case-insensitively', () => {
    const result = classifyError('error: eperm: operation not permitted', 1, null)
    expect(result.category).toBe('file-locked')
  })
})
