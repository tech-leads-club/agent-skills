import React, { useEffect, useState } from 'react'

export interface AnimatedTransitionProps {
  visible: boolean
  duration?: number
  children: React.ReactNode
}

export const AnimatedTransition: React.FC<AnimatedTransitionProps> = ({ visible, duration = 250, children }) => {
  const [opacity, setOpacity] = useState(visible ? 1 : 0)

  useEffect(() => {
    if ((visible && opacity === 1) || (!visible && opacity === 0)) return

    const startTime = Date.now()
    const startOpacity = opacity
    const targetOpacity = visible ? 1 : 0
    const frameDuration = 16

    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const currentOpacity = startOpacity + (visible ? progress : -progress) * Math.abs(targetOpacity - startOpacity)
      const clampedOpacity = Math.max(0, Math.min(1, currentOpacity))

      setOpacity(clampedOpacity)

      if (progress >= 1) {
        clearInterval(interval)
        setOpacity(targetOpacity)
      }
    }, frameDuration)

    return () => {
      clearInterval(interval)
    }
  }, [visible, duration])

  if (!visible && opacity <= 0.05) return null
  return <>{children}</>
}
