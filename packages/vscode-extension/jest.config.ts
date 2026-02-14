import type { Config } from 'jest'

const config: Config = {
  displayName: 'vscode-extension',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: { '^.+\\.[tj]sx?$': ['ts-jest', { useESM: true, tsconfig: '<rootDir>/tsconfig.spec.json' }] },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/packages/vscode-extension',
  moduleNameMapper: {
    '^@tech-leads-club/core$': '<rootDir>/../../libs/core/src/index.ts',
    '^vscode$': '<rootDir>/src/__tests__/__mocks__/vscode.ts',
  },
}

export default config
