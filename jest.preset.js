import nxPreset from '@nx/jest/preset.js'

export default {
  ...nxPreset,
  testMatch: ['**/__tests__/**/*.spec.ts', '**/+(*.)+(spec|test).ts'],
  transform: { '^.+\\.[tj]s$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.spec.json' }] },
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  extensionsToTreatAsEsm: ['.ts'],
}
