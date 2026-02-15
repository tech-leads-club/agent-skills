import '@testing-library/jest-dom'
import jestAxe from 'jest-axe'

const { toHaveNoViolations } = jestAxe
expect.extend(toHaveNoViolations)
