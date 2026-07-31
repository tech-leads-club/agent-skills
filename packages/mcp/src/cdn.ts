import { SKILLS_CATALOG_PACKAGE } from './constants'

let resolvedCdnRef: string | null = null
let resolvePromise: Promise<string> | null = null

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
 * Resolves the skills-catalog CDN ref once per process.
 * Prefers SKILLS_CDN_REF (local/dev pin), otherwise the published npm "latest" version.
 * why: avoid mutable @latest URLs for skill content (supply-chain / cache poisoning).
 */
export async function resolveCdnRef(): Promise<string> {
  if (resolvedCdnRef) return resolvedCdnRef
  if (resolvePromise) return resolvePromise

  resolvePromise = (async () => {
    const envRef = process.env.SKILLS_CDN_REF?.trim()
    if (envRef) {
      resolvedCdnRef = envRef
      process.stderr.write(`[cdn] using SKILLS_CDN_REF=${envRef}\n`)
      return envRef
    }

    const response = await fetch(`https://registry.npmjs.org/${SKILLS_CATALOG_PACKAGE}/latest`)
    if (!response.ok) {
      throw new Error(`[cdn] failed to resolve ${SKILLS_CATALOG_PACKAGE} version: HTTP ${response.status}`)
    }

    const body = (await response.json()) as { version?: string }
    if (!body.version) {
      throw new Error(`[cdn] npm latest response missing version for ${SKILLS_CATALOG_PACKAGE}`)
    }

    resolvedCdnRef = body.version
    process.stderr.write(`[cdn] pinned ${SKILLS_CATALOG_PACKAGE}@${body.version}\n`)
    return body.version
  })()

  try {
    return await resolvePromise
  } catch (error) {
    resolvePromise = null
    throw error
  }
}

/** Test helper: clear the cached CDN ref between cases. */
export function resetCdnRefForTests(): void {
  resolvedCdnRef = null
  resolvePromise = null
}
