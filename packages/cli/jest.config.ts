import type { Config } from 'jest'

const config: Config = {
  displayName: 'cli',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      { 
        useESM: true, 
        tsconfig: '<rootDir>/tsconfig.spec.json', 
        diagnostics: { 
          ignoreCodes: [151002],
          warnOnly: true
        } 
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/packages/cli',
  moduleNameMapper: { '^@tech-leads-club/core$': '<rootDir>/../../libs/core/src/index.ts' },
}

export default config
