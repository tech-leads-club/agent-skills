import { describe, expect, it, jest } from '@jest/globals'
import { join } from 'node:path'

import type {
  CorePorts,
  EnvPort,
  FileSystemPort,
  HttpPort,
  LoggerPort,
  PackageResolverPort,
  ShellPort,
} from '../../ports'

import { detectInstalledAgents, getAgentConfig, getAllAgentTypes } from '../agents.service'

type TestPorts = {
  ports: CorePorts
  homedirMock: jest.MockedFunction<() => string>
  existsSyncMock: jest.MockedFunction<(path: string) => boolean>
  readdirSyncMock: jest.MockedFunction<
    (path: string, options?: { withFileTypes: true }) => { name: string; isDirectory(): boolean }[]
  >
}

const createPorts = (): TestPorts => {
  const homedirMock = jest.fn(() => '/home/tester')
  const existsSyncMock = jest.fn<(path: string) => boolean>()
  const readdirSyncMock =
    jest.fn<(path: string, options?: { withFileTypes: true }) => { name: string; isDirectory(): boolean }[]>()

  existsSyncMock.mockReturnValue(false)
  readdirSyncMock.mockReturnValue([])

  const fs = {
    existsSync: existsSyncMock,
    readdirSync: readdirSyncMock,
  } as unknown as FileSystemPort
  const env = {
    cwd: jest.fn(() => '/workspace/project'),
    homedir: homedirMock,
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

  return { ports, homedirMock, existsSyncMock, readdirSyncMock }
}

describe('agents service', () => {
  it('returns all supported agent types sorted alphabetically', () => {
    expect(getAllAgentTypes()).toEqual([
      'aider',
      'amazon-q',
      'antigravity',
      'augment',
      'claude-code',
      'cline',
      'cursor',
      'droid',
      'gemini',
      'github-copilot',
      'kilocode',
      'kiro',
      'codex',
      'opencode',
      'roo',
      'sourcegraph',
      'tabnine',
      'trae',
      'windsurf',
    ])
  })

  it('returns the full configuration for the requested agent type', () => {
    const { ports } = createPorts()

    expect(getAgentConfig(ports, 'cursor')).toMatchObject({
      name: 'cursor',
      displayName: 'Cursor',
      description: 'AI-first code editor built on VS Code',
      skillsDir: '.cursor/skills',
      globalSkillsDir: join('/home/tester', '.cursor/skills'),
    })
    expect(getAgentConfig(ports, 'opencode')).toMatchObject({
      name: 'opencode',
      displayName: 'OpenCode',
      description: 'Open-source AI coding terminal',
      skillsDir: '.opencode/skills',
      globalSkillsDir: join('/home/tester', '.config/opencode/skills'),
    })
  })

  it('uses the injected home directory and filesystem ports for dynamic paths', () => {
    const { ports, homedirMock, existsSyncMock } = createPorts()

    const config = getAgentConfig(ports, 'cursor')

    expect(config.detectInstalled()).toBe(false)
    expect(homedirMock).toHaveBeenCalled()
    expect(existsSyncMock).toHaveBeenCalledWith('/home/tester/.cursor')
  })

  it('returns an empty list when no supported agents are installed', () => {
    const { ports } = createPorts()

    expect(detectInstalledAgents(ports)).toEqual([])
  })

  it('detects only the agents whose install locations exist', () => {
    const { ports, existsSyncMock } = createPorts()
    existsSyncMock.mockImplementation(
      (path) => path === '/home/tester/.cursor' || path === '/workspace/project/.opencode',
    )

    expect(detectInstalledAgents(ports)).toEqual(['cursor', 'opencode'])
  })

  it('returns every supported agent when all install locations exist', () => {
    const { ports, existsSyncMock } = createPorts()
    existsSyncMock.mockReturnValue(true)

    expect(detectInstalledAgents(ports)).toEqual([
      'cursor',
      'claude-code',
      'github-copilot',
      'windsurf',
      'cline',
      'aider',
      'codex',
      'gemini',
      'antigravity',
      'roo',
      'kilocode',
      'trae',
      'kiro',
      'amazon-q',
      'augment',
      'tabnine',
      'opencode',
      'sourcegraph',
      'droid',
    ])
  })
})
