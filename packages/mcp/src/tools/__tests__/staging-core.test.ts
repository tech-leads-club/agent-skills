import { buildFileUri, getMimeType, getUnsafeStagingPaths, isSafeStagingPath } from '../core/staging'

describe('isSafeStagingPath', () => {
  it('should accept normal reference paths', () => {
    expect(isSafeStagingPath('scripts/render.mjs')).toBe(true)
    expect(isSafeStagingPath('references/neo4j-import.md')).toBe(true)
    expect(isSafeStagingPath('assets/icon.svg')).toBe(true)
    expect(isSafeStagingPath('scripts/nested/deep/tool.py')).toBe(true)
  })

  // hazard: files[] comes from the CDN-served registry, so these are the shapes a tampered
  // registry would use to escape the staging directory
  it('should reject traversal, absolute and Windows-style paths', () => {
    expect(isSafeStagingPath('../../../.bashrc')).toBe(false)
    expect(isSafeStagingPath('scripts/../../../.ssh/authorized_keys')).toBe(false)
    expect(isSafeStagingPath('scripts/./../../etc/passwd')).toBe(false)
    expect(isSafeStagingPath('/etc/passwd')).toBe(false)
    expect(isSafeStagingPath('C:/Windows/System32/evil.dll')).toBe(false)
    expect(isSafeStagingPath('\\\\server\\share\\evil')).toBe(false)
    expect(isSafeStagingPath('scripts\\..\\..\\evil.sh')).toBe(false)
    expect(isSafeStagingPath('scripts/a\0b.sh')).toBe(false)
    expect(isSafeStagingPath('scripts//double.sh')).toBe(false)
    expect(isSafeStagingPath('')).toBe(false)
  })

  it('should reject files outside the optional reference dirs', () => {
    expect(isSafeStagingPath('SKILL.md')).toBe(false)
    expect(isSafeStagingPath('package.json')).toBe(false)
    expect(isSafeStagingPath('other/file.md')).toBe(false)
  })

  it('should report every unsafe path', () => {
    expect(getUnsafeStagingPaths(['scripts/ok.mjs', '../evil', 'SKILL.md'])).toEqual(['../evil', 'SKILL.md'])
  })
})

describe('getMimeType', () => {
  it('should map known extensions', () => {
    expect(getMimeType('scripts/render.mjs')).toBe('text/javascript')
    expect(getMimeType('scripts/check.py')).toBe('text/x-python')
    expect(getMimeType('scripts/setup.sh')).toBe('application/x-sh')
    expect(getMimeType('references/guide.md')).toBe('text/markdown')
    expect(getMimeType('assets/template.json')).toBe('application/json')
  })

  it('should fall back to octet-stream for unknown extensions', () => {
    expect(getMimeType('assets/blob.bin')).toBe('application/octet-stream')
    expect(getMimeType('scripts/noext')).toBe('application/octet-stream')
  })
})

describe('buildFileUri', () => {
  it('should build a file:// URI from an absolute path', () => {
    expect(buildFileUri('/home/user/.cache/agent-skills-mcp/demo/scripts/a.mjs')).toBe(
      'file:///home/user/.cache/agent-skills-mcp/demo/scripts/a.mjs',
    )
  })

  it('should percent-encode spaces so the URI stays parseable', () => {
    expect(buildFileUri('/tmp/my skill/scripts/a.mjs')).toBe('file:///tmp/my%20skill/scripts/a.mjs')
  })

  it('should normalize Windows separators', () => {
    expect(buildFileUri('C:\\Users\\me\\cache\\demo\\scripts\\a.mjs')).toBe(
      'file:///C%3A/Users/me/cache/demo/scripts/a.mjs',
    )
  })
})
