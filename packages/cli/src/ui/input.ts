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

const UI_CONSTANTS = {
  MARGIN_X: 2,
  MARGIN_Y: 1,
  PAGE_HISTORY: 5,
  HEADER_HEIGHT: 2,
  FOOTER_HEIGHT: 2,
  MIN_PAGE_SIZE: 5,
  MAX_PAGE_SIZE: 20,
  DEFAULT_WIDTH: 80,
  DEFAULT_HEIGHT: 20,
}

function getTerminalWidth(): number {
  return process.stdout.columns || UI_CONSTANTS.DEFAULT_WIDTH
}

function getTerminalHeight(): number {
  return process.stdout.rows || UI_CONSTANTS.DEFAULT_HEIGHT
}

function truncateText(text: string, maxWidth: number): string {
  if (text.length <= maxWidth) return text
  return text.slice(0, Math.max(0, maxWidth - 3)) + '...'
}

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

function renderPaginatedList<T>(
  title: string,
  items: T[],
  cursor: number,
  pageSize: number,
  renderItem: (item: T, index: number, isActive: boolean) => string,
  navigationHint: string,
): string {
  const { startIndex, endIndex, hasScrollUp, hasScrollDown } = calculatePaginationWindow(cursor, items.length, pageSize)

  const window = items.slice(startIndex, endIndex)
  const optionLines = window.map((item, i) => {
    const absoluteIndex = startIndex + i
    const rendered = renderItem(item, absoluteIndex, absoluteIndex === cursor)
    return `${pc.blue(S_BAR)}  ${rendered}`
  })

  if (hasScrollUp || startIndex > 0) optionLines.unshift(`${pc.blue(S_BAR)}  ${pc.gray('↑ ...')}`)
  if (hasScrollDown || endIndex < items.length) optionLines.push(`${pc.blue(S_BAR)}  ${pc.gray('↓ ...')}`)

  return `${title}${optionLines.join('\n')}\n${pc.blue(S_BAR)}\n${pc.blue(S_BAR_END)}  ${navigationHint}`
}

export async function blueSelectWithBack<T>(
  message: string,
  options: Option<T>[],
  initialValue?: T,
  allowBack = true,
): Promise<T | symbol> {
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
          const maxWidth = getTerminalWidth() - 10

          return renderPaginatedList(
            title,
            this.options,
            this.cursor,
            PAGE_SIZE,
            (option, _, isActive) => {
              const radio = isActive ? pc.blue(S_RADIO_ACTIVE) : pc.gray(S_RADIO_INACTIVE)
              const truncatedLabel = truncateText(option.label, maxWidth)
              const label = isActive ? pc.blue(truncatedLabel) : pc.white(truncatedLabel)
              const hint = isActive && option.hint ? pc.dim(pc.gray(` - ${option.hint}`)) : ''
              return `${radio} ${label}${hint}`
            },
            buildNavigationHint(['↑↓ navigate'], allowBack),
          )
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
          const maxWidth = getTerminalWidth() - 10

          return renderPaginatedList(
            title,
            this.options,
            this.cursor,
            PAGE_SIZE,
            (option, _, isActive) => {
              const state = getOptionState(this.value.includes(option.value), isActive)
              const isSelected = state === 'selected' || state === 'selected-active'
              const isStateActive = state === 'active' || state === 'selected-active'
              const checkbox = isSelected ? pc.blue(S_CHECKBOX_ACTIVE) : pc.gray(S_CHECKBOX_INACTIVE)
              const truncatedLabel = truncateText(option.label, maxWidth)
              const label = isStateActive ? pc.blue(truncatedLabel) : pc.white(truncatedLabel)
              const hint = isStateActive && option.hint ? pc.dim(pc.gray(` (${option.hint})`)) : ''
              return `${checkbox} ${label}${hint}`
            },
            buildNavigationHint(['↑↓ navigate', 'space select'], allowBack),
          )
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
  const terminalHeight = getTerminalHeight()
  const reservedLines = 8 // Title + Footer + Margins
  const availableHeight = Math.max(UI_CONSTANTS.MIN_PAGE_SIZE, terminalHeight - reservedLines)
  return Math.min(UI_CONSTANTS.MAX_PAGE_SIZE, availableHeight)
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
          const maxWidth = getTerminalWidth() - 10

          return renderPaginatedList(
            title,
            this.options,
            this.cursor,
            PAGE_SIZE,
            (option, _, isActive) => {
              const extOption = option as ExtendedOption<T>
              if (extOption.isHeader) return pc.blue(pc.bold(truncateText(extOption.label, maxWidth)))
              const state = getOptionState(this.value.includes(option.value), isActive)
              const isSelected = state === 'selected' || state === 'selected-active'
              const isStateActive = state === 'active' || state === 'selected-active'
              const checkbox = isSelected ? pc.blue(S_CHECKBOX_ACTIVE) : pc.gray(S_CHECKBOX_INACTIVE)
              const truncatedLabel = truncateText(option.label, maxWidth)
              const label = isStateActive ? pc.blue(truncatedLabel) : pc.white(truncatedLabel)
              const hint = isStateActive && option.hint ? pc.dim(pc.gray(` (${option.hint})`)) : ''
              return `  ${checkbox} ${label}${hint}`
            },
            buildNavigationHint(['↑↓ navigate', 'space select'], allowBack),
          )
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
