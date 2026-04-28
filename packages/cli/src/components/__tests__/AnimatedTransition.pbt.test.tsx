/** @jest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, render } from '@testing-library/react'
import * as fc from 'fast-check'

import { AnimatedTransition } from '../AnimatedTransition'

jest.mock('ink', () => ({
  Transform: jest.fn(({ transform }) => {
    const output = transform ? transform('child content') : 'child content'
    return <div data-testid="ink-transform">{output}</div>
  }),
}))

describe('AnimatedTransition - Property-Based Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('should eventually render empty or full content based on final visibility for ANY duration', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.integer({ min: -100, max: 10000 }), (isVisible, duration) => {
        const { unmount, container } = render(
          <AnimatedTransition visible={isVisible} duration={duration}>
            <span>child</span>
          </AnimatedTransition>,
        )

        const waitTime = Math.max(duration, 0) + 100

        act(() => {
          jest.advanceTimersByTime(waitTime)
        })

        if (isVisible) {
          expect(container.textContent).toContain('child')
        } else {
          expect(container.innerHTML).toBe('')
        }

        unmount()
      }),
      { numRuns: 100 },
    )
  })
})
