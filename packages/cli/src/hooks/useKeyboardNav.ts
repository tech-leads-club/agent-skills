import { useInput } from 'ink'
import { useState } from 'react'

export interface KeyNavOptions {
  cols?: number
  isGrid?: boolean
  loop?: boolean
}

export function useKeyboardNav(itemCount: number, options: KeyNavOptions = {}) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { cols = 1, isGrid = false, loop = true } = options

  useInput((_input, key) => {
    const keyHandlers: Record<string, () => void> = {
      upArrow: () =>
        setSelectedIndex((prev) => {
          if (prev - cols < 0) return loop ? itemCount - 1 : prev
          return prev - cols
        }),
      downArrow: () =>
        setSelectedIndex((prev) => {
          if (prev + cols >= itemCount) return loop ? 0 : prev
          return prev + cols
        }),
      leftArrow: () => isGrid && setSelectedIndex((prev) => (prev > 0 ? prev - 1 : loop ? itemCount - 1 : prev)),
      rightArrow: () => isGrid && setSelectedIndex((prev) => (prev < itemCount - 1 ? prev + 1 : loop ? 0 : prev)),
      pageUp: () => setSelectedIndex((prev) => Math.max(0, prev - 10)),
      pageDown: () => setSelectedIndex((prev) => Math.min(itemCount - 1, prev + 10)),
      home: () => setSelectedIndex(0),
      end: () => setSelectedIndex(itemCount - 1),
    }

    const pressedKey = Object.keys(key).find((k) => key[k as keyof typeof key])
    if (pressedKey && keyHandlers[pressedKey]) keyHandlers[pressedKey]()
  })

  return { selectedIndex, setSelectedIndex }
}
