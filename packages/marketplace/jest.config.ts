import type { Config } from 'jest'

const config: Config = {
  displayName: 'marketplace',
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
          warnOnly: true,
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // why: the shared preset only marks `.ts` as ESM, so a `.tsx` component compiled to CJS
  // cannot require an ESM `.ts` module — component tests fail the moment a component imports
  // a plain TypeScript helper.
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  coverageDirectory: '../../coverage/packages/marketplace',
}

export default config
