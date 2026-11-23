import { readFileSync } from 'fs'
import { join } from 'path'

import { isText, listSkillFiles } from './files'
import type { Check } from './validate'

const URL_PATTERN = /https?:\/\/[^\s<>"'`()[\]{}|\\^]+/gi
const RAW_CONTENT_HOSTS = [
  'raw.githubusercontent.com',
  'gist.github.com',
  'gist.githubusercontent.com',
  'pastebin.com',
  'paste.ee',
]
const SHORTENER_HOSTS = [
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'ow.ly',
  'is.gd',
  'buff.ly',
  'rebrand.ly',
  'cutt.ly',
]
const PLACEHOLDER_HOSTS = ['example.com', 'example.org', 'example.net']
const PLACEHOLDER_TLDS = ['.test', '.invalid', '.example', '.localhost']
const REMOTE_SCRIPT = /\b(?:curl|wget)\b[^|\n]*\|\s*(?:sudo\s+(?:-\S+\s+)*)?(?:sh|bash|zsh)\b/

const matchesHost = (host: string, list: string[]) => list.some((h) => host === h || host.endsWith(`.${h}`))

export function isPlaceholderHost(host: string): boolean {
  return (
    matchesHost(host, PLACEHOLDER_HOSTS) ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    PLACEHOLDER_TLDS.some((tld) => host.endsWith(tld))
  )
}

export function extractUrls(line: string): { url: string; host: string }[] {
  const urls: { url: string; host: string }[] = []
  for (const [match] of line.matchAll(URL_PATTERN)) {
    const url = match.replace(/[.,;:!?*_~]+$/, '')
    try {
      urls.push({ url, host: new URL(url).hostname.toLowerCase() })
    } catch {
      // not a parseable URL; nothing to review
    }
  }
  return urls
}

/** Every external domain in the given text contents. */
export function domainsIn(contents: Iterable<string>): Set<string> {
  const domains = new Set<string>()
  for (const content of contents) {
    for (const { host } of extractUrls(content)) domains.add(host)
  }
  return domains
}

/** Reads every text file of the skill and flags URLs a reviewer should look at. Never an error. */
export function reviewUrls(skillPath: string, baseDomains: Set<string>): Check[] {
  const checks: Check[] = []
  const reported = new Set<string>()

  for (const file of listSkillFiles(skillPath)) {
    const content = readFileSync(join(skillPath, file))
    if (!isText(content)) continue

    content
      .toString('utf-8')
      .split('\n')
      .forEach((text, index) => {
        const line = index + 1
        const warn = (name: string, message: string) =>
          checks.push({ name, passed: false, message, severity: 'warning', file, line })

        for (const { url, host } of extractUrls(text)) {
          if (isPlaceholderHost(host)) continue
          if (!baseDomains.has(host) && !reported.has(host)) {
            reported.add(host)
            warn('external_url_new_domain', `New external domain ${host} (${file}:${line})`)
          }
          if (matchesHost(host, RAW_CONTENT_HOSTS)) warn('external_url_raw_content', `Raw content URL: ${url}`)
          if (matchesHost(host, SHORTENER_HOSTS)) warn('external_url_shortener', `Shortened URL: ${url}`)
        }
        if (REMOTE_SCRIPT.test(text)) {
          warn('remote_script_execution', `Remote script piped to a shell at ${file}:${line}: ${text.trim()}`)
        }
      })
  }

  return checks
}
