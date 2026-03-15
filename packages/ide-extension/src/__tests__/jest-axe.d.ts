/// <reference types="jest" />

declare module 'jest-axe' {
  const jestAxe: {
    toHaveNoViolations: Record<string, unknown>
    axe: (container: HTMLElement, config?: unknown) => Promise<unknown>
  }
  export default jestAxe
}

declare namespace jest {
  interface Matchers<R> {
    toHaveNoViolations(): R
  }
}
