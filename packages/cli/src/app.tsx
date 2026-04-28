import { Box, useApp } from 'ink'
import { useEffect, useState } from 'react'

import { useKonamiCode } from './hooks'
import { ArcadeMenu, CreditsView, InstallWizard, ListView, RemoveWizard, UpdateView } from './views'

interface AppProps {
  command?: string
  args?: string[]
}

export const App = ({ command = 'install' }: AppProps) => {
  const { exit } = useApp()
  const [arcade, setArcade] = useState(command === 'arcade')
  const { activated, reset } = useKonamiCode()

  useEffect(() => {
    if (activated && !arcade) {
      setArcade(true)
      reset()
    }
  }, [activated, arcade, reset])

  if (command === 'credits') {
    return (
      <Box flexDirection="column" padding={1}>
        <CreditsView onExit={exit} />
      </Box>
    )
  }

  if (arcade) {
    return (
      <Box flexDirection="column" padding={1}>
        <ArcadeMenu
          onExit={() => {
            if (command === 'arcade') {
              exit()
            } else {
              setArcade(false)
            }
          }}
        />
      </Box>
    )
  }

  return (
    <Box flexDirection="column" padding={1}>
      {command === 'list' && <ListView onExit={exit} />}
      {command === 'remove' && <RemoveWizard onExit={exit} />}
      {command === 'update' && <UpdateView onExit={exit} />}
      {(command === 'install' || !command) && <InstallWizard onExit={exit} />}
    </Box>
  )
}
