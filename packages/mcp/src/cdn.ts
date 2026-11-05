import { SKILLS_CATALOG_PACKAGE } from './constants'

/** Builds the npm CDN base URL for a pinned catalog package ref. */
export function buildCdnNpmBase(cdnRef: string): string {
  return `https://cdn.jsdelivr.net/npm/${SKILLS_CATALOG_PACKAGE}@${cdnRef}`
}

/** Returns the registry JSON URL for a pinned catalog package ref. */
export function buildRegistryUrl(cdnRef: string): string {
  return `${buildCdnNpmBase(cdnRef)}/skills-registry.json`
}

/** Returns the skills/ directory base URL for a pinned catalog package ref. */
export function buildSkillsBaseUrl(cdnRef: string): string {
  return `${buildCdnNpmBase(cdnRef)}/skills/`
}

/**
 * Resolves the catalog version to read: SKILLS_CDN_REF when set, otherwise the npm dist-tag `latest`.
 * why: content URLs stay pinned to an exact version (jsDelivr caches those for a year and aliases
 * for up to seven days), so only this pointer is looked up again, through the same endpoint
 * `npm dist-tag ls` uses.
 */
export async function resolveCdnRef(signal?: AbortSignal): Promise<string> {
  const envRef = process.env.SKILLS_CDN_REF?.trim()
  if (envRef) return envRef

  const response = await fetch(`https://registry.npmjs.org/-/package/${SKILLS_CATALOG_PACKAGE}/dist-tags`, { signal })
  if (!response.ok) {
    throw new Error(`[cdn] failed to resolve ${SKILLS_CATALOG_PACKAGE} dist-tags: HTTP ${response.status}`)
  }

  const tags = (await response.json()) as { latest?: unknown }
  if (typeof tags.latest !== 'string' || tags.latest.length === 0) {
    throw new Error(`[cdn] npm dist-tags response has no latest version for ${SKILLS_CATALOG_PACKAGE}`)
  }
  return tags.latest
}
