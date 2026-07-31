import { getMatchQuality, isOptionalReferencePath } from '../utils'

describe('isOptionalReferencePath', () => {
  it('should accept only scripts/, references/ and assets/ prefixes', () => {
    expect(isOptionalReferencePath('references/a.md')).toBe(true)
    expect(isOptionalReferencePath('scripts/run.sh')).toBe(true)
    expect(isOptionalReferencePath('assets/icon.svg')).toBe(true)
    expect(isOptionalReferencePath('SKILL.md')).toBe(false)
    expect(isOptionalReferencePath('other/file.md')).toBe(false)
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
