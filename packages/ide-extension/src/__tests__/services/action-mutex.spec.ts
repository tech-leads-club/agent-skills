import { describe, expect, it } from '@jest/globals'
import { ActionMutex } from '../../services/action-mutex'

describe('ActionMutex', () => {
  it('allows only one active action at a time', () => {
    const mutex = new ActionMutex()

    const firstLease = mutex.acquire('action-1')
    const secondLease = mutex.acquire('action-2')

    expect(firstLease).not.toBeNull()
    expect(secondLease).toBeNull()
    expect(mutex.getActiveActionId()).toBe('action-1')
    expect(mutex.isLocked()).toBe(true)
  })

  it('releases the active action when the lease completes', () => {
    const mutex = new ActionMutex()

    const lease = mutex.acquire('action-1')
    lease?.release()

    const nextLease = mutex.acquire('action-2')

    expect(mutex.getActiveActionId()).toBe('action-2')
    expect(nextLease).not.toBeNull()
  })
})
