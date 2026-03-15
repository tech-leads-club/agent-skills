import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import jestAxe from 'jest-axe'
import type { LifecycleScope } from '../../shared/types'
import { getState, setState } from '../../webview/lib/vscode-api'
import { HomePage } from '../../webview/views/HomePage'

jest.mock('../../webview/lib/vscode-api', () => ({
  getState: jest.fn(),
  setState: jest.fn(),
}))

const { axe } = jestAxe

const defaultProps = {
  policy: { allowedScopes: 'all' as const, effectiveScopes: ['local', 'global'] as LifecycleScope[] },
  isTrusted: true,
  isProcessing: false,
  onInstall: jest.fn(),
  onUninstall: jest.fn(),
  onUpdate: jest.fn(),
}

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getState as jest.Mock).mockReturnValue(undefined)
    ;(setState as jest.Mock).mockImplementation(() => {})
  })

  it('renders 3 action buttons', () => {
    render(<HomePage {...defaultProps} />)

    expect(screen.getByRole('button', { name: /install add new capabilities/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /uninstall remove installed skills/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^update/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^repair/i })).not.toBeInTheDocument()
  })

  it('calls onInstall when install is clicked', async () => {
    const onInstall = jest.fn()
    const user = userEvent.setup()
    render(<HomePage {...defaultProps} onInstall={onInstall} />)

    await user.click(screen.getByRole('button', { name: /install add new capabilities/i }))
    expect(onInstall).toHaveBeenCalledTimes(1)
  })

  it('calls onUninstall when uninstall is clicked', async () => {
    const onUninstall = jest.fn()
    const user = userEvent.setup()
    render(<HomePage {...defaultProps} onUninstall={onUninstall} />)

    await user.click(screen.getByRole('button', { name: /uninstall remove installed skills/i }))
    expect(onUninstall).toHaveBeenCalledTimes(1)
  })

  it('calls onUpdate when update is clicked', async () => {
    const onUpdate = jest.fn()
    const user = userEvent.setup()
    render(<HomePage {...defaultProps} onUpdate={onUpdate} />)

    await user.click(screen.getByRole('button', { name: /^update/i }))
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })

  it('disables all action buttons during processing', () => {
    render(<HomePage {...defaultProps} isProcessing={true} />)

    expect(screen.getByRole('button', { name: /install add new capabilities/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /uninstall remove installed skills/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^update/i })).toBeDisabled()
  })

  it('disables install and uninstall when lifecycle is blocked', () => {
    render(
      <HomePage
        {...defaultProps}
        policy={{ allowedScopes: 'none', effectiveScopes: [], blockedReason: 'policy-none' }}
      />,
    )

    expect(screen.getByRole('button', { name: /install add new capabilities/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /uninstall remove installed skills/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^update/i })).toBeEnabled()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<HomePage {...defaultProps} />)

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
