import { SITE_URL } from './site'

/**
 * why: next.config sets `trailingSlash: true`, so any canonical/JSON-LD URL emitted without
 * the trailing slash points at a URL that 301s — a self-inflicted canonical mismatch.
 */
export function pathFor(segments: string[] = []): string {
  const clean = segments.filter((segment) => segment !== '' && segment !== undefined && segment !== null)
  return clean.length === 0 ? '/' : `/${clean.join('/')}/`
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export const routes = {
  home: () => pathFor([]),
  about: () => pathFor(['about']),
  skills: () => pathFor(['skills']),
  skill: (id: string) => pathFor(['skills', id]),
  categories: () => pathFor(['categories']),
  category: (id: string) => pathFor(['categories', id]),
  agents: () => pathFor(['agents']),
  agent: (id: string) => pathFor(['agents', id]),
} as const
