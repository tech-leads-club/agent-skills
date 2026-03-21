import { useEffect, useState } from 'react'
import type { ExtensionMessage } from '../../shared/messages'
import type { InstalledSkillsMap } from '../../shared/types'
import { onMessage } from '../lib/vscode-api'

/**
 * Hook that mirrors the latest installed skills snapshot pushed from the extension host.
 *
 * @returns Current installed skills map consumed by webview components.
 *
 * @example
 * ```tsx
 * const { installedSkills } = useInstalledState();
 * ```
 */
export function useInstalledState() {
  const [installedSkills, setInstalledSkills] = useState<InstalledSkillsMap>({})

  useEffect(() => {
    const dispose = onMessage((message: ExtensionMessage) => {
      if (message.type === 'reconcileState') {
        setInstalledSkills(message.payload.installedSkills)
      }
    })
    return dispose
  }, [])

  return { installedSkills }
}
