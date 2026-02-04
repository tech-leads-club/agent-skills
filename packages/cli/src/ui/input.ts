import { ConfirmPrompt, MultiSelectPrompt, SelectPrompt } from '@clack/core'
import pc from 'picocolors'

import {
  S_BAR,
  S_BAR_END,
  S_CHECKBOX_ACTIVE,
  S_CHECKBOX_INACTIVE,
  S_RADIO_ACTIVE,
  S_RADIO_INACTIVE,
  SYMBOL,
} from './styles'

export interface Option<T> {
  value: T
  label: string
  hint?: string
}

export function isCancelled<T>(value: T | symbol): value is symbol {
  return typeof value === 'symbol'
}

export async function blueSelectWithBack<T>(
  message: string,
  options: Option<T>[],
  initialValue?: T,
  allowBack = true,
): Promise<T | symbol> {
  const opt = (option: Option<T>, isActive: boolean) => {
    const radio = isActive ? pc.blue(S_RADIO_ACTIVE) : pc.gray(S_RADIO_INACTIVE)
    const label = isActive ? pc.blue(option.label) : pc.white(option.label)
    const hint = isActive && option.hint ? pc.dim(pc.gray(` - ${option.hint}`)) : ''
    return `${radio} ${label}${hint}`
  }

  const prompt = new SelectPrompt({
    options,
    initialValue,
    render() {
      const title = `${pc.blue(S_BAR)}\n${SYMBOL} ${pc.white(pc.bold(message))}\n`
      const backHint = allowBack ? 'esc = back, ' : ''

      switch (this.state) {
        case 'submit':
          return `${title}${pc.blue(S_BAR)}  ${pc.blue(this.options.find((o) => o.value === this.value)?.label)}\n${pc.blue(S_BAR)}`
        case 'cancel':
          return `${title}${pc.blue(S_BAR)}  ${pc.strikethrough(pc.gray('back'))}\n${pc.blue(S_BAR)}`
        default:
          return `${title}${this.options
            .map((option, i) => `${pc.blue(S_BAR)}  ${opt(option as Option<T>, i === this.cursor)}`)
            .join(
              '\n',
            )}\n${pc.blue(S_BAR)}\n${pc.blue(S_BAR_END)}  ${pc.dim(pc.gray(`(↑↓ navigate, ${backHint}enter confirm)`))}`
      }
    },
  })

  const result = await prompt.prompt()
  if (typeof result === 'symbol' && allowBack) return Symbol.for('back')
  return result as T | symbol
}

interface PromptWithCursor {
  cursor: number
}

export async function blueMultiSelectWithBack<T>(
  message: string,
  options: Option<T>[],
  initialValues: T[] = [],
  allowBack = true,
  initialCursor = 0,
): Promise<{ value: T[] | symbol; cursor: number }> {
  const opt = (option: Option<T>, state: 'active' | 'selected' | 'cancelled' | 'inactive' | 'selected-active') => {
    const isSelected = state === 'selected' || state === 'selected-active'
    const isActive = state === 'active' || state === 'selected-active'
    const checkbox = isSelected ? pc.blue(S_CHECKBOX_ACTIVE) : pc.gray(S_CHECKBOX_INACTIVE)
    const label = isActive ? pc.blue(option.label) : pc.white(option.label)
    const hint = isActive && option.hint ? pc.dim(pc.gray(` (${option.hint})`)) : ''
    return `${checkbox} ${label}${hint}`
  }

  const prompt = new MultiSelectPrompt({
    options,
    initialValues,
    render() {
      const title = `${pc.blue(S_BAR)}\n${SYMBOL} ${pc.white(pc.bold(message))}\n`
      const backHint = allowBack ? 'esc = back, ' : ''

      switch (this.state) {
        case 'submit':
          return `${title}${pc.blue(S_BAR)}  ${this.options
            .filter((o) => this.value.includes(o.value))
            .map((o) => pc.blue(String(o.value)))
            .join(pc.gray(', '))}\n${pc.blue(S_BAR)}`
        case 'cancel':
          return `${title}${pc.blue(S_BAR)}  ${pc.strikethrough(pc.gray('back'))}\n${pc.blue(S_BAR)}`
        default:
          return `${title}${this.options
            .map((option, i) => {
              const isSelected = this.value.includes(option.value)
              const isActive = i === this.cursor
              const state =
                isSelected && isActive ? 'selected-active' : isSelected ? 'selected' : isActive ? 'active' : 'inactive'
              return `${pc.blue(S_BAR)}  ${opt(option as Option<T>, state)}`
            })
            .join(
              '\n',
            )}\n${pc.blue(S_BAR)}\n${pc.blue(S_BAR_END)}  ${pc.dim(pc.gray(`(↑↓ navigate, space select, ${backHint}enter confirm)`))}`
      }
    },
  })

  // Hack to set initial cursor since it's not exposed in options
  if (initialCursor > 0 && initialCursor < options.length) {
    ;(prompt as unknown as PromptWithCursor).cursor = initialCursor
  }

  const result = await prompt.prompt()
  const finalCursor = (prompt as unknown as PromptWithCursor).cursor ?? 0

  if (typeof result === 'symbol' && allowBack) return { value: Symbol.for('back'), cursor: finalCursor }
  return { value: result as T[] | symbol, cursor: finalCursor }
}

export async function blueConfirm(message: string, initialValue = false): Promise<boolean | symbol> {
  const prompt = new ConfirmPrompt({
    active: 'Yes',
    inactive: 'No',
    initialValue,
    render() {
      const title = `${pc.blue(S_BAR)}\n${SYMBOL} ${pc.white(pc.bold(message))}\n`

      switch (this.state) {
        case 'submit':
          return `${title}${pc.blue(S_BAR)}  ${pc.blue(this.value ? 'Yes' : 'No')}\n${pc.blue(S_BAR)}`
        case 'cancel':
          return `${title}${pc.blue(S_BAR)}  ${pc.strikethrough(pc.gray('cancelled'))}\n${pc.blue(S_BAR)}`
        default:
          return `${title}${pc.blue(S_BAR)}  ${
            this.value
              ? `${pc.blue('● Yes')} ${pc.dim(pc.gray('/'))} ${pc.gray('○')} ${pc.white('No')}`
              : `${pc.gray('○')} ${pc.white('Yes')} ${pc.dim(pc.gray('/'))} ${pc.blue('● No')}`
          }\n${pc.blue(S_BAR)}\n${pc.blue(S_BAR_END)}  ${pc.dim(pc.gray('(←→ to change, enter to confirm)'))}`
      }
    },
  })

  return prompt.prompt() as Promise<boolean | symbol>
}

export interface GroupMultiSelectOptions<T> {
  [key: string]: Option<T>[]
}

type ExtendedOption<T> = Option<T> & { isHeader?: boolean; group?: string }

export async function blueGroupMultiSelect<T>(
  message: string,
  groupedOptions: GroupMultiSelectOptions<T>,
  initialValues: T[] = [],
  allowBack = true,
  initialCursor = 0,
): Promise<{ value: T[] | symbol; cursor: number }> {
  const flatOptions: ExtendedOption<T>[] = []

  for (const [group, options] of Object.entries(groupedOptions)) {
    if (options.length === 0) continue

    flatOptions.push({
      value: `__header_${group}` as unknown as T,
      label: group,
      isHeader: true,
    })

    for (const opt of options) {
      flatOptions.push({ ...opt, group })
    }
  }

  const opt = (
    option: ExtendedOption<T>,
    state: 'active' | 'selected' | 'cancelled' | 'inactive' | 'selected-active',
  ) => {
    if (option.isHeader) return pc.blue(pc.bold(option.label))
    const isSelected = state === 'selected' || state === 'selected-active'
    const isActive = state === 'active' || state === 'selected-active'
    const checkbox = isSelected ? pc.blue(S_CHECKBOX_ACTIVE) : pc.gray(S_CHECKBOX_INACTIVE)
    const label = isActive ? pc.blue(option.label) : pc.white(option.label)
    const hint = isActive && option.hint ? pc.dim(pc.gray(` (${option.hint})`)) : ''
    return `  ${checkbox} ${label}${hint}`
  }

  const prompt = new MultiSelectPrompt({
    options: flatOptions,
    initialValues,
    render() {
      const title = `${pc.blue(S_BAR)}\n${SYMBOL} ${pc.white(pc.bold(message))}\n`
      const backHint = allowBack ? 'esc = back, ' : ''

      switch (this.state) {
        case 'submit': {
          const selected = this.options.filter(
            (o) => this.value.includes(o.value) && !(o as ExtendedOption<T>).isHeader,
          )

          return `${title}${pc.blue(S_BAR)}  ${selected
            .map((o) => pc.blue(String(o.value)))
            .join(pc.gray(', '))}\n${pc.blue(S_BAR)}`
        }
        case 'cancel':
          return `${title}${pc.blue(S_BAR)}  ${pc.strikethrough(pc.gray('back'))}\n${pc.blue(S_BAR)}`
        default: {
          const PAGE_SIZE = 20
          const total = this.options.length

          let startIndex = Math.max(0, this.cursor - Math.floor(PAGE_SIZE / 2))

          if (startIndex + PAGE_SIZE > total) {
            startIndex = Math.max(0, total - PAGE_SIZE)
          }

          const endIndex = Math.min(startIndex + PAGE_SIZE, total)
          const window = this.options.slice(startIndex, endIndex)
          const lines = window.map((option, i) => {
            const absoluteIndex = startIndex + i
            const optWithHeader = option as ExtendedOption<T>
            const isSelected = this.value.includes(option.value)
            const isActive = absoluteIndex === this.cursor
            const state =
              isSelected && isActive ? 'selected-active' : isSelected ? 'selected' : isActive ? 'active' : 'inactive'

            return `${pc.blue(S_BAR)}  ${opt(optWithHeader, state)}`
          })

          if (startIndex > 0) {
            lines.unshift(`${pc.blue(S_BAR)}  ${pc.gray('↑ ...')}`)
            if (lines.length > PAGE_SIZE) lines.pop()
          }

          if (endIndex < total) {
            lines.push(`${pc.blue(S_BAR)}  ${pc.gray('↓ ...')}`)
          }

          return `${title}${lines.join('\n')}\n${pc.blue(S_BAR)}\n${pc.blue(S_BAR_END)}  ${pc.dim(pc.gray(`(↑↓ navigate, space select, ${backHint}enter confirm)`))}`
        }
      }
    },
  })

  // Hack to set initial cursor since it's not exposed in options
  if (initialCursor > 0 && initialCursor < flatOptions.length) {
    ;(prompt as unknown as PromptWithCursor).cursor = initialCursor
  }

  let result = (await prompt.prompt()) as T[] | symbol
  const finalCursor = (prompt as unknown as PromptWithCursor).cursor ?? 0

  if (typeof result === 'symbol') {
    if (allowBack) return { value: Symbol.for('back'), cursor: finalCursor }
    return { value: result, cursor: finalCursor }
  }

  result = (result as T[]).filter((val) => !String(val).startsWith('__header_'))
  return { value: result, cursor: finalCursor }
}
