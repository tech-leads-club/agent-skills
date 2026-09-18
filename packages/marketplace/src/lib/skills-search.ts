import type { Category, Skill } from '../types'

/** invariant: content is indexed only up to this many characters, so a long SKILL.md body
 * cannot dominate index size or dilute scoring. */
const CONTENT_INDEX_LIMIT = 4000

/** invariant: terms this short only match whole tokens or token prefixes — letting "ci" match
 * inside "prin-ci-ples" buries the one skill actually about CI. */
const MIN_INFIX_TERM_LENGTH = 3

const FIELD_WEIGHTS = {
  name: { exact: 100, prefix: 60, infix: 34, fuzzy: 24 },
  id: { exact: 90, prefix: 55, infix: 30, fuzzy: 20 },
  category: { exact: 45, prefix: 28, infix: 16, fuzzy: 0 },
  description: { exact: 22, prefix: 14, infix: 9, fuzzy: 6 },
  content: { exact: 4, prefix: 2, infix: 1, fuzzy: 0 },
} as const

type FieldName = keyof typeof FIELD_WEIGHTS

/** Whole-query bonuses, applied on top of per-term scores. */
const EXACT_NAME_BONUS = 400
const EXACT_ID_BONUS = 360
const NAME_PREFIX_BONUS = 180
const NAME_PHRASE_BONUS = 90

interface IndexedField {
  text: string
  tokens: string[]
  stems: string[]
}

export interface SkillSearchDoc {
  skill: Skill
  fields: Record<FieldName, IndexedField>
  /** Normalized name + id + category, used for whole-query bonuses. */
  normalizedName: string
  normalizedId: string
}

export interface SkillSearchResult {
  skill: Skill
  score: number
  /** How many query terms this skill matched. */
  matchedTerms: number
  /** True when the skill matched only some of the query terms. */
  partial: boolean
}

interface DocScore {
  score: number
  matchedTerms: number
}

export interface ParsedQuery {
  /** Bare terms; skills matching all of them rank above skills matching only some. */
  terms: string[]
  /** Quoted phrases; each must appear verbatim in some field. */
  phrases: string[]
  /** Whole normalized query, used for the name-prefix / exact bonuses. */
  normalized: string
}

/**
 * Lowercase and strip diacritics so "documentação" and "documentacao" are the same token.
 */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * why: a query for "testing" should find a skill that says "tests". This is a deliberately
 * small suffix stripper, not a full stemmer — aggressive stemming collapses unrelated words
 * and the catalog is short enough that precision matters more than recall.
 */
export function stemToken(token: string): string {
  if (token.length > 5 && token.endsWith('ing')) return token.slice(0, -3)
  if (token.length > 4 && token.endsWith('ed')) return token.slice(0, -2)
  if (token.length > 4 && token.endsWith('es')) return token.slice(0, -2)
  if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1)
  return token
}

export function tokenize(value: string): string[] {
  const normalized = normalizeText(value)
  return normalized === '' ? [] : normalized.split(' ')
}

function uniqueTokens(value: string): IndexedField {
  const text = normalizeText(value)
  const tokens = text === '' ? [] : Array.from(new Set(text.split(' ')))
  return { text, tokens, stems: Array.from(new Set(tokens.map(stemToken))) }
}

/**
 * Damerau-less bounded Levenshtein: returns a distance capped at `max`, bailing out as soon
 * as no cell in a row can still come in under the budget.
 */
export function boundedEditDistance(a: string, b: string, max: number): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > max) return max + 1

  let previous = new Array<number>(b.length + 1)
  let current = new Array<number>(b.length + 1)
  for (let j = 0; j <= b.length; j += 1) previous[j] = j

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i
    let rowMin = current[0]
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost)
      if (current[j] < rowMin) rowMin = current[j]
    }
    if (rowMin > max) return max + 1
    const swap = previous
    previous = current
    current = swap
  }

  return previous[b.length]
}

/**
 * why: one edit on a 4-letter word ("plan" -> "plaf") is as likely to be a different word as
 * a typo, so tolerance only opens up as terms get longer.
 */
export function fuzzyBudget(term: string): number {
  if (term.length >= 8) return 2
  if (term.length >= 5) return 1
  return 0
}

export function parseQuery(query: string): ParsedQuery {
  const phrases: string[] = []
  const remainder = query.replace(/"([^"]+)"/g, (_match, phrase: string) => {
    const normalized = normalizeText(phrase)
    if (normalized) phrases.push(normalized)
    return ' '
  })

  return {
    terms: tokenize(remainder),
    phrases,
    normalized: normalizeText(query.replace(/"/g, ' ')),
  }
}

export function buildSearchDoc(skill: Skill, categoryName?: string): SkillSearchDoc {
  const name = uniqueTokens(skill.name)
  const id = uniqueTokens(skill.id)
  return {
    skill,
    normalizedName: name.text,
    normalizedId: id.text,
    fields: {
      name,
      id,
      category: uniqueTokens(`${skill.category} ${categoryName ?? ''}`),
      description: uniqueTokens(skill.description),
      content: uniqueTokens(skill.content.slice(0, CONTENT_INDEX_LIMIT)),
    },
  }
}

export function buildSearchIndex(skills: Skill[], categories: Category[] = []): SkillSearchDoc[] {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]))
  return skills.map((skill) => buildSearchDoc(skill, categoryNames.get(skill.category)))
}

/** Best score a single term can earn from one field, or 0 when the field does not match it. */
function scoreTermInField(term: string, field: IndexedField, weights: (typeof FIELD_WEIGHTS)[FieldName]): number {
  if (field.text === '') return 0

  let best = 0
  for (const token of field.tokens) {
    if (token === term) return weights.exact
    if (token.startsWith(term)) {
      best = Math.max(best, weights.prefix)
      continue
    }
    if (term.length >= MIN_INFIX_TERM_LENGTH && token.includes(term)) best = Math.max(best, weights.infix)
  }
  if (best > 0) return best

  const stem = stemToken(term)
  if (stem !== term || term.length > 3) {
    if (field.stems.includes(stem)) return weights.infix
  }

  if (weights.fuzzy > 0) {
    const budget = fuzzyBudget(term)
    if (budget > 0) {
      for (const token of field.tokens) {
        if (boundedEditDistance(term, token, budget) <= budget) return weights.fuzzy
      }
    }
  }

  return 0
}

/**
 * Score one skill against a parsed query, reporting how many terms it matched. Returns `null`
 * when the skill matched nothing at all, or when a quoted phrase is missing — a phrase is an
 * explicit demand, so it is the one hard filter.
 */
export function scoreDoc(doc: SkillSearchDoc, query: ParsedQuery): DocScore | null {
  for (const phrase of query.phrases) {
    const found = (Object.keys(doc.fields) as FieldName[]).some((field) => doc.fields[field].text.includes(phrase))
    if (!found) return null
  }

  let score = 0
  let matchedTerms = 0
  for (const term of query.terms) {
    let termScore = 0
    for (const field of Object.keys(doc.fields) as FieldName[]) {
      termScore += scoreTermInField(term, doc.fields[field], FIELD_WEIGHTS[field])
    }
    if (termScore > 0) {
      matchedTerms += 1
      score += termScore
    }
  }
  if (matchedTerms === 0 && query.phrases.length === 0) return null

  if (query.phrases.length > 0 && query.terms.length === 0) score += NAME_PHRASE_BONUS

  const whole = query.normalized
  if (whole) {
    if (doc.normalizedName === whole) score += EXACT_NAME_BONUS
    else if (doc.normalizedId === whole) score += EXACT_ID_BONUS
    else if (doc.normalizedName.startsWith(whole) || doc.normalizedId.startsWith(whole)) score += NAME_PREFIX_BONUS
    else if (doc.normalizedName.includes(whole)) score += NAME_PHRASE_BONUS
  }

  return { score, matchedTerms }
}

/**
 * Rank skills for a query. Ties break alphabetically so the order is stable across renders.
 *
 * why: skills matching every term come first, so adding a word narrows as the user expects.
 * Skills matching only some terms follow instead of being dropped — demanding every term
 * would hand back an empty page for a reasonable query like "testing react". The caller can
 * tell the two groups apart through `partial` and label them.
 */
export function searchSkills(docs: SkillSearchDoc[], query: string): SkillSearchResult[] {
  const parsed = parseQuery(query)
  if (parsed.terms.length === 0 && parsed.phrases.length === 0) {
    return docs.map((doc) => ({ skill: doc.skill, score: 0, matchedTerms: 0, partial: false }))
  }

  const full: SkillSearchResult[] = []
  const partial: SkillSearchResult[] = []
  for (const doc of docs) {
    const scored = scoreDoc(doc, parsed)
    if (scored === null) continue
    const isFull = scored.matchedTerms === parsed.terms.length
    const entry = { skill: doc.skill, score: scored.score, matchedTerms: scored.matchedTerms, partial: !isFull }
    ;(isFull ? full : partial).push(entry)
  }

  const byRelevance = (a: SkillSearchResult, b: SkillSearchResult) =>
    b.matchedTerms - a.matchedTerms || b.score - a.score || a.skill.name.localeCompare(b.skill.name)

  return [...full.sort(byRelevance), ...partial.sort(byRelevance)]
}

/**
 * Terms to highlight in result cards — bare terms plus the words inside quoted phrases.
 */
export function searchHighlightTerms(query: string): string[] {
  const parsed = parseQuery(query)
  const terms = new Set<string>([...parsed.terms, ...parsed.phrases.flatMap((phrase) => phrase.split(' '))])
  return Array.from(terms).filter((term) => term.length > 1)
}
