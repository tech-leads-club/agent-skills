import { describe, expect, it, jest } from '@jest/globals'

import type {
  CorePorts,
  EnvPort,
  FileSystemPort,
  HttpPort,
  LoggerPort,
  PackageResolverPort,
  ShellPort,
} from '../../ports'

import { categoryIdToFolderName, extractCategoryId, isCategoryFolder } from '../categories.service'

type TestPorts = {
  ports: CorePorts
}

const createPorts = (): TestPorts => {
  const fs = {} as FileSystemPort

  const env = {
    cwd: jest.fn(() => '/workspace/project/packages/cli'),
    homedir: jest.fn(() => '/home/tester'),
    platform: jest.fn(() => 'linux'),
    getEnv: jest.fn(() => undefined),
  } as unknown as EnvPort

  const ports: CorePorts = {
    fs,
    env,
    http: {} as HttpPort,
    logger: {} as LoggerPort,
    packageResolver: {} as PackageResolverPort,
    shell: {} as ShellPort,
  }

  return { ports }
}

describe('category helpers', () => {
  it('extracts ids from category folders', () => {
    expect(extractCategoryId('(security)')).toBe('security')
    expect(extractCategoryId('security')).toBeNull()
  })

  it('detects valid category folders', () => {
    expect(isCategoryFolder('(security)')).toBe(true)
    expect(isCategoryFolder('security')).toBe(false)
  })

  it('converts category ids to folder names', () => {
    expect(categoryIdToFolderName('security')).toBe('(security)')
  })
})
