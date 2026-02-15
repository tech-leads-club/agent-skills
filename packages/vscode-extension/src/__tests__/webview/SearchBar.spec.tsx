import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { SearchBar } from '../../webview/components/SearchBar'

expect.extend(toHaveNoViolations)

describe('SearchBar Accessibility', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    resultCount: 0,
  }

  it('should have accessible label for search input', () => {
    render(<SearchBar {...defaultProps} />)
    const input = screen.getByRole('searchbox')
    expect(input).toHaveAccessibleName('Search skills')
  })

  it('should have clear button with accessible label when value exists', () => {
    render(<SearchBar {...defaultProps} value="test" />)
    const clearButton = screen.getByRole('button', { name: /clear search/i })
    expect(clearButton).toBeInTheDocument()
    expect(clearButton).toHaveAccessibleName('Clear search')
  })

  it('should not show clear button when value is empty', () => {
    render(<SearchBar {...defaultProps} value="" />)
    const clearButton = screen.queryByRole('button', { name: /clear search/i })
    expect(clearButton).not.toBeInTheDocument()
  })

  it('should announce search results to screen readers', () => {
    const { rerender } = render(<SearchBar {...defaultProps} value="test" resultCount={5} />)

    const liveRegion = screen.getByText('5 skills found')
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true')

    rerender(<SearchBar {...defaultProps} value="test" resultCount={1} />)
    expect(screen.getByText('1 skill found')).toBeInTheDocument()
  })

  it('should not announce when search is empty', () => {
    const { container } = render(<SearchBar {...defaultProps} value="" resultCount={10} />)
    const liveRegion = container.querySelector('[aria-live="polite"]')
    expect(liveRegion).toHaveTextContent('')
  })

  it('should be keyboard navigable', async () => {
    const onChange = jest.fn()
    const user = userEvent.setup()
    render(<SearchBar {...defaultProps} onChange={onChange} />)

    const input = screen.getByRole('searchbox')
    await user.tab()
    expect(input).toHaveFocus()

    await user.keyboard('test query')
    expect(onChange).toHaveBeenCalled()
  })

  it('should allow clearing with keyboard', async () => {
    const onChange = jest.fn()
    const user = userEvent.setup()
    render(<SearchBar {...defaultProps} value="test" onChange={onChange} />)

    const clearButton = screen.getByRole('button', { name: /clear search/i })
    await user.tab() // Focus input
    await user.tab() // Focus clear button
    expect(clearButton).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('should use type="search" for native browser features', () => {
    render(<SearchBar {...defaultProps} />)
    const input = screen.getByRole('searchbox')
    expect(input).toHaveAttribute('type', 'search')
  })

  it('should have placeholder text', () => {
    render(<SearchBar {...defaultProps} />)
    const input = screen.getByPlaceholderText('Search skills...')
    expect(input).toBeInTheDocument()
  })

  describe('Automated WCAG Checks', () => {
    it('should have no accessibility violations (empty state)', async () => {
      const { container } = render(<SearchBar {...defaultProps} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations (with search term)', async () => {
      const { container } = render(<SearchBar {...defaultProps} value="test" resultCount={5} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
