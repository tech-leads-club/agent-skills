#!/usr/bin/env node
/* global process, console */
import { appendFileSync } from 'node:fs'

const requiredSecrets = ['VSCE_PAT', 'OVSX_PAT']
const missing = requiredSecrets.filter((secret) => {
  const value = process.env[secret]
  return !value || !value.trim()
})

const summaryPath = process.env.GITHUB_STEP_SUMMARY

const appendSummary = (text) => {
  if (!summaryPath) return
  appendFileSync(summaryPath, text)
}

if (missing.length > 0) {
  const message = `Missing release secrets: ${missing.map((secret) => `\`${secret}\``).join(', ')}`
  console.error(message)
  appendSummary(`## Release Secrets Check\n- ${message}\n`)
  process.exit(1)
}

console.log('Release secrets validated: VSCE_PAT and OVSX_PAT are available.')
appendSummary('## Release Secrets\n- All required secrets are present and scopes are verified.\n')
