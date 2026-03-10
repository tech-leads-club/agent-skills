import { join } from 'node:path'

import { AUDIT_LOG_FILE, GLOBAL_CONFIG_DIR } from '../constants'
import type { CorePorts } from '../ports'
import type { AuditEntry } from '../types'

/**
 * Resolves the shared audit log path in the user's global agent-skills directory.
 *
 * @param ports - Core ports that expose environment access.
 * @returns The absolute path to the shared audit log file.
 *
 * @example
 * ```ts
 * const auditLogPath = getAuditLogPath(ports)
 * ```
 */
export function getAuditLogPath(ports: CorePorts): string {
  return join(ports.env.homedir(), GLOBAL_CONFIG_DIR, AUDIT_LOG_FILE)
}

/**
 * Appends an audit entry to the shared JSON-lines audit log.
 *
 * The log write is intentionally best-effort: filesystem failures are ignored so
 * install, remove, and update flows do not fail because of audit logging.
 *
 * @param entry - Audit payload to append.
 * @param ports - Core ports that expose filesystem and environment access.
 * @returns A promise that resolves when the write completes or is skipped after an error.
 *
 * @example
 * ```ts
 * await logAudit(
 *   {
 *     action: 'install',
 *     skillName: 'accessibility',
 *     agents: ['Cursor'],
 *     success: 1,
 *     failed: 0,
 *   },
 *   ports,
 * )
 * ```
 */
export async function logAudit(entry: AuditEntry, ports: CorePorts): Promise<void> {
  try {
    const logPath = getAuditLogPath(ports)
    const logDir = join(ports.env.homedir(), GLOBAL_CONFIG_DIR)
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
 * @returns A promise that resolves to parsed audit entries ordered from newest to oldest.
 *
 * @example
 * ```ts
 * const entries = await readAuditLog(ports, 10)
 * ```
 */
export async function readAuditLog(ports: CorePorts, limit?: number): Promise<AuditEntry[]> {
  try {
    const content = await ports.fs.readFile(getAuditLogPath(ports), 'utf-8')
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
