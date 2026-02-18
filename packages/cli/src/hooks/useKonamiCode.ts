import { useInput } from 'ink'
import { useCallback, useRef, useState } from 'react'

const KONAMI_SEQUENCE = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'] as const

type KonamiKey = (typeof KONAMI_SEQUENCE)[number]

export function useKonamiCode() {
  const [activated, setActivated] = useState(false)
  const bufferRef = useRef<KonamiKey[]>([])

  useInput((input, key) => {
    if (activated) return
    let mapped: KonamiKey | null = null
    if (key.upArrow) mapped = 'up'
    else if (key.downArrow) mapped = 'down'
    else if (key.leftArrow) mapped = 'left'
    else if (key.rightArrow) mapped = 'right'
    else if (input.toLowerCase() === 'b') mapped = 'b'
    else if (input.toLowerCase() === 'a') mapped = 'a'

    if (!mapped) {
      bufferRef.current = []
      return
    }

    bufferRef.current.push(mapped)

    if (bufferRef.current.length > KONAMI_SEQUENCE.length) {
      bufferRef.current = bufferRef.current.slice(-KONAMI_SEQUENCE.length)
    }

    if (
      bufferRef.current.length === KONAMI_SEQUENCE.length &&
      bufferRef.current.every((k, i) => k === KONAMI_SEQUENCE[i])
    ) {
      setActivated(true)
      bufferRef.current = []
    }
  })

  const reset = useCallback(() => {
    setActivated(false)
    bufferRef.current = []
  }, [])

  return { activated, reset }
}
