import { getMatchQuality, isBundledFilePath } from '../utils'

describe('isBundledFilePath', () => {
  it('should accept the conventional directories', () => {
    expect(isBundledFilePath('references/a.md')).toBe(true)
    expect(isBundledFilePath('scripts/run.sh')).toBe(true)
    expect(isBundledFilePath('assets/icon.svg')).toBe(true)
  })

  // why: the registry's file list is the contract. Skills in the catalog use rules/, templates/,
  // lib/ and reference/ too, and the CLI installs them — refusing them here made those files
  // invisible over MCP.
  it('should accept any other directory the registry declares', () => {
    expect(isBundledFilePath('rules/advanced.md')).toBe(true)
    expect(isBundledFilePath('templates/page.html')).toBe(true)
    expect(isBundledFilePath('lib/helpers.js')).toBe(true)
    expect(isBundledFilePath('reference/commands.md')).toBe(true)
    expect(isBundledFilePath('deeply/nested/file.md')).toBe(true)
    expect(isBundledFilePath('README.md')).toBe(true)
  })

  it('should reject the main skill file and an empty path', () => {
    expect(isBundledFilePath('SKILL.md')).toBe(false)
    expect(isBundledFilePath('')).toBe(false)
  })
})

describe('getMatchQuality', () => {
  it('should label scores by band', () => {
    expect(getMatchQuality(67)).toBe('exact')
    expect(getMatchQuality(45)).toBe('exact')
    expect(getMatchQuality(44)).toBe('strong')
    expect(getMatchQuality(30)).toBe('strong')
    expect(getMatchQuality(29)).toBe('partial')
    expect(getMatchQuality(20)).toBe('partial')
    expect(getMatchQuality(19)).toBe('weak')
    expect(getMatchQuality(0)).toBe('weak')
  })

  // invariant: search drops the 'weak' band, so this lower bound decides whether a result
  // reaches the agent at all — it is tool output, not a cosmetic label
  it('should pin the lower bound of the returned bands', () => {
    expect(getMatchQuality(19)).toBe('weak')
    expect(getMatchQuality(20)).not.toBe('weak')
  })
})
