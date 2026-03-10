import { join } from 'node:path'

import { AUDIT_LOG_FILE, GLOBAL_CONFIG_DIR } from '../constants'
import type { CorePorts } from '../ports'

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
