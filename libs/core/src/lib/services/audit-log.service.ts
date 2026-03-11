import { join } from 'node:path'

import { AUDIT_LOG_FILE, GLOBAL_CONFIG_DIR } from '../constants'
import type { CorePorts } from '../ports'
import type { AuditEntry } from '../types'

function resolveBaseDir(ports: CorePorts, baseDir?: string): string {
  return baseDir ?? ports.env.homedir()
}

/**
 * Resolves the shared audit log path in the user's global agent-skills directory.
 *
 * @param ports - Core ports that expose environment access.
 * @param baseDir - Optional base directory override. Defaults to the current home directory.
 * @returns The absolute path to the shared audit log file.
 *
 * @example
 * ```ts
 * const auditLogPath = getAuditLogPath(ports)
 * const testAuditLogPath = getAuditLogPath(ports, '/tmp/test-home')
 * ```
 */
export function getAuditLogPath(ports: CorePorts, baseDir?: string): string {
  return join(resolveBaseDir(ports, baseDir), GLOBAL_CONFIG_DIR, AUDIT_LOG_FILE)
}

/**
 * Appends an audit entry to the shared JSON-lines audit log.
 *
 * The log write is intentionally best-effort: filesystem failures are ignored so
 * install, remove, and update flows do not fail because of audit logging.
 *
 * @param ports - Core ports that expose filesystem and environment access.
 * @param entry - Audit payload to append.
 * @param baseDir - Optional base directory override. Defaults to the current home directory.
 * @returns A promise that resolves when the write completes or is skipped after an error.
 *
 * @example
 * ```ts
 * await logAudit(
 *   ports,
 *   {
 *     action: 'install',
 *     skillName: 'accessibility',
 *     agents: ['Cursor'],
 *     success: 1,
 *     failed: 0,
 *   },
 * )
 * ```
 */
export async function logAudit(ports: CorePorts, entry: AuditEntry, baseDir?: string): Promise<void> {
  try {
    const resolvedBaseDir = resolveBaseDir(ports, baseDir)
    const logPath = getAuditLogPath(ports, resolvedBaseDir)
    const logDir = join(resolvedBaseDir, GLOBAL_CONFIG_DIR)
    const logLine = `${JSON.stringify({ ...entry, timestamp: new Date().toISOString() })}\n`

    await ports.fs.mkdir(logDir, { recursive: true })
    await ports.fs.appendFile(logPath, logLine, 'utf-8')
  } catch {
    // Best-effort operation.
  }
}

/**
 * Reads recent audit log entries from the shared JSON-lines audit log.
 *
 * @param ports - Core ports that expose filesystem and environment access.
 * @param limit - Optional maximum number of most-recent entries to return.
 * @param baseDir - Optional base directory override. Defaults to the current home directory.
 * @returns A promise that resolves to parsed audit entries ordered from newest to oldest.
 *
 * @example
 * ```ts
 * const entries = await readAuditLog(ports, 10)
 * const testEntries = await readAuditLog(ports, undefined, '/tmp/test-home')
 * ```
 */
export async function readAuditLog(ports: CorePorts, limit?: number, baseDir?: string): Promise<AuditEntry[]> {
  try {
    const content = await ports.fs.readFile(getAuditLogPath(ports, baseDir), 'utf-8')
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

    if (limit === undefined) {
      return entries
    }

    if (limit <= 0) {
      return []
    }

    return entries.slice(0, limit)
  } catch {
    return []
  }
}
