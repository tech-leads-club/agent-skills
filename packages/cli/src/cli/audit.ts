import { render } from 'ink'
import React from 'react'

import { AuditLogViewer } from '../components/AuditLogViewer'
import { getAuditLogPath, readAuditLog } from '../services/audit-log'

interface AuditOptions {
  limit?: string
  path?: boolean
}

export async function runCliAudit(options: AuditOptions) {
  if (options.path) {
    console.log(getAuditLogPath())
    return
  }

  const limit = options.limit ? parseInt(options.limit, 10) : 10
  const entries = await readAuditLog(limit)
  render(React.createElement(AuditLogViewer, { entries, limit }))
}
