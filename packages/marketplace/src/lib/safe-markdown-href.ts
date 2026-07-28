/**
 * Returns true when a markdown href is safe to emit as an `<a>` on the marketplace origin.
 * Allowed: absolute http(s), mailto, and same-document hash links.
 * Relative / package paths and protocol-relative URLs are unsafe (they 404 on the static site).
 */
export function isSafeMarkdownHref(href: string | undefined): boolean {
  if (!href) return false
  const trimmed = href.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('#')) return true
  if (/^https?:/i.test(trimmed)) return true
  if (/^mailto:/i.test(trimmed)) return true
  return false
}

/** Prefer `<code>` for path-like hrefs (contains `/` or ends with a file extension). */
export function isPathLikeHref(href: string): boolean {
  const trimmed = href.trim()
  return trimmed.includes('/') || /\.\w{1,10}$/.test(trimmed)
}
