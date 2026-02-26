import type { SkillEntry } from '../../types'

interface ListedSkill {
  name: string
  description: string
}

interface ListedCategory {
  category: string
  skills: ListedSkill[]
}

export interface ListSkillsResponse {
  total_skills: number
  total_categories: number
  categories: ListedCategory[]
}

export function buildListSkillsResponse(skills: Iterable<SkillEntry>, descriptionMaxChars: number): ListSkillsResponse {
  const grouped = new Map<string, ListedSkill[]>()
  let totalSkills = 0

  for (const skill of skills) {
    const list = grouped.get(skill.category) ?? []
    list.push({ name: skill.name, description: truncateDescription(skill.description, descriptionMaxChars) })
    grouped.set(skill.category, list)
    totalSkills += 1
  }

  const categories = Array.from(grouped.entries())
    .map(([category, categorySkills]) => ({
      category,
      skills: categorySkills.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.category.localeCompare(b.category))

  return { total_skills: totalSkills, total_categories: categories.length, categories }
}

function truncateDescription(description: string, maxChars: number): string {
  const clean = description.trim()
  const firstSentence = getFirstSentence(clean)
  if (firstSentence.length <= maxChars) return firstSentence
  return `${firstSentence.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`
}

function getFirstSentence(text: string): string {
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== '.') continue
    if (!isSentenceBoundary(text, index)) continue
    return text.slice(0, index + 1).trim()
  }
  return text
}

function isSentenceBoundary(text: string, periodIndex: number): boolean {
  const previous = periodIndex > 0 ? text[periodIndex - 1] : ''
  const next = periodIndex + 1 < text.length ? text[periodIndex + 1] : ''

  if (isAlphaNumeric(previous) && isAlphaNumeric(next)) return false
  if (previous === ' ' || next === '/') return false
  if (next === '') return true

  const remaining = text.slice(periodIndex + 1).trimStart()
  if (remaining.length === 0) return true

  return /^[A-Z]/.test(remaining)
}

function isAlphaNumeric(char: string): boolean {
  return /^[A-Za-z0-9]$/.test(char)
}
