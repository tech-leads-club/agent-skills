import '@testing-library/jest-dom'
import jestAxe from 'jest-axe'

const { toHaveNoViolations } = jestAxe
// eslint-disable-next-line @typescript-eslint/no-explicit-any
expect.extend(toHaveNoViolations as any)
