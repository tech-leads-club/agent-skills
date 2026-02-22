#!/usr/bin/env tsx

import chalk from 'chalk'
import { execSync, spawn } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import { dirname, join } from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

import { CATEGORY_FOLDER_PATTERN, computeSkillHash, getFilesInDirectory } from './utils'

interface ScanIssue {
  code: string
  message: string
  reference: [number, null]
  extra_data: {
    risk_score: number
    reason: string
    thought_process: string
    severity: string
  }
  skill: string
  severity: string
}

interface ScanCacheEntry {
  contentHash: string
  issues: ScanIssue[]
  scannedAt: string
}

interface ScanCache {
  version: string
  skills: Record<string, ScanCacheEntry>
}

interface AllowlistEntry {
  skill: string
  code: string
  reason: string
  allowedBy: string
  allowedAt: string
  expiresAt?: string
}

interface Allowlist {
  version: string
  entries: AllowlistEntry[]
}

interface SkillInfo {
  name: string
  dir: string
  contentHash: string
}

interface ScanReport {
  skills: ScanIssue[]
  summary: {
    critical: number
    high: number
    medium: number
    low: number
    allowlisted: number
  }
  scannedAt: string
  scanned: number
  cached: number
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Global configuration for parallel scanning - can be set via env var
const DEFAULT_CONCURRENCY = Math.max(2, Math.min(os.cpus().length, 10))
const PARALLEL_JOBS = Number(process.env['PARALLEL_JOBS'] ?? DEFAULT_CONCURRENCY)

// Configuration
const WORKSPACE_ROOT = join(__dirname, '..', '..', '..')
const CACHE_FILE = join(WORKSPACE_ROOT, '.security-scan-cache.json')
const OUTPUT_FILE = join(WORKSPACE_ROOT, '.security-scan-results.json')
const ALLOWLIST_FILE = join(__dirname, '..', 'security-scan-allowlist.yaml')
const SKILLS_DIR = join(__dirname, '..', 'skills')

// CLI flags
const forceRescan = process.argv.includes('--force')
const updateAllowlist = process.argv.includes('--update-allowlist')

// Main execution wrapper
async function main() {
  try {
    console.log(chalk.bold('🔒 Security Scan (Incremental)'))
    console.log(chalk.gray('📁 Target: packages/skills-catalog/skills'))
    console.log()

    // 1. Discover skills and compute hashes
    const skills = discoverSkills()
    console.log(`🔍 Analyzing ${skills.length} skills...`)

    // 2. Load cache and allowlist
    const cache = loadCache()
    const allowlist = loadAllowlist()

    // 3. Check for expired allowlist entries
    const expiredEntries = allowlist.entries.filter(isAllowlistEntryExpired)

    if (expiredEntries.length > 0) {
      console.log()
      for (const entry of expiredEntries) {
        console.warn(chalk.yellow(`⚠️  Allowlist: entry expired (${entry.skill}:${entry.code})`))
      }
    }

    // 4. Check for orphan allowlist entries
    const skillNames = new Set(skills.map((s) => s.name))
    const orphanEntries = allowlist.entries.filter((e) => !skillNames.has(e.skill))

    if (orphanEntries.length > 0) {
      for (const entry of orphanEntries) {
        console.warn(chalk.yellow(`⚠️  Allowlist: orphan entry (${entry.skill}:${entry.code}) — skill not found`))
      }
    }

    // 5. Identify skills to scan
    const toScan: SkillInfo[] = []
    const cached: SkillInfo[] = []

    for (const skill of skills) {
      const cacheEntry = cache.skills[skill.name]

      if (!forceRescan && cacheEntry && cacheEntry.contentHash === skill.contentHash) {
        cached.push(skill)
      } else {
        toScan.push(skill)
      }
    }

    printSummaryLine('✓', `${cached.length} cached (hash unchanged)`)
    printSummaryLine('→', `${toScan.length} to scan (new/modified)`)
    console.log()

    // 6. Scan changed skills
    if (toScan.length > 0) {
      console.log(
        chalk.cyan(`🚀 Scanning ${toScan.length} skills (parallel: ${Math.min(PARALLEL_JOBS, toScan.length)})...`),
      )

      // Check uvx availability and pre-heat the scanner installation
      try {
        process.stdout.write(chalk.cyan('⏳ Checking environment and updating mcp-scan tool...\n'))
        execSync('uvx --refresh mcp-scan@latest --help', { stdio: 'ignore' })
        process.stdout.write(chalk.green('✓ mcp-scan is ready and updated.\n\n'))
      } catch {
        console.error(chalk.red("❌ 'uvx' not found. Install uv: https://docs.astral.sh/uv/"))
        // Generate a failure report instead of just exiting
        const failureReport: ScanReport = {
          skills: [],
          summary: { critical: 1, high: 0, medium: 0, low: 0, allowlisted: 0 },
          scannedAt: new Date().toISOString(),
          scanned: 0,
          cached: 0,
        }
        writeFileSync(OUTPUT_FILE, JSON.stringify(failureReport, null, 2))
        process.exit(1)
      }

      const activeScanning = new Set<string>()
      let doneCount = 0
      const issueLogs: string[] = []

      const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
      let frameIndex = 0

      const renderProgress = () => {
        const activeList = Array.from(activeScanning).slice(0, 3).join(', ') + (activeScanning.size > 3 ? ', ...' : '')
        frameIndex = (frameIndex + 1) % frames.length
        readline.clearLine(process.stdout, 0)
        readline.cursorTo(process.stdout, 0)
        process.stdout.write(
          `  ${chalk.cyan(frames[frameIndex])} ${chalk.bold(`${doneCount}/${toScan.length}`)} - Active: ${chalk.gray(activeList || 'none')}`,
        )
      }

      const spinnerInterval = setInterval(renderProgress, 80)

      await scanParallel(
        toScan,
        PARALLEL_JOBS,
        (skill) => {
          activeScanning.add(skill.name)
        },
        (skill, issues) => {
          activeScanning.delete(skill.name)
          doneCount++

          const critCount = issues.filter((i) => i.severity === 'critical').length
          const highCount = issues.filter((i) => i.severity === 'high').length
          const mediumCount = issues.filter((i) => i.severity === 'medium').length

          if (critCount > 0 || highCount > 0) {
            const parts = []
            if (critCount > 0) parts.push(chalk.red(`${critCount}C`))
            if (highCount > 0) parts.push(chalk.red(`${highCount}H`))
            if (mediumCount > 0) parts.push(chalk.yellow(`${mediumCount}M`))
            issueLogs.push(
              `   ${chalk.red('✗')} ${chalk.gray(skill.name)} ${chalk.gray('(')}${parts.join(' ')}${chalk.gray(')')}`,
            )
          } else if (mediumCount > 0) {
            issueLogs.push(
              `   ${chalk.yellow('⚠')} ${chalk.gray(skill.name)} ${chalk.gray('(')}${chalk.yellow(`${mediumCount}M`)}${chalk.gray(')')}`,
            )
          }

          // Update cache
          cache.skills[skill.name] = { contentHash: skill.contentHash, issues, scannedAt: new Date().toISOString() }
        },
      )

      clearInterval(spinnerInterval)
      readline.clearLine(process.stdout, 0)
      readline.cursorTo(process.stdout, 0)
      console.log(`  ${chalk.green('✓')} ${chalk.bold(`Scanned ${toScan.length} skills successfully.`)}`)

      if (issueLogs.length > 0) {
        console.log()
        issueLogs.forEach((log) => console.log(log))
      }

      console.log()
    }

    // 7. Merge all results (cached + newly scanned)
    const allIssues: ScanIssue[] = []

    for (const skill of skills) {
      const cacheEntry = cache.skills[skill.name]
      if (cacheEntry) {
        allIssues.push(...cacheEntry.issues)
      }
    }

    // 8. Apply allowlist
    let allowlistedCount = 0
    const activeIssues: ScanIssue[] = []

    for (const issue of allIssues) {
      if (isIssueAllowlisted(issue, allowlist)) {
        allowlistedCount++
      } else {
        activeIssues.push(issue)
      }
    }

    if (allowlistedCount > 0) {
      console.log(chalk.yellow(`📋 Allowlist: ${allowlistedCount} findings suppressed`))
    }

    if (expiredEntries.length > 0) {
      console.log(chalk.yellow(`⚠️  Allowlist: ${expiredEntries.length} entry/entries expired`))
    }

    // 9. Compute summary
    const summary = {
      critical: activeIssues.filter((i) => i.severity === 'critical').length,
      high: activeIssues.filter((i) => i.severity === 'high').length,
      medium: activeIssues.filter((i) => i.severity === 'medium').length,
      low: activeIssues.filter((i) => i.severity === 'low').length,
      allowlisted: allowlistedCount,
    }

    // 10. Save cache
    saveCache(cache)

    // 11. Save report
    const report: ScanReport = {
      skills: activeIssues,
      summary,
      scannedAt: new Date().toISOString(),
      scanned: toScan.length,
      cached: cached.length,
    }

    writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2))

    // 12. Print final summary
    console.log()
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log(
      chalk.gray(`  Scanned: ${toScan.length} | Cached: ${cached.length} | `) +
        chalk.red(`🔴 ${summary.critical}`) +
        chalk.gray(' | ') +
        chalk.yellow(`🟠 ${summary.high}`) +
        chalk.gray(' | ') +
        chalk.gray(`🟡 ${summary.medium}`),
    )
    if (allowlistedCount > 0) {
      console.log(chalk.gray(`  Allowlisted: ${allowlistedCount} | Expired: ${expiredEntries.length}`))
    }
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log()

    // 13. Handle --update-allowlist mode
    if (updateAllowlist && activeIssues.length > 0) {
      console.log(chalk.cyan('📝 Issues that could be allowlisted:'))

      for (const issue of activeIssues) {
        console.log(chalk.gray(`   ${issue.skill}:${issue.code} [${issue.severity}] ${issue.message.slice(0, 80)}...`))
      }

      console.log()
      console.log('To add an entry to the allowlist, edit:')
      console.log(chalk.cyan(`  ${ALLOWLIST_FILE}`))
      process.exit(0)
    }

    // 14. Exit with error if critical/high issues found
    if (summary.critical > 0 || summary.high > 0) {
      console.error(chalk.red.bold('❌ Security scan failed!'))
      console.error()

      // Group by skill
      const bySkill = new Map<string, ScanIssue[]>()
      for (const issue of activeIssues) {
        if (['critical', 'high'].includes(issue.severity)) {
          if (!bySkill.has(issue.skill)) bySkill.set(issue.skill, [])
          bySkill.get(issue.skill)!.push(issue)
        }
      }

      for (const [skill, issues] of bySkill) {
        console.error(chalk.red(`  • ${skill}:`))
        for (const issue of issues) {
          console.error(chalk.gray(`    [${issue.code}] (${issue.severity}) ${issue.message.slice(0, 120)}`))
        }
      }

      console.error()
      console.error(chalk.gray(`📄 Full report: security-scan-results.json`))
      process.exit(1)
    } else {
      console.log(chalk.green.bold('✅ Security scan passed!'))
      console.log(chalk.gray('All skills are free of critical/high severity issues.'))
    }
  } catch (error) {
    console.error(chalk.red('❌ Internal Scan Error:'), error)
    // Attempt to write a failure report even on crash
    try {
      const failureReport: ScanReport = {
        skills: [],
        summary: { critical: 1, high: 0, medium: 0, low: 0, allowlisted: 0 },
        scannedAt: new Date().toISOString(),
        scanned: 0,
        cached: 0,
      }
      writeFileSync(OUTPUT_FILE, JSON.stringify(failureReport, null, 2))
    } catch {
      // Ignore secondary write error
    }
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

async function scanSkill(skill: SkillInfo): Promise<ScanIssue[]> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    const errChunks: Buffer[] = []

    const proc = spawn('uvx', ['mcp-scan@latest', '--skills', skill.dir, '--json'], { timeout: 120_000 })

    proc.stdout.on('data', (chunk: Buffer) => chunks.push(chunk))
    proc.stderr.on('data', (chunk: Buffer) => errChunks.push(chunk))

    proc.on('close', (code) => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8')
        const stderr = Buffer.concat(errChunks).toString('utf-8')

        const output = raw
          .split('\n')
          .filter((line) => !line.startsWith('Installed') && line.trim())
          .join('\n')

        if (!output || code !== 0) {
          return resolve([
            {
              code: 'SCANNER_PROCESS_FAILED',
              message: `mcp-scan execution failed (code ${code}): ${stderr.slice(0, 250) || 'No output'}`,
              reference: [0, null],
              extra_data: {
                risk_score: 10,
                reason: 'Scanner process crashed or did not return valid output',
                thought_process: '',
                severity: 'critical',
              },
              skill: skill.name,
              severity: 'critical',
            },
          ])
        }

        const data = JSON.parse(output) as Record<string, { issues?: ScanIssue[]; error?: Record<string, unknown> }>
        const firstKey = Object.keys(data)[0]

        if (!firstKey) {
          return resolve([
            {
              code: 'SCANNER_MISSING_OUTPUT',
              message: `mcp-scan returned empty JSON for ${skill.name}`,
              reference: [0, null],
              extra_data: {
                risk_score: 10,
                reason: 'Scanner returned empty valid JSON',
                thought_process: '',
                severity: 'critical',
              },
              skill: skill.name,
              severity: 'critical',
            },
          ])
        }

        const result = data[firstKey]!
        const issues: ScanIssue[] = []

        // Catch internal mcp-scan errors
        if (result.error && result.error.is_failure !== false) {
          issues.push({
            code: 'SCANNER_INTERNAL_ERROR',
            message: `mcp-scan error: ${result.error.message || result.error.category || 'Unknown error'}`,
            reference: [0, null],
            extra_data: {
              risk_score: 10,
              reason: 'mcp-scan encountered an error while scanning',
              thought_process: JSON.stringify(result.error.traceback || ''),
              severity: 'critical',
            },
            skill: skill.name,
            severity: 'critical',
          })
        }

        const rawIssues = result.issues || []
        const mappedIssues = rawIssues
          .filter((i) => i.extra_data?.severity)
          .map((i) => ({ ...i, skill: skill.name, severity: i.extra_data.severity }))

        resolve([...issues, ...mappedIssues])
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        resolve([
          {
            code: 'SCANNER_PARSE_ERROR',
            message: `Failed to parse mcp-scan output: ${msg}`,
            reference: [0, null],
            extra_data: {
              risk_score: 10,
              reason: 'Invalid JSON from scanner',
              thought_process: '',
              severity: 'critical',
            },
            skill: skill.name,
            severity: 'critical',
          },
        ])
      }
    })

    // If we can't even spawn the process
    proc.on('error', (err) =>
      resolve([
        {
          code: 'SCANNER_SPAWN_ERROR',
          message: `Failed to spawn mcp-scan: ${err.message}`,
          reference: [0, null],
          extra_data: { risk_score: 10, reason: 'Tool execution failed', thought_process: '', severity: 'critical' },
          skill: skill.name,
          severity: 'critical',
        },
      ]),
    )
  })
}

async function scanParallel(
  skills: SkillInfo[],
  concurrency: number,
  onStart: (skill: SkillInfo) => void,
  onDone: (skill: SkillInfo, issues: ScanIssue[]) => void,
): Promise<Map<string, ScanIssue[]>> {
  const results = new Map<string, ScanIssue[]>()
  const queue = [...skills]

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const skill = queue.shift()!
      onStart(skill)
      const issues = await scanSkill(skill)
      results.set(skill.name, issues)
      onDone(skill, issues)
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, skills.length) }, () => worker())
  await Promise.all(workers)
  return results
}

function printSummaryLine(label: string, value: string | number, indent = '   '): void {
  process.stdout.write(`${indent}${label}: ${value}\n`)
}

function loadCache(): ScanCache {
  if (!existsSync(CACHE_FILE)) return { version: '1.0.0', skills: {} }

  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf-8')) as ScanCache
  } catch {
    return { version: '1.0.0', skills: {} }
  }
}

function saveCache(cache: ScanCache): void {
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
}

function loadAllowlist(): Allowlist {
  if (!existsSync(ALLOWLIST_FILE)) return { version: '1.0.0', entries: [] }

  try {
    const content = readFileSync(ALLOWLIST_FILE, 'utf-8')
    return parseYaml(content) as Allowlist
  } catch (error) {
    console.error(`⚠️  Failed to parse allowlist: ${error}`)
    return { version: '1.0.0', entries: [] }
  }
}

function isAllowlistEntryExpired(entry: AllowlistEntry): boolean {
  if (!entry.expiresAt) return false
  return new Date(entry.expiresAt) < new Date()
}

function isIssueAllowlisted(issue: ScanIssue, allowlist: Allowlist): boolean {
  return allowlist.entries.some(
    (entry) => entry.skill === issue.skill && entry.code === issue.code && !isAllowlistEntryExpired(entry),
  )
}

function discoverSkills(): SkillInfo[] {
  const skills: SkillInfo[] = []

  const entries = readdirSync(SKILLS_DIR, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    if (CATEGORY_FOLDER_PATTERN.test(entry.name)) {
      const categoryPath = join(SKILLS_DIR, entry.name)
      const categoryEntries = readdirSync(categoryPath, { withFileTypes: true })
      for (const skillEntry of categoryEntries) {
        if (!skillEntry.isDirectory()) continue
        const skillDir = join(categoryPath, skillEntry.name)
        const skillMdPath = join(skillDir, 'SKILL.md')
        if (!existsSync(skillMdPath)) continue
        const files = getFilesInDirectory(skillDir)
        const contentHash = computeSkillHash(skillDir, files)
        skills.push({ name: skillEntry.name, dir: skillDir, contentHash })
      }
    } else {
      const skillMdPath = join(SKILLS_DIR, entry.name, 'SKILL.md')
      if (!existsSync(skillMdPath)) continue
      const skillDir = join(SKILLS_DIR, entry.name)
      const files = getFilesInDirectory(skillDir)
      const contentHash = computeSkillHash(skillDir, files)
      skills.push({ name: entry.name, dir: skillDir, contentHash })
    }
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name))
}
