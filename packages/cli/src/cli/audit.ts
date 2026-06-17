import { render } from 'ink'
import React from 'react'
import { getAuditLogPath, readAuditLog } from '@tech-leads-club/core'

import { AuditLogViewer } from '../components/AuditLogViewer'
import { ports } from '../ports'

interface AuditOptions {
  limit?: string
  path?: boolean
}

export async function runCliAudit(options: AuditOptions) {
  if (options.path) {
    console.log(getAuditLogPath(ports))
    return
  }

  const limit = options.limit ? parseInt(options.limit, 10) : 10
  const entries = await readAuditLog(ports, limit)
  render(React.createElement(AuditLogViewer, { entries, limit }))
}
