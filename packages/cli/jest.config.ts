import type { Config } from 'jest'

const config: Config = {
  displayName: 'cli',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: { '^.+\\.[tj]s$': ['ts-jest', { useESM: true, tsconfig: '<rootDir>/tsconfig.spec.json' }] },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: '../../coverage/packages/cli',
}

export default config
