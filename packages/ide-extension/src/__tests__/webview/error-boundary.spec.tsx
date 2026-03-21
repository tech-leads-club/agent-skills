import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ErrorBoundary } from '../../webview/components/error-boundary'
import { postMessage } from '../../webview/lib/vscode-api'

jest.mock('../../webview/lib/vscode-api', () => ({
  postMessage: jest.fn(),
}))

function ThrowOnRender(): never {
  throw new Error('render explosion')
}

function ThrowOnClick() {
  const [hasCrashed, setHasCrashed] = useState(false)
  if (hasCrashed) {
    throw new Error('retry explosion')
  }

  return (
    <button type="button" onClick={() => setHasCrashed(true)}>
      Crash now
    </button>
  )
}

describe('ErrorBoundary', () => {
  const originalConsoleError = console.error

  beforeEach(() => {
    jest.clearAllMocks()
    console.error = jest.fn()
  })

  afterAll(() => {
    console.error = originalConsoleError
  })

  it('renders fallback UI and reports the error to the host', () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument()
    expect(screen.getByText('render explosion')).toBeInTheDocument()
    expect(postMessage).toHaveBeenCalledWith({
      type: 'webviewError',
      payload: expect.objectContaining({
        message: 'render explosion',
        componentStack: expect.any(String),
      }),
    })
  })

  it('resets boundary state and re-renders subtree after retry', async () => {
    const user = userEvent.setup()

    render(
      <ErrorBoundary>
        <ThrowOnClick />
      </ErrorBoundary>,
    )

    await user.click(screen.getByRole('button', { name: /crash now/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /retry/i }))
    expect(screen.getByRole('button', { name: /crash now/i })).toBeInTheDocument()
  })
})
