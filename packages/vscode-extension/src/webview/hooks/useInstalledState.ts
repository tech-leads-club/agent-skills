import { useEffect, useState } from 'react'
import type { ReconcileStatePayload } from '../../shared/messages'
import type { InstalledSkillsMap } from '../../shared/types'

/**
 * Hook that mirrors the latest installed skills snapshot pushed from the extension host.
 *
 * @returns Current installed skills map consumed by webview components.
 */
export function useInstalledState() {
  const [installedSkills, setInstalledSkills] = useState<InstalledSkillsMap>({})

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data
      if (message.type === 'reconcileState') {
        const payload = message.payload as ReconcileStatePayload
        setInstalledSkills(payload.installedSkills)
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  return { installedSkills }
}
