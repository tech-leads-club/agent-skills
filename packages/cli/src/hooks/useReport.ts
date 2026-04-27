import { useEffect, useState } from 'react'
import { generateAuditReport } from '@tech-leads-club/core'
import type { AuditReport, ReportOptions } from '@tech-leads-club/core'

import { ports } from '../ports'

export function useReport(options?: Partial<ReportOptions>) {
  const [report, setReport] = useState<AuditReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    generateAuditReport(ports, options)
      .then((result) => {
        if (!cancelled) {
          setReport(result)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { report, loading, error }
}
