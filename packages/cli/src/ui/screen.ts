import figlet from 'figlet'
import pc from 'picocolors'

import { crystalGradient } from './styles'

export function generateLogo(): string {
  const width = process.stdout?.columns ?? 120
  const title = width < 112 ? 'TLC' : 'Tech Leads Club'
  const asciiArt = figlet.textSync(title, { font: 'Larry 3D', horizontalLayout: 'default' })
  return `${crystalGradient.multiline(asciiArt)}
  ${pc.white(pc.bold('Tech Leads Club'))} ${pc.blue('›')} ${pc.bold(pc.blue('Agent Skills'))}
  ${pc.white('Curated skills to power up your AI coding agents')}
`
}

export function initScreen(): void {
  console.clear()
  console.log(generateLogo())
}
