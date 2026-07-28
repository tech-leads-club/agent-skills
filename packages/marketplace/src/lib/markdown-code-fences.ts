/**
 * Markdown line utilities that are aware of fenced code blocks (``` or ~~~).
 *
 * Line-based heading transforms (demote H1, extract title) must never touch `#`
 * comment lines inside code samples — a shell/markdown example like `# install`
 * is content, not a heading. These helpers walk the body once, tracking fence
 * state, so callers only act on lines OUTSIDE code fences.
 */

/** Yield every line with a flag telling whether it sits inside (or delimits) a code fence. */
function* iterateLines(markdown: string): Generator<{ line: string; insideFence: boolean }> {
  let fenceChar = ''
  let fenceLen = 0

  for (const line of markdown.split('\n')) {
    // CommonMark allows a fence to be indented up to 3 spaces.
    const marker = line.replace(/^ {0,3}/, '').match(/^(`{3,}|~{3,})/)?.[1]

    if (marker) {
      if (!fenceChar) {
        // Opening fence.
        fenceChar = marker[0]
        fenceLen = marker.length
      } else if (marker[0] === fenceChar && marker.length >= fenceLen) {
        // Closing fence (same char, at least as long as the opener).
        fenceChar = ''
        fenceLen = 0
      }
      // A fence delimiter line is never a heading target.
      yield { line, insideFence: true }
      continue
    }

    yield { line, insideFence: fenceChar !== '' }
  }
}

/** Apply `transform` only to lines outside code fences; everything else passes through unchanged. */
export function mapLinesOutsideCodeFences(markdown: string, transform: (line: string) => string): string {
  const out: string[] = []
  for (const { line, insideFence } of iterateLines(markdown)) {
    out.push(insideFence ? line : transform(line))
  }
  return out.join('\n')
}

/** Return the first line outside a code fence that matches `predicate`, or undefined. */
export function findLineOutsideCodeFences(markdown: string, predicate: (line: string) => boolean): string | undefined {
  for (const { line, insideFence } of iterateLines(markdown)) {
    if (!insideFence && predicate(line)) return line
  }
  return undefined
}
