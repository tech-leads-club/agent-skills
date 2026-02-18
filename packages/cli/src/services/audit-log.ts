import { appendFile, mkdir, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { AUDIT_LOG_FILE, GLOBAL_CONFIG_DIR } from '../utils/constants'

interface AuditResultDetail {
  skill: string
  agent: string
  success: boolean
  error?: string
  path?: string
}

interface AuditEntry {
  action: 'install' | 'remove' | 'update'
  skillName: string
  agents: string[]
  success: number
  failed: number
  forced?: boolean
  timestamp?: string
  details?: AuditResultDetail[]
}

export function getAuditLogPath(baseDir: string = homedir()): string {
  return join(baseDir, GLOBAL_CONFIG_DIR, AUDIT_LOG_FILE)
}

export async function logAudit(entry: AuditEntry, baseDir: string = homedir()): Promise<void> {
  try {
    const logPath = getAuditLogPath(baseDir)
    const logDir = join(baseDir, GLOBAL_CONFIG_DIR)
    await mkdir(logDir, { recursive: true })

    const logLine =
      JSON.stringify({
        ...entry,
        timestamp: new Date().toISOString(),
      }) + '\n'

    await appendFile(logPath, logLine, 'utf-8')
  } catch {
    // Fail silently
  }
}

export async function readAuditLog(limit?: number, baseDir: string = homedir()): Promise<AuditEntry[]> {
  try {
    const logPath = getAuditLogPath(baseDir)
    const content = await readFile(logPath, 'utf-8')
    const lines = content.trim().split('\n').filter(Boolean)

    const entries = lines
      .map((line) => {
        try {
          return JSON.parse(line) as AuditEntry
        } catch {
          return null
        }
      })
      .filter((entry): entry is AuditEntry => entry !== null)
      .reverse()

    return limit ? entries.slice(0, limit) : entries
  } catch {
    return []
  }
}
