import figlet from 'figlet'
import pc from 'picocolors'

import { crystalGradient } from './styles'

export function generateLogo(): string {
  const asciiArt = figlet.textSync('Tech Leads Club', { font: 'Larry 3D', horizontalLayout: 'default' })
  return `${crystalGradient.multiline(asciiArt)}
  ${pc.white(pc.bold('Tech Leads Club'))} ${pc.blue('›')} ${pc.bold(pc.blue('Agent Skills'))}
  ${pc.white('Curated skills to power up your AI coding agents')}
`
}

export function initScreen(): void {
  console.clear()
  console.log(generateLogo())
}
