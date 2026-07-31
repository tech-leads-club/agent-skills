import { isOptionalReferencePath } from '../../utils'

/**
 * Rejects any skill-relative path that must not be written to disk.
 *
 * hazard: `files[]` comes from the registry JSON served by the CDN, so it is remote input.
 * contentHash verification covers file *contents*, not the path list — a tampered registry
 * could ask us to write `../../../.bashrc`. Every path is therefore checked before staging.
 */
export function isSafeStagingPath(filePath: string): boolean {
  if (filePath.length === 0) return false
  if (!isOptionalReferencePath(filePath)) return false
  // hazard: reject absolute paths, drive letters, UNC prefixes and backslash separators
  if (filePath.startsWith('/') || filePath.startsWith('\\')) return false
  if (/^[a-zA-Z]:/.test(filePath)) return false
  if (filePath.includes('\\')) return false
  if (filePath.includes('\0')) return false

  const segments = filePath.split('/')
  return segments.every((segment) => segment !== '' && segment !== '.' && segment !== '..')
}

export function getUnsafeStagingPaths(filePaths: string[]): string[] {
  return filePaths.filter((filePath) => !isSafeStagingPath(filePath))
}

/** Maps a file extension to the mimeType advertised on the resource_link. */
export function getMimeType(filePath: string): string {
  const extension = filePath.slice(filePath.lastIndexOf('.') + 1).toLowerCase()
  const byExtension: Record<string, string> = {
    js: 'text/javascript',
    mjs: 'text/javascript',
    cjs: 'text/javascript',
    ts: 'text/typescript',
    py: 'text/x-python',
    sh: 'application/x-sh',
    bash: 'application/x-sh',
    md: 'text/markdown',
    json: 'application/json',
    yaml: 'application/yaml',
    yml: 'application/yaml',
    svg: 'image/svg+xml',
    png: 'image/png',
    csv: 'text/csv',
    txt: 'text/plain',
  }
  return byExtension[extension] ?? 'application/octet-stream'
}

/**
 * Builds a `file://` URI for a staged file.
 * why: the MCP spec's canonical resource_link example is a file:// URI, so staged files are
 * advertised the same way instead of as a bespoke JSON path field.
 */
export function buildFileUri(absolutePath: string): string {
  const normalized = absolutePath.replace(/\\/g, '/')
  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`
  return `file://${withLeadingSlash.split('/').map(encodeURIComponent).join('/')}`
}
