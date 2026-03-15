import { render, screen } from '@testing-library/react'
import jestAxe from 'jest-axe'
import { RestrictedModeBanner } from '../../webview/components/RestrictedModeBanner'

const { axe, toHaveNoViolations } = jestAxe
expect.extend(toHaveNoViolations)

describe('RestrictedModeBanner', () => {
  it('should not render when visible is false', () => {
    const { container } = render(<RestrictedModeBanner visible={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('should render when visible is true', () => {
    render(<RestrictedModeBanner visible={true} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/Restricted Mode/)).toBeInTheDocument()
  })

  it('should pass accessibility checks', async () => {
    const { container } = render(<RestrictedModeBanner visible={true} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
