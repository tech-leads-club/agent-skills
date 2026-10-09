import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
import { getEncoding, type Tiktoken } from 'js-tiktoken'
import { basename, join } from 'path'
import { parse as parseYaml } from 'yaml'

import { checkLinks } from './links'
import { reviewUrls } from './urls'

export interface Check {
  name: string
  passed: boolean
  message: string
  severity: 'error' | 'warning'
  /** Path relative to the skill folder; SKILL.md when absent. */
  file?: string
  line?: number
}

export interface ValidationResult {
  path: string
  checks: Check[]
  passed: number
  failed: number
  warnings: number
  summary?: string
}

export interface ValidateOptions {
  /** Domains the skill had at the base ref. When set, the external URL review runs. */
  baseDomains?: Set<string>
}

const SPEC_FIELDS = ['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools']
const TOKEN_BUDGET = 5000

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

let encoder: Tiktoken | undefined
export function countTokens(text: string): number {
  encoder ??= getEncoding('cl100k_base')
  return encoder.encode(text).length
}

export function validateSkill(skillPath: string, options: ValidateOptions = {}): ValidationResult {
  const results = validateStructure(skillPath)
  if (options.baseDomains && existsSync(skillPath) && statSync(skillPath).isDirectory()) {
    for (const check of reviewUrls(skillPath, options.baseDomains)) record(results, check)
  }
  if (results.failed === 0) {
    results.summary = `PASS — ${results.passed} checks passed${results.warnings > 0 ? `, ${results.warnings} warnings` : ''}`
  } else if (!results.summary) {
    results.summary = `FAIL — ${results.failed} errors, ${results.warnings} warnings`
  }
  return results
}

function record(results: ValidationResult, check: Check) {
  results.checks.push(check)
  if (check.passed) {
    results.passed++
  } else if (check.severity === 'warning') {
    results.warnings++
  } else {
    results.failed++
  }
}

function validateStructure(skillPath: string): ValidationResult {
  const results: ValidationResult = {
    path: skillPath,
    checks: [],
    passed: 0,
    failed: 0,
    warnings: 0,
  }

  function addCheck(
    name: string,
    passed: boolean,
    message: string,
    severity: 'error' | 'warning' = 'error',
    location: { file?: string; line?: number } = {},
  ) {
    record(results, { name, passed, message, severity, ...location })
  }

  // --- Check 1: Folder exists ---
  if (!existsSync(skillPath) || !statSync(skillPath).isDirectory()) {
    addCheck('folder_exists', false, `Path is not a directory: ${skillPath}`)
    results.summary = 'FAIL — folder not found'
    return results
  }
  addCheck('folder_exists', true, 'Skill folder exists')

  // --- Check 2: Folder name is kebab-case ---
  const folderName = basename(skillPath)
  const kebabPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/
  const isKebab = kebabPattern.test(folderName)
  addCheck('folder_kebab_case', isKebab, `Folder name '${folderName}' ${isKebab ? 'is' : 'is NOT'} kebab-case`)

  // --- Check 3: SKILL.md exists (exact casing) ---
  const entries = readdirSync(skillPath)
  const hasSkillMd = entries.includes('SKILL.md')
  addCheck('skill_md_exists', hasSkillMd, hasSkillMd ? 'SKILL.md exists' : 'SKILL.md not found (case-sensitive)')

  const wrongCasings = entries.filter((e) => e.toLowerCase() === 'skill.md' && e !== 'SKILL.md')
  if (wrongCasings.length > 0) {
    addCheck('skill_md_casing', false, `Found wrong casing: ${wrongCasings[0]} (must be exactly SKILL.md)`)
  }

  if (!hasSkillMd) {
    results.summary = 'FAIL — SKILL.md not found'
    return results
  }

  // --- Check 4: No README.md ---
  const hasReadme = entries.some((e) => e.toLowerCase() === 'readme.md')
  addCheck(
    'no_readme',
    !hasReadme,
    !hasReadme
      ? 'No README.md in skill folder'
      : 'README.md found — "Skills are for agents, not humans." No README.md inside the skill folder. No onboarding documentation. Write for an LLM that needs clear, actionable instructions.',
    'warning',
  )

  // --- Check 5: Parse frontmatter ---
  const skillPathFull = join(skillPath, 'SKILL.md')
  const content = readFileSync(skillPathFull, 'utf-8')

  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/)
  if (!fmMatch) {
    addCheck('frontmatter_delimiters', false, 'Missing or malformed --- delimiters in frontmatter')
    results.summary = 'FAIL — frontmatter parse error'
    return results
  }
  addCheck('frontmatter_delimiters', true, 'YAML frontmatter delimiters present')

  const fmRaw = fmMatch[1]
  const fmLines = fmRaw.split('\n')
  const fmLine = (pattern: RegExp) => {
    const index = fmLines.findIndex((l) => pattern.test(l))
    return index === -1 ? {} : { line: index + 2 }
  }
  let fm: Record<string, unknown>

  try {
    const parsed = parseYaml(fmRaw)
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Frontmatter is not a YAML mapping')
    }
    fm = parsed as Record<string, unknown>
    addCheck('frontmatter_valid_yaml', true, 'Frontmatter is valid YAML')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    addCheck('frontmatter_valid_yaml', false, `YAML parse error: ${msg}`)
    results.summary = 'FAIL — YAML parse error'
    return results
  }

  // --- Check 6: name field ---
  const name = fm.name
  if (!name) {
    addCheck('name_present', false, "Missing 'name' field in frontmatter")
  } else {
    addCheck('name_present', true, `name: ${name}`)
    const isNameKebab = kebabPattern.test(String(name))
    addCheck('name_kebab_case', isNameKebab, `name '${name}' ${isNameKebab ? 'is' : 'is NOT'} kebab-case`)

    const nameLower = String(name).toLowerCase()
    const hasReserved = nameLower.includes('claude') || nameLower.includes('anthropic')
    addCheck(
      'name_not_reserved',
      !hasReserved,
      !hasReserved ? 'Name does not use reserved terms' : "Name contains 'claude' or 'anthropic' (reserved)",
    )

    const namesMatch = String(name) === folderName
    addCheck(
      'name_matches_folder',
      namesMatch,
      namesMatch
        ? `name '${name}' matches folder '${folderName}'`
        : `name '${name}' does NOT match folder '${folderName}'`,
      'warning',
    )
  }

  if (name && String(name).includes('--')) {
    addCheck(
      'name_consecutive_hyphens',
      false,
      `name '${name}' contains consecutive hyphens (--)`,
      'warning',
      fmLine(/^name\s*:/),
    )
  }

  // --- Check 6b: frontmatter fields follow the agentskills.io spec ---
  const unknownFields = Object.keys(fm).filter((key) => !SPEC_FIELDS.includes(key))
  for (const field of unknownFields) {
    addCheck(
      'frontmatter_unknown_field',
      false,
      `Unknown frontmatter field '${field}' (spec allows: ${SPEC_FIELDS.join(', ')})`,
      'warning',
      fmLine(new RegExp(`^${escapeRegExp(field)}\\s*:`)),
    )
  }
  if (unknownFields.length === 0) addCheck('frontmatter_unknown_field', true, 'All frontmatter fields are in the spec')

  if (fm.compatibility !== undefined) {
    const compatLength = String(fm.compatibility).length
    addCheck(
      'compatibility_length',
      compatLength <= 500,
      `compatibility length: ${compatLength}/500 chars`,
      'warning',
      fmLine(/^compatibility\s*:/),
    )
  }

  // --- Check 7: description field ---
  const desc = fm.description
  if (!desc) {
    addCheck('description_present', false, "Missing 'description' field in frontmatter")
  } else {
    const descStr = String(desc).trim()
    addCheck('description_present', true, `description present (${descStr.length} chars)`)

    const descOkLength = descStr.length <= 1024
    addCheck('description_length', descOkLength, `Description length: ${descStr.length}/1024 chars`)

    const hasXml = descStr.includes('<') || descStr.includes('>')
    addCheck(
      'description_no_xml',
      !hasXml,
      !hasXml ? 'No XML brackets in description' : 'XML angle brackets found in description (forbidden)',
    )

    // Trigger phrase check
    const triggerKeywords = ['use when', 'use for', 'use this', 'trigger', 'ask for', 'asks to', 'says', 'mentions']
    const descLower = descStr.toLowerCase()
    const hasTriggers = triggerKeywords.some((kw) => descLower.includes(kw))
    addCheck(
      'description_has_triggers',
      hasTriggers,
      hasTriggers
        ? 'Description includes trigger guidance'
        : "Missing trigger phrases — add 'Use when...' guidance (mandatory per CONTRIBUTING.md)",
    )

    // Negative scope check
    const negativeKeywords = ['do not use', "don't use", 'not for', 'not intended for']
    const hasNegativeScope = negativeKeywords.some((kw) => descLower.includes(kw))
    addCheck(
      'description_has_negative_scope',
      hasNegativeScope,
      hasNegativeScope
        ? 'Description includes negative scope'
        : "Missing negative scope — add 'Do NOT use for...' guidance (mandatory per CONTRIBUTING.md)",
    )
  }

  // --- Check 7b: metadata field ---
  const metadata = fm.metadata as Record<string, unknown> | undefined
  if (!metadata || typeof metadata !== 'object') {
    addCheck(
      'metadata_present',
      false,
      "Missing 'metadata' field in frontmatter (expected metadata.version and metadata.author)",
      'warning',
    )
  } else {
    addCheck('metadata_present', true, 'metadata field present')

    for (const [key, value] of Object.entries(metadata)) {
      const isPlainString = typeof value === 'string' && !value.includes('<') && !value.includes('>')
      if (!isPlainString) {
        addCheck(
          'metadata_format',
          false,
          `metadata.${key} must be a string without < or > (got ${typeof value === 'string' ? 'angle brackets' : typeof value})`,
          'warning',
          fmLine(new RegExp(`^\\s+${escapeRegExp(key)}\\s*:`)),
        )
      }
    }

    const metaVersion = metadata.version
    const hasVersion = !!metaVersion
    addCheck(
      'metadata_version',
      hasVersion,
      hasVersion ? `metadata.version: ${metaVersion}` : 'Missing metadata.version',
      'warning',
    )

    const metaAuthor = metadata.author || metadata.original_author
    const hasAuthor = !!metaAuthor
    addCheck(
      'metadata_author',
      hasAuthor,
      hasAuthor ? `metadata.author: ${metaAuthor}` : 'Missing metadata.author',
      'warning',
    )
  }

  // --- Check 8: Body content ---
  const body = content.substring(content.indexOf(fmMatch[0]) + fmMatch[0].length)
  const bodyLines = body.trim().split('\n')
  const lineCount = bodyLines.length

  addCheck(
    'body_line_count',
    lineCount <= 500,
    `SKILL.md body: ${lineCount} lines ${lineCount <= 500 ? '(good)' : '(consider moving content to references/)'}`,
    lineCount > 500 ? 'warning' : 'error',
  )

  const hasExamples = /(example|user says|result:)/i.test(body)
  addCheck(
    'body_has_examples',
    hasExamples,
    hasExamples ? 'Instructions include examples' : 'Consider adding usage examples',
    'warning',
  )

  const hasErrorHandling = /(error|fail|troubleshoot|issue|problem|if.*fails)/i.test(body)
  addCheck(
    'body_has_error_handling',
    hasErrorHandling,
    hasErrorHandling ? 'Instructions include error handling' : 'Consider adding error handling guidance',
    'warning',
  )

  // --- Check 9: Optional files ---
  if (entries.includes('references') && statSync(join(skillPath, 'references')).isDirectory()) {
    const refs = readdirSync(join(skillPath, 'references'))
    for (const ref of refs) {
      const refMentioned = body.includes(ref) || body.includes(`references/${ref}`)
      addCheck(
        `ref_linked_${ref}`,
        refMentioned,
        refMentioned
          ? `references/${ref} is referenced in SKILL.md`
          : `references/${ref} exists but is not referenced in SKILL.md`,
        'warning',
      )
    }
  }

  // --- Check 10: token budget (agentskills.io recommends under 5000) ---
  const tokens = countTokens(content)
  addCheck(
    'token_budget',
    tokens <= TOKEN_BUDGET,
    tokens <= TOKEN_BUDGET ? `${tokens} tokens` : `${tokens}/${TOKEN_BUDGET} tokens — move detail to references/`,
    'warning',
  )

  // --- Check 11: relative links in every markdown file ---
  const links = checkLinks(skillPath)
  for (const link of links.findings) {
    const where = `${link.file}:${link.line}`
    if (link.kind === 'broken') {
      addCheck('link_broken', false, `${where} links to missing ${link.target}`, 'error', link)
    } else {
      addCheck('link_escapes_skill', false, `${where} links outside the skill: ${link.target}`, 'warning', link)
    }
  }
  if (links.findings.length === 0) addCheck('links_resolve', true, `All ${links.checked} relative links resolve`)

  return results
}
