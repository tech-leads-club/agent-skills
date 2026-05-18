import nxPreset from '@nx/jest/preset.js'

export default {
  ...nxPreset,

  // Match all spec and test files
  testMatch: [
    '**/__tests__/**/*.spec.ts',
    '**/+(*.)+(spec|test).ts',
  ],

  // Transform TypeScript files using ts-jest with ESM support
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.spec.json',
      },
    ],
  },

  // Fix relative imports ending with .js
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Treat TypeScript files as ESM
  extensionsToTreatAsEsm: ['.ts'],
}
