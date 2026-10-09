import { realpathSync } from 'fs'
import { basename, dirname, join, relative, sep } from 'path'

import type { Check, ValidationResult } from './validate'

type Write = (line: string) => void

export const skillLabel = (r: ValidationResult) => `${basename(dirname(r.path))}/${basename(r.path)}`

export function printReport(results: ValidationResult, write: Write) {
  write(`\n${'='.repeat(60)}`)
  write(`  Skill Validation Report`)
  write(`  Path: ${results.path}`)
  write(`${'='.repeat(60)}\n`)

  for (const check of results.checks) {
    const icon = check.passed ? '✅' : check.severity === 'warning' ? '⚠️' : '❌'
    write(`  ${icon} ${check.name}: ${check.message}`)
  }

  write(`\n${'─'.repeat(60)}`)
  write(`  ${results.summary}`)
  write(`  Passed: ${results.passed} | Failed: ${results.failed} | Warnings: ${results.warnings}`)
  write(`${'─'.repeat(60)}\n`)
}

export function printBatchSummary(allResults: ValidationResult[], write: Write) {
  const totalPassed = allResults.filter((r) => r.failed === 0).length
  const totalFailed = allResults.filter((r) => r.failed > 0).length
  const totalWarnings = allResults.reduce((acc, r) => acc + r.warnings, 0)

  write(`\n${'='.repeat(60)}`)
  write(`  Batch Validation Summary`)
  write(`${'='.repeat(60)}\n`)

  for (const r of allResults) {
    const icon = r.failed === 0 ? '✅' : '❌'
    const warningStr = r.warnings > 0 ? ` (${r.warnings} warnings)` : ''
    write(`  ${icon} ${skillLabel(r)}: ${r.summary}${warningStr}`)
  }

  write(`\n${'─'.repeat(60)}`)
  write(
    `  Total: ${allResults.length} skills | Passed: ${totalPassed} | Failed: ${totalFailed} | Warnings: ${totalWarnings}`,
  )
  write(`${'─'.repeat(60)}\n`)
}

export interface Finding {
  check: Check
  /** Repo-relative path, `/` separated. */
  file: string
  line: number
}

export function findingsOf(results: ValidationResult, repoRoot: string): Finding[] {
  return results.checks
    .filter((check) => !check.passed)
    .map((check) => ({
      check,
      file: relative(repoRoot, join(realpathSync(results.path), check.file ?? 'SKILL.md'))
        .split(sep)
        .join('/'),
      line: check.line ?? 1,
    }))
}

const isUrlReview = (c: Check) => c.name.startsWith('external_url_') || c.name === 'remote_script_execution'
const priority = (c: Check) => (c.severity === 'error' ? 0 : isUrlReview(c) ? 1 : 2)

const escapeData = (s: string) => s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A')
const escapeProperty = (s: string) => escapeData(s).replace(/:/g, '%3A').replace(/,/g, '%2C')

/** GitHub workflow commands: errors first, then URL review, then the rest. */
export function annotations(findings: Finding[]): string[] {
  return [...findings]
    .sort((a, b) => priority(a.check) - priority(b.check))
    .map(
      ({ check, file, line }) =>
        `::${check.severity} file=${escapeProperty(file)},line=${line},title=${escapeProperty(check.name)}::${escapeData(check.message)}`,
    )
}

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')

export function stepSummary(changed: { label: string; findings: Finding[] }[]): string {
  const out = ['## Skill validation', '']
  if (changed.length === 0) return [...out, 'No changed skills', ''].join('\n')

  for (const { label, findings } of changed) {
    out.push(`### ${label}`, '')
    if (findings.length === 0) {
      out.push('No failed checks', '')
      continue
    }
    out.push('| Check | Severity | Location | Message |', '| --- | --- | --- | --- |')
    for (const { check, file, line } of findings) {
      out.push(`| ${cell(check.name)} | ${check.severity} | ${cell(`${file}:${line}`)} | ${cell(check.message)} |`)
    }
    out.push('')
  }
  return out.join('\n')
}
