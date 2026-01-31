import { readFileSync } from 'fs'
import { join } from 'path'

const workspaceRoot = process.cwd()
const tsConfigBase = JSON.parse(readFileSync(join(workspaceRoot, 'tsconfig.base.json'), 'utf-8'))
const paths = tsConfigBase.compilerOptions.paths

function makeModuleNameMapper(srcPaths: Record<string, string[]>, rootDir: string) {
  const aliases: Record<string, string> = {}
  Object.keys(srcPaths).forEach((item) => {
    const key = item.replace('/*', '/(.*)')
    const path = srcPaths[item][0].replace('/*', '/$1')
    aliases[`^${key}$`] = `${rootDir}/${path}`
  })
  return aliases
}

export default {
  displayName: 'skill-plugin',
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
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/tools/skill-plugin',
  moduleNameMapper: makeModuleNameMapper(paths, '<rootDir>/../../'),
  extensionsToTreatAsEsm: [],
}
