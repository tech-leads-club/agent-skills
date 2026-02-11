import figlet from 'figlet'
import pc from 'picocolors'

import { crystalGradient } from './styles'
import { getTerminalWidth } from './utils'

export function generateLogo(): string {
  const width = getTerminalWidth()
  const fullTitle = 'Tech Leads Club'
  const fullArt = figlet.textSync(fullTitle, { font: 'Larry 3D', horizontalLayout: 'default' })
  const artWidth = fullArt.split('\n').reduce((max, line) => Math.max(max, line.length), 0)

  const LOGO_WIDTH_PADDING = 2

  const title = width < artWidth + LOGO_WIDTH_PADDING ? 'TLC' : fullTitle
  const asciiArt =
    title === fullTitle ? fullArt : figlet.textSync(title, { font: 'Larry 3D', horizontalLayout: 'default' })

  return `${crystalGradient.multiline(asciiArt)}
  ${pc.white(pc.bold('Tech Leads Club'))} ${pc.blue('›')} ${pc.bold(pc.blue('Agent Skills'))}
  ${pc.white('Curated skills to power up your AI coding agents')}
`
}

export function initScreen(): void {
  console.clear()
  console.log(generateLogo())
}
