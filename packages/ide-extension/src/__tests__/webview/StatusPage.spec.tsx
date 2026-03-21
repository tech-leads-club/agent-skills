import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import jestAxe from 'jest-axe'
import { StatusPage } from '../../webview/views/StatusPage'

const { axe } = jestAxe

// Mock scrollIntoView for tests
window.HTMLElement.prototype.scrollIntoView = jest.fn()

const emptyLogTimeline: Array<{
  operation: 'install' | 'remove' | 'update'
  skillName: string
  message: string
  severity: 'info' | 'warn' | 'error'
}> = []

const sampleLogTimeline: Array<{
  operation: 'install' | 'remove' | 'update'
  skillName: string
  message: string
  severity: 'info' | 'warn' | 'error'
}> = [
  {
    skillName: 'accessibility',
    operation: 'install',
    message: 'Starting...',
    severity: 'info',
  },
  {
    skillName: 'accessibility',
    operation: 'install',
    message: 'Downloaded accessibility',
    severity: 'info',
  },
]

describe('StatusPage', () => {
  it('renders operation in progress state', () => {
    render(
      <StatusPage
        isProcessing={true}
        currentStep={null}
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
        currentStep={null}
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
        currentStep={null}
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
        currentStep={null}
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
        currentStep={null}
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
        currentStep={null}
        logTimeline={emptyLogTimeline}
        batchResult={{ success: true }}
        onDone={jest.fn()}
      />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('shows concurrent rejection feedback while an action is running', () => {
    render(
      <StatusPage
        isProcessing={true}
        currentStep={'Installing seo (local)'}
        logTimeline={emptyLogTimeline}
        batchResult={null}
        rejectionMessage={'Another action is already running.'}
        onDone={jest.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Another action is already running.')
  })
})
