import { findLineOutsideCodeFences, mapLinesOutsideCodeFences } from '../markdown-code-fences'

describe('mapLinesOutsideCodeFences', () => {
  it('transforms only lines outside code fences', () => {
    const body = 'a\n```\nb\n```\nc\n'
    const upper = mapLinesOutsideCodeFences(body, (line) => line.toUpperCase())
    expect(upper).toBe('A\n```\nb\n```\nC\n')
  })

  it('keeps a longer closing fence and ignores shorter inner backtick runs', () => {
    const body = 'x\n````\n```\ninner\n```\n````\ny\n'
    const upper = mapLinesOutsideCodeFences(body, (line) => line.toUpperCase())
    // Only the leading `x` and trailing `y` are outside the ```` block.
    expect(upper).toBe('X\n````\n```\ninner\n```\n````\nY\n')
  })
})

describe('findLineOutsideCodeFences', () => {
  it('returns the first matching line that is not inside a fence', () => {
    const body = '```\n# fenced\n```\n# real\n'
    expect(findLineOutsideCodeFences(body, (l) => l.startsWith('# '))).toBe('# real')
  })

  it('returns undefined when every match is fenced', () => {
    const body = '```\n# only fenced\n```\n'
    expect(findLineOutsideCodeFences(body, (l) => l.startsWith('# '))).toBeUndefined()
  })
})
