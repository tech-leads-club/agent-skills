/** @jest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, render } from '@testing-library/react'
import * as fc from 'fast-check'

import { KeyboardShortcutsOverlay } from '../KeyboardShortcutsOverlay'

jest.mock('../../theme', () => ({
  colors: {
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    accent: '#06b6d4',
    text: '#f8fafc',
    textDim: '#94a3b8',
    textMuted: '#64748b',
    border: '#334155',
    bg: '#0f172a',
    bgLight: '#1e293b',
    success: '#22c55e',
    error: '#ef4444',
  },
  symbols: {
    sparkle: '✦',
    diamond: '◆',
    arrow: '›',
    dot: '·',
    bullet: '▸',
    cross: '✗',
    info: 'ℹ',
    arrowDown: '↓',
    arrowUp: '↑',
    bar: '│',
  },
}))

jest.mock('../AnimatedTransition', () => ({
  AnimatedTransition: ({ children, visible }: { children: React.ReactNode; visible: boolean }) =>
    visible ? <div data-testid="overlay">{children}</div> : null,
}))

const mockUseInput = jest.fn()

jest.mock('ink', () => {
  return {
    useInput: (handler: (input: string, key: Record<string, boolean>) => void, options: Record<string, unknown>) =>
      mockUseInput(handler, options),
    Box: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const {
        flexDirection,
        justifyContent,
        borderStyle,
        borderColor,
        paddingLeft,
        paddingRight,
        marginTop,
        marginBottom,
        width,
        height,
        gap,
        ...validProps
      } = props
      void flexDirection
      void justifyContent
      void borderStyle
      void borderColor
      void paddingLeft
      void paddingRight
      void marginTop
      void marginBottom
      void width
      void height
      void gap
      return (
        <div data-testid="box" {...validProps}>
          {children}
        </div>
      )
    },
    Text: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { bold, underline, ...validProps } = props
      void bold
      void underline
      return (
        <span data-testid="text" {...validProps}>
          {children}
        </span>
      )
    },
  }
})

const defaultShortcuts = [
  { key: 'space', description: 'Toggle selection' },
  { key: 'enter', description: 'Confirm' },
]

describe('KeyboardShortcutsOverlay - Property-Based Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockUseInput.mockClear()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('should dismiss on ANY random key press when visible', () => {
    fc.assert(
      fc.property(
        // Generate random key inputs
        fc.record({
          input: fc.string(),
          key: fc.record({
            return: fc.boolean(),
            escape: fc.boolean(),
            ctrl: fc.boolean(),
            meta: fc.boolean(),
            shift: fc.boolean(),
            tab: fc.boolean(),
            backspace: fc.boolean(),
            delete: fc.boolean(),
            upArrow: fc.boolean(),
            downArrow: fc.boolean(),
            leftArrow: fc.boolean(),
            rightArrow: fc.boolean(),
            pageDown: fc.boolean(),
            pageUp: fc.boolean(),
          }),
        }),
        (keyEvent) => {
          const onDismiss = jest.fn()
          mockUseInput.mockClear()

          const { unmount } = render(
            <KeyboardShortcutsOverlay visible={true} onDismiss={onDismiss} shortcuts={defaultShortcuts} />,
          )

          if (mockUseInput.mock.calls.length > 0) {
            const handler = mockUseInput.mock.calls[0][0] as (input: string, key: unknown) => void

            act(() => {
              handler(keyEvent.input, keyEvent.key)
            })

            expect(onDismiss).toHaveBeenCalled()
          }

          unmount()
        },
      ),
      { numRuns: 100 },
    )
  })
})
