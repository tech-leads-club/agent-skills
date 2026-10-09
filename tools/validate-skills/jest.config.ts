export default {
  displayName: 'validate-skills',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        useESM: false,
        tsconfig: { module: 'commonjs', esModuleInterop: true, allowSyntheticDefaultImports: true },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: '../../coverage/tools/validate-skills',
  testTimeout: 60000,
}
