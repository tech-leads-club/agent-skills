import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import jestAxe from 'jest-axe'
import type { LogTimelineEntry } from '../../webview/hooks/useOperations'
import { StatusPage } from '../../webview/views/StatusPage'

const { axe } = jestAxe

const emptyLogTimeline: LogTimelineEntry[] = []

const sampleLogTimeline: LogTimelineEntry[] = [
  {
    operationId: 'op-1',
    skillName: 'accessibility',
    operation: 'install',
    message: 'Starting...',
    severity: 'info',
    timestamp: Date.now(),
  },
  {
    operationId: 'op-1',
    skillName: 'accessibility',
    operation: 'install',
    message: 'Downloaded accessibility',
    severity: 'info',
    timestamp: Date.now(),
  },
]

describe('StatusPage', () => {
  it('renders operation in progress state', () => {
    render(
      <StatusPage
        isProcessing={true}
        operations={new Map()}
        logTimeline={sampleLogTimeline}
        batchResult={null}
        onDone={jest.fn()}
      />,
    )
    expect(screen.getByRole('heading', { name: /operation in progress/i })).toBeInTheDocument()
    expect(screen.getByText(/Starting.../)).toBeInTheDocument()
    expect(screen.getByText(/Downloaded accessibility/)).toBeInTheDocument()
  })

  it('disables Back to Dashboard button during processing', () => {
    render(
      <StatusPage
        isProcessing={true}
        operations={new Map()}
        logTimeline={sampleLogTimeline}
        batchResult={null}
        onDone={jest.fn()}
      />,
    )
    const backButton = screen.getByRole('button', { name: /back to dashboard/i })
    expect(backButton).toBeDisabled()
  })

  it('enables Back to Dashboard button when not processing', () => {
    render(
      <StatusPage
        isProcessing={false}
        operations={new Map()}
        logTimeline={emptyLogTimeline}
        batchResult={{ success: true }}
        onDone={jest.fn()}
      />,
    )
    const backButton = screen.getByRole('button', { name: /back to dashboard/i })
    expect(backButton).toBeEnabled()
  })

  it('calls onDone when Back to Dashboard is clicked', async () => {
    const onDone = jest.fn()
    const user = userEvent.setup()
    render(
      <StatusPage
        isProcessing={false}
        operations={new Map()}
        logTimeline={emptyLogTimeline}
        batchResult={{ success: true }}
        onDone={onDone}
      />,
    )
    await user.click(screen.getByRole('button', { name: /back to dashboard/i }))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('shows Try again button when there are failures', () => {
    render(
      <StatusPage
        isProcessing={false}
        operations={new Map()}
        logTimeline={emptyLogTimeline}
        batchResult={{
          success: false,
          failedSkills: ['skill-a'],
          results: [{ skillName: 'skill-a', success: false, errorMessage: 'Failed' }],
        }}
        onRetry={jest.fn()}
        onDone={jest.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <StatusPage
        isProcessing={false}
        operations={new Map()}
        logTimeline={emptyLogTimeline}
        batchResult={{ success: true }}
        onDone={jest.fn()}
      />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
