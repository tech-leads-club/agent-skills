import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { AUDIT_LOG_FILE, GLOBAL_CONFIG_DIR } from '../../utils/constants'
import { getAuditLogPath, logAudit, readAuditLog } from '../audit-log'

describe('Audit Log', () => {
  const testHome = join(tmpdir(), `.test-agent-skills-${Date.now()}`)
  const testConfigDir = join(testHome, GLOBAL_CONFIG_DIR)
  const testLogPath = join(testConfigDir, AUDIT_LOG_FILE)

  beforeAll(async () => {
    await mkdir(testConfigDir, { recursive: true })
  })

  afterAll(async () => {
    await rm(testHome, { recursive: true, force: true })
  })

  beforeEach(async () => {
    await rm(testLogPath, { force: true })
  })

  describe('getAuditLogPath', () => {
    it('should return path in home directory', () => {
      const path = getAuditLogPath(testHome)
      expect(path).toContain(testHome)
      expect(path).toContain(GLOBAL_CONFIG_DIR)
      expect(path).toContain(AUDIT_LOG_FILE)
    })
  })

  describe('logAudit', () => {
    it('should create audit log file and write entry', async () => {
      await logAudit(
        {
          action: 'install',
          skillName: 'test-skill',
          agents: ['Cursor'],
          success: 1,
          failed: 0,
        },
        testHome,
      )

      const entries = await readAuditLog(undefined, testHome)
      expect(entries).toHaveLength(1)
      expect(entries[0].skillName).toBe('test-skill')
      expect(entries[0].action).toBe('install')
    })

    it('should append to existing audit log', async () => {
      await logAudit(
        {
          action: 'install',
          skillName: 'skill-1',
          agents: ['Cursor'],
          success: 1,
          failed: 0,
        },
        testHome,
      )

      await logAudit(
        {
          action: 'remove',
          skillName: 'skill-2',
          agents: ['Claude Code'],
          success: 1,
          failed: 0,
        },
        testHome,
      )

      const entries = await readAuditLog(undefined, testHome)
      expect(entries).toHaveLength(2)
      expect(entries[0].skillName).toBe('skill-2') // Most recent first
      expect(entries[1].skillName).toBe('skill-1')
    })

    it('should include timestamp in log entries', async () => {
      const beforeTime = Date.now()

      await logAudit(
        {
          action: 'install',
          skillName: 'test-skill',
          agents: ['Cursor'],
          success: 1,
          failed: 0,
        },
        testHome,
      )

      const entries = await readAuditLog(undefined, testHome)
      // Timestamp string exists now
      const timestamp = entries[0].timestamp
      expect(timestamp).toBeDefined()
      const entryTime = new Date(timestamp!).getTime()

      expect(entryTime).toBeGreaterThanOrEqual(beforeTime)
      expect(entryTime).toBeLessThanOrEqual(Date.now())
    })
  })

  describe('readAuditLog', () => {
    it('should return empty array if log file does not exist', async () => {
      const entries = await readAuditLog(undefined, testHome)
      expect(entries).toEqual([])
    })

    it('should parse valid log entries', async () => {
      await mkdir(testConfigDir, { recursive: true })
      const logContent = [
        JSON.stringify({
          action: 'install',
          skillName: 'skill-1',
          agents: ['Cursor'],
          success: 1,
          failed: 0,
          timestamp: '2026-02-18T10:00:00.000Z',
        }),
        JSON.stringify({
          action: 'remove',
          skillName: 'skill-2',
          agents: ['Claude Code'],
          success: 1,
          failed: 0,
          timestamp: '2026-02-18T11:00:00.000Z',
        }),
      ].join('\n')

      await writeFile(testLogPath, logContent, 'utf-8')

      const entries = await readAuditLog(undefined, testHome)
      expect(entries).toHaveLength(2)
      expect(entries[0].skillName).toBe('skill-2') // Most recent first
      expect(entries[1].skillName).toBe('skill-1')
    })

    it('should skip invalid JSON lines', async () => {
      await mkdir(testConfigDir, { recursive: true })
      const logContent = [
        JSON.stringify({
          action: 'install',
          skillName: 'skill-1',
          agents: ['Cursor'],
          success: 1,
          failed: 0,
          timestamp: '2026-02-18T10:00:00.000Z',
        }),
        'invalid json line',
        JSON.stringify({
          action: 'remove',
          skillName: 'skill-2',
          agents: ['Claude Code'],
          success: 1,
          failed: 0,
          timestamp: '2026-02-18T11:00:00.000Z',
        }),
      ].join('\n')

      await writeFile(testLogPath, logContent, 'utf-8')

      const entries = await readAuditLog(undefined, testHome)
      expect(entries).toHaveLength(2)
      expect(entries[0].skillName).toBe('skill-2')
      expect(entries[1].skillName).toBe('skill-1')
    })

    it('should respect limit parameter', async () => {
      await mkdir(testConfigDir, { recursive: true })
      const logContent = Array.from({ length: 20 }, (_, i) =>
        JSON.stringify({
          action: 'install',
          skillName: `skill-${i}`,
          agents: ['Cursor'],
          success: 1,
          failed: 0,
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
        }),
      ).join('\n')

      await writeFile(testLogPath, logContent, 'utf-8')

      const entries = await readAuditLog(5, testHome)
      expect(entries).toHaveLength(5)
      expect(entries[0].skillName).toBe('skill-19') // Most recent
    })

    it('should handle empty lines', async () => {
      await mkdir(testConfigDir, { recursive: true })
      const logContent = [
        JSON.stringify({
          action: 'install',
          skillName: 'skill-1',
          agents: ['Cursor'],
          success: 1,
          failed: 0,
          timestamp: '2026-02-18T10:00:00.000Z',
        }),
        '',
        '',
        JSON.stringify({
          action: 'remove',
          skillName: 'skill-2',
          agents: ['Claude Code'],
          success: 1,
          failed: 0,
          timestamp: '2026-02-18T11:00:00.000Z',
        }),
      ].join('\n')

      await writeFile(testLogPath, logContent, 'utf-8')
      const entries = await readAuditLog(undefined, testHome)
      expect(entries).toHaveLength(2)
    })
  })
})
