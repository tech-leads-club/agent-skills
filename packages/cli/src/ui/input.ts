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

type OptionState = 'active' | 'selected' | 'cancelled' | 'inactive' | 'selected-active'

interface PromptWithCursor {
  cursor: number
}

export interface GroupMultiSelectOptions<T> {
  [key: string]: Option<T>[]
}

type ExtendedOption<T> = Option<T> & { isHeader?: boolean; group?: string }

export function isCancelled<T>(value: T | symbol): value is symbol {
  return typeof value === 'symbol'
}

function buildTitle(message: string): string {
  return `${pc.blue(S_BAR)}\n${SYMBOL} ${pc.white(pc.bold(message))}\n`
}

function buildNavigationHint(keys: string[], allowBack: boolean): string {
  const backHint = allowBack ? 'esc = back, ' : ''
  return pc.dim(pc.gray(`(${keys.join(', ')}, ${backHint}enter confirm)`))
}

function getOptionState(isSelected: boolean, isActive: boolean): OptionState {
  if (isSelected && isActive) return 'selected-active'
  if (isSelected) return 'selected'
  if (isActive) return 'active'
  return 'inactive'
}

function setCursorIfNeeded(prompt: unknown, cursor: number, optionsLength: number): void {
  if (cursor > 0 && cursor < optionsLength) {
    ;(prompt as PromptWithCursor).cursor = cursor
  }
}

function getCursor(prompt: unknown): number {
  return (prompt as PromptWithCursor).cursor ?? 0
}

export async function blueSelectWithBack<T>(
  message: string,
  options: Option<T>[],
  initialValue?: T,
  allowBack = true,
): Promise<T | symbol> {
  const renderOption = (option: Option<T>, isActive: boolean): string => {
    const radio = isActive ? pc.blue(S_RADIO_ACTIVE) : pc.gray(S_RADIO_INACTIVE)
    const label = isActive ? pc.blue(option.label) : pc.white(option.label)
    const hint = isActive && option.hint ? pc.dim(pc.gray(` - ${option.hint}`)) : ''
    return `${radio} ${label}${hint}`
  }

  const prompt = new SelectPrompt({
    options,
    initialValue,
    render() {
      const title = buildTitle(message)
      const stateRenderers: Record<string, () => string> = {
        submit: () =>
          `${title}${pc.blue(S_BAR)}  ${pc.blue(this.options.find((o) => o.value === this.value)?.label)}\n${pc.blue(S_BAR)}`,
        cancel: () => `${title}${pc.blue(S_BAR)}  ${pc.strikethrough(pc.gray('back'))}\n${pc.blue(S_BAR)}`,
        default: () => {
          const PAGE_SIZE = getSafePageSize()
          const { startIndex, endIndex, hasScrollUp, hasScrollDown } = calculatePaginationWindow(
            this.cursor,
            this.options.length,
            PAGE_SIZE,
          )

          const window = this.options.slice(startIndex, endIndex)
          const optionLines = window.map((option, i) => {
            const absoluteIndex = startIndex + i
            return `${pc.blue(S_BAR)}  ${renderOption(option as Option<T>, absoluteIndex === this.cursor)}`
          })

          if (hasScrollUp || startIndex > 0) optionLines.unshift(`${pc.blue(S_BAR)}  ${pc.gray('↑ ...')}`)
          if (hasScrollDown || endIndex < this.options.length)
            optionLines.push(`${pc.blue(S_BAR)}  ${pc.gray('↓ ...')}`)

          return `${title}${optionLines.join('\n')}\n${pc.blue(S_BAR)}\n${pc.blue(S_BAR_END)}  ${buildNavigationHint(['↑↓ navigate'], allowBack)}`
        },
      }
      return (stateRenderers[this.state] ?? stateRenderers.default)()
    },
  })

  const result = await prompt.prompt()
  if (typeof result === 'symbol' && allowBack) return Symbol.for('back')
  return result as T | symbol
}

export async function blueMultiSelectWithBack<T>(
  message: string,
  options: Option<T>[],
  initialValues: T[] = [],
  allowBack = true,
  initialCursor = 0,
): Promise<{ value: T[] | symbol; cursor: number }> {
  const renderOption = (option: Option<T>, state: OptionState): string => {
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
      const title = buildTitle(message)
      const stateRenderers: Record<string, () => string> = {
        submit: () => {
          const selected = this.options
            .filter((o) => this.value.includes(o.value))
            .map((o) => pc.blue(String(o.value)))
            .join(pc.gray(', '))
          return `${title}${pc.blue(S_BAR)}  ${selected}\n${pc.blue(S_BAR)}`
        },
        cancel: () => `${title}${pc.blue(S_BAR)}  ${pc.strikethrough(pc.gray('back'))}\n${pc.blue(S_BAR)}`,
        default: () => {
          const PAGE_SIZE = getSafePageSize()
          const { startIndex, endIndex, hasScrollUp, hasScrollDown } = calculatePaginationWindow(
            this.cursor,
            this.options.length,
            PAGE_SIZE,
          )

          const window = this.options.slice(startIndex, endIndex)
          const optionLines = window.map((option, i) => {
            const absoluteIndex = startIndex + i
            const state = getOptionState(this.value.includes(option.value), absoluteIndex === this.cursor)
            return `${pc.blue(S_BAR)}  ${renderOption(option as Option<T>, state)}`
          })

          if (hasScrollUp || startIndex > 0) optionLines.unshift(`${pc.blue(S_BAR)}  ${pc.gray('↑ ...')}`)
          if (hasScrollDown || endIndex < this.options.length)
            optionLines.push(`${pc.blue(S_BAR)}  ${pc.gray('↓ ...')}`)

          return `${title}${optionLines.join('\n')}\n${pc.blue(S_BAR)}\n${pc.blue(S_BAR_END)}  ${buildNavigationHint(['↑↓ navigate', 'space select'], allowBack)}`
        },
      }
      return (stateRenderers[this.state] ?? stateRenderers.default)()
    },
  })

  setCursorIfNeeded(prompt, initialCursor, options.length)

  const result = await prompt.prompt()
  const finalCursor = getCursor(prompt)

  if (typeof result === 'symbol' && allowBack) return { value: Symbol.for('back'), cursor: finalCursor }
  return { value: result as T[] | symbol, cursor: finalCursor }
}

export async function blueConfirm(message: string, initialValue = false): Promise<boolean | symbol> {
  const prompt = new ConfirmPrompt({
    active: 'Yes',
    inactive: 'No',
    initialValue,
    render() {
      const title = buildTitle(message)
      const stateRenderers: Record<string, () => string> = {
        submit: () => `${title}${pc.blue(S_BAR)}  ${pc.blue(this.value ? 'Yes' : 'No')}\n${pc.blue(S_BAR)}`,
        cancel: () => `${title}${pc.blue(S_BAR)}  ${pc.strikethrough(pc.gray('cancelled'))}\n${pc.blue(S_BAR)}`,
        default: () => {
          const toggle = this.value
            ? `${pc.blue('● Yes')} ${pc.dim(pc.gray('/'))} ${pc.gray('○')} ${pc.white('No')}`
            : `${pc.gray('○')} ${pc.white('Yes')} ${pc.dim(pc.gray('/'))} ${pc.blue('● No')}`
          return `${title}${pc.blue(S_BAR)}  ${toggle}\n${pc.blue(S_BAR)}\n${pc.blue(S_BAR_END)}  ${pc.dim(pc.gray('(←→ to change, enter to confirm)'))}`
        },
      }
      return (stateRenderers[this.state] ?? stateRenderers.default)()
    },
  })

  return prompt.prompt() as Promise<boolean | symbol>
}

function flattenGroupedOptions<T>(groupedOptions: GroupMultiSelectOptions<T>): ExtendedOption<T>[] {
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

  return flatOptions
}

function getSafePageSize(): number {
  const terminalHeight = process.stdout.rows || 20
  // Title (2) + Footer (2) + Margins (2) = 6 lines reserved
  const availableHeight = Math.max(5, terminalHeight - 8)
  return Math.min(20, availableHeight)
}

function calculatePaginationWindow(cursor: number, total: number, pageSize: number) {
  const hasScrollUp = cursor > Math.floor(pageSize / 2)
  const hasScrollDown = total > pageSize && cursor < total - Math.floor(pageSize / 2)
  const availableSlots = pageSize - (hasScrollUp ? 1 : 0) - (hasScrollDown ? 1 : 0)

  let startIndex = Math.max(0, cursor - Math.floor(availableSlots / 2))

  if (startIndex + availableSlots > total) {
    startIndex = Math.max(0, total - availableSlots)
  }

  const endIndex = Math.min(startIndex + availableSlots, total)

  return { startIndex, endIndex, hasScrollUp, hasScrollDown }
}

export async function blueGroupMultiSelect<T>(
  message: string,
  groupedOptions: GroupMultiSelectOptions<T>,
  initialValues: T[] = [],
  allowBack = true,
  initialCursor = 0,
): Promise<{ value: T[] | symbol; cursor: number }> {
  const flatOptions = flattenGroupedOptions(groupedOptions)

  const renderOption = (option: ExtendedOption<T>, state: OptionState): string => {
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
      const title = `${SYMBOL} ${pc.white(pc.bold(message))}\n`
      const stateRenderers: Record<string, () => string> = {
        submit: () => {
          const selected = this.options
            .filter((o) => this.value.includes(o.value) && !(o as ExtendedOption<T>).isHeader)
            .map((o) => pc.blue(String(o.value)))
            .join(pc.gray(', '))
          return `${title}${pc.blue(S_BAR)}  ${selected}\n${pc.blue(S_BAR)}`
        },
        cancel: () => `${title}${pc.blue(S_BAR)}  ${pc.strikethrough(pc.gray('back'))}\n${pc.blue(S_BAR)}`,
        default: () => {
          const PAGE_SIZE = getSafePageSize()
          const { startIndex, endIndex, hasScrollUp, hasScrollDown } = calculatePaginationWindow(
            this.cursor,
            this.options.length,
            PAGE_SIZE,
          )

          const window = this.options.slice(startIndex, endIndex)
          const lines = window.map((option, i) => {
            const absoluteIndex = startIndex + i
            const state = getOptionState(this.value.includes(option.value), absoluteIndex === this.cursor)
            return `${pc.blue(S_BAR)}  ${renderOption(option as ExtendedOption<T>, state)}`
          })

          if (hasScrollUp || startIndex > 0) lines.unshift(`${pc.blue(S_BAR)}  ${pc.gray('↑ ...')}`)
          if (hasScrollDown || endIndex < this.options.length) lines.push(`${pc.blue(S_BAR)}  ${pc.gray('↓ ...')}`)

          return `${title}${lines.join('\n')}\n${pc.blue(S_BAR)}\n${pc.blue(S_BAR_END)}  ${buildNavigationHint(['↑↓ navigate', 'space select'], allowBack)}`
        },
      }
      return (stateRenderers[this.state] ?? stateRenderers.default)()
    },
  })

  setCursorIfNeeded(prompt, initialCursor, flatOptions.length)

  let result = (await prompt.prompt()) as T[] | symbol
  const finalCursor = getCursor(prompt)

  if (typeof result === 'symbol') {
    return allowBack ? { value: Symbol.for('back'), cursor: finalCursor } : { value: result, cursor: finalCursor }
  }

  result = (result as T[]).filter((val) => !String(val).startsWith('__header_'))
  return { value: result, cursor: finalCursor }
}
