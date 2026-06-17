import { useState } from 'react'

export function useWizardStep(totalSteps: number) {
  const [step, setStep] = useState(1)

  const next = () => setStep((s) => Math.min(s + 1, totalSteps))
  const back = () => setStep((s) => Math.max(s - 1, 1))
  const goTo = (s: number) => setStep(s)

  return {
    step,
    next,
    back,
    goTo,
    isFirst: step === 1,
    isLast: step === totalSteps,
    progress: step / totalSteps,
  }
}
