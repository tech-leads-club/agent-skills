import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { ExtensionMessage } from '../shared/messages'
import './index.css'
import { onMessage, postMessage } from './lib/vscode-api'

function App() {
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    // Listen for messages from Extension Host
    const dispose = onMessage((msg: ExtensionMessage) => {
      switch (msg.type) {
        case 'initialize':
          setVersion(msg.payload.version)
          break
      }
    })

    // Signal readiness to Extension Host
    postMessage({ type: 'webviewDidMount' })

    return dispose
  }, [])

  return (
    <div className="app">
      <h1>Agent Skills</h1>
      {version ? (
        <p className="status connected">v{version} — Connected</p>
      ) : (
        <p className="status connecting">Connecting...</p>
      )}
    </div>
  )
}

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
