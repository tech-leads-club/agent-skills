import ora, { Ora } from 'ora'
import pc from 'picocolors'

let currentSpinner: Ora | null = null

export function startSpinner(text: string): Ora {
  currentSpinner?.stop()
  currentSpinner = ora({
    text: pc.blue(text),
    color: 'blue',
  }).start()
  return currentSpinner
}

export function stopSpinner(success = true, text?: string): void {
  if (!currentSpinner) return

  const actions: Record<string, () => void> = {
    successWithText: () => currentSpinner!.succeed(pc.green(text!)),
    successNoText: () => currentSpinner!.stop(),
    failWithText: () => currentSpinner!.fail(pc.red(text!)),
    failNoText: () => currentSpinner!.stop(),
  }

  const key = `${success ? 'success' : 'fail'}${text ? 'WithText' : 'NoText'}`
  actions[key]()
  currentSpinner = null
}

export async function withSpinner<T>(text: string, fn: () => Promise<T>): Promise<T> {
  const spinner = startSpinner(text)
  try {
    const result = await fn()
    spinner.stop()
    return result
  } catch (error) {
    spinner.fail(pc.red('Failed'))
    throw error
  }
}
