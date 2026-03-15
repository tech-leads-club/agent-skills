import type { Config } from 'jest'

const config: Config = {
  displayName: 'ide-extension',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.spec.{ts,tsx}', '**/+(*.)+(spec|test).{ts,tsx}'],
  testPathIgnorePatterns: [
    '<rootDir>/src/__tests__/integration/',
    // TODO: OOM when using jest.unstable_mockModule with @tech-leads-club/core - refactor to avoid full core load
    '<rootDir>/src/__tests__/services/skill-registry-service.spec.ts',
    '<rootDir>/src/__tests__/services/skill-lock-service.spec.ts',
  ],
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.spec.json',
        diagnostics: { ignoreCodes: [1343, 1378, 151002] },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/packages/ide-extension',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@tech-leads-club/core$': '<rootDir>/../../libs/core/src/index.ts',
    '^vscode$': '<rootDir>/src/__tests__/__mocks__/vscode.ts',
  },
}

export default config
