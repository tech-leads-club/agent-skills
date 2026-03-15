import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import jestAxe from 'jest-axe'
import type { LifecycleScope } from '../../shared/types'
import { InstallConfigPage } from '../../webview/views/InstallConfigPage'

const { axe } = jestAxe

describe('InstallConfigPage', () => {
  const defaultProps = {
    selectedSkills: ['accessibility'],
    selectedAgents: ['cursor'],
    scope: 'local' as const,
    method: 'copy' as const,
    effectiveScopes: ['local', 'global'] as LifecycleScope[],
    isProcessing: false,
    onMethodChange: jest.fn(),
    onScopeChange: jest.fn(),
    onCancel: jest.fn(),
    onBack: jest.fn(),
    onConfirm: jest.fn(),
  }

  it('renders scope and method options', () => {
    render(<InstallConfigPage {...defaultProps} />)
    expect(screen.getByRole('group', { name: /scope/i })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /install method/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/local \(project\)/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/global \(user\)/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/copy/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/symlink/i)).toBeInTheDocument()
  })

  it('calls onScopeChange when scope radio is clicked', async () => {
    const onScopeChange = jest.fn()
    const user = userEvent.setup()
    render(<InstallConfigPage {...defaultProps} onScopeChange={onScopeChange} />)
    await user.click(screen.getByLabelText(/global \(user\)/i))
    expect(onScopeChange).toHaveBeenCalledWith('global')
  })

  it('calls onMethodChange when method radio is clicked', async () => {
    const onMethodChange = jest.fn()
    const user = userEvent.setup()
    render(<InstallConfigPage {...defaultProps} onMethodChange={onMethodChange} />)
    await user.click(screen.getByLabelText(/symlink/i))
    expect(onMethodChange).toHaveBeenCalledWith('symlink')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<InstallConfigPage {...defaultProps} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
