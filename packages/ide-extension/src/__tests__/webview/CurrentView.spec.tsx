import { render, screen } from '@testing-library/react'
import { Suspense } from 'react'
import type { ReactNode } from 'react'
import {
  AppStateContext,
  HostStateContext,
  useAppStateContext,
  useHostStateContext,
  useActionsContext,
} from '../../webview/contexts'
import type { AppStateContextValue, HostStateContextValue } from '../../webview/contexts'
import { ActionsProvider } from '../../webview/contexts'
import { CurrentView } from '../../webview/render-current-view'
import type { ActionState } from '../../shared/types'

jest.mock('../../webview/lib/vscode-api', () => ({
  postMessage: jest.fn(),
  onMessage: jest.fn(() => jest.fn()),
}))

jest.mock('../../services/selection-selectors', () => ({
  getCategoryOptions: jest.fn(() => []),
  getOutdatedSkills: jest.fn(() => []),
  getSelectableSkills: jest.fn(() => []),
  isSkillInstalledForScope: jest.fn(() => false),
}))

// These .ts hooks are ESM modules; mocking prevents the CJS/ESM boundary issue.
// HostStateProvider and AppStateProvider consume them, but tests use direct context stubs.
jest.mock('../../webview/hooks/useHostState', () => ({
  useHostState: jest.fn(),
}))

jest.mock('../../webview/hooks/useInstalledState', () => ({
  useInstalledState: jest.fn(() => ({ installedSkills: {} })),
}))

const idleActionState: ActionState = {
  status: 'idle',
  actionId: null,
  action: null,
  currentStep: null,
  errorMessage: null,
  request: null,
  results: [],
  logs: [],
  rejectionMessage: null,
}

function makeAppState(overrides: Partial<AppStateContextValue> = {}): AppStateContextValue {
  return {
    currentView: 'home',
    currentAction: null,
    selectedSkills: [],
    selectedAgents: [],
    activeScope: 'local',
    installMethod: 'copy',
    goToAgents: jest.fn(),
    goToAgentsView: jest.fn(),
    goToSkillsView: jest.fn(),
    goToInstallConfig: jest.fn(),
    goToRemoveConfirm: jest.fn(),
    goToStatus: jest.fn(),
    goToOutdatedSkills: jest.fn(),
    goHome: jest.fn(),
    toggleSkill: jest.fn(),
    toggleAgent: jest.fn(),
    selectAll: jest.fn(),
    clearSelection: jest.fn(),
    selectAllSkills: jest.fn(),
    clearSkillSelection: jest.fn(),
    selectAllAgents: jest.fn(),
    clearAgentSelection: jest.fn(),
    setScope: jest.fn(),
    setInstallMethod: jest.fn(),
    ...overrides,
  }
}

function makeHostState(overrides: Partial<HostStateContextValue> = {}): HostStateContextValue {
  return {
    registry: null,
    status: 'ready',
    errorMessage: null,
    fromCache: false,
    availableAgents: [],
    allAgents: [],
    isTrusted: true,
    policy: { allowedScopes: 'all', effectiveScopes: ['local', 'global'] },
    actionState: idleActionState,
    isBatchProcessing: false,
    batchResult: null,
    isRefreshingForUpdate: false,
    installedSkills: {},
    startRefreshForUpdate: jest.fn(),
    ...overrides,
  }
}

interface AllProvidersProps {
  appState?: Partial<AppStateContextValue>
  hostState?: Partial<HostStateContextValue>
  children: ReactNode
}

/**
 * Wraps children in all three context providers.
 * AppState and HostState use stub values; ActionsProvider uses the real provider
 * (which internally calls useAppStateContext and useHostStateContext from the stubs above).
 */
function AllProviders({ appState = {}, hostState = {}, children }: AllProvidersProps) {
  return (
    <AppStateContext.Provider value={makeAppState(appState)}>
      <HostStateContext.Provider value={makeHostState(hostState)}>
        <ActionsProvider>
          <Suspense fallback={<div>loading</div>}>{children}</Suspense>
        </ActionsProvider>
      </HostStateContext.Provider>
    </AppStateContext.Provider>
  )
}

function BadAppStateConsumer() {
  useAppStateContext()
  return null
}

function BadHostStateConsumer() {
  useHostStateContext()
  return null
}

function BadActionsConsumer() {
  useActionsContext()
  return null
}

describe('Context providers', () => {
  const originalConsoleError = console.error
  beforeEach(() => {
    console.error = jest.fn()
  })
  afterAll(() => {
    console.error = originalConsoleError
  })

  it('useAppStateContext throws when called outside AppStateContext.Provider', () => {
    expect(() => render(<BadAppStateConsumer />)).toThrow(
      'useAppStateContext must be used inside AppStateContext.Provider',
    )
  })

  it('useHostStateContext throws when called outside HostStateContext.Provider', () => {
    expect(() => render(<BadHostStateConsumer />)).toThrow(
      'useHostStateContext must be used inside HostStateContext.Provider',
    )
  })

  it('useActionsContext throws when called outside ActionsProvider', () => {
    expect(() => render(<BadActionsConsumer />)).toThrow('useActionsContext must be used within ActionsProvider')
  })
})

describe('CurrentView — context consumer wiring', () => {
  it('renders HomePage when currentView is home', async () => {
    render(
      <AllProviders appState={{ currentView: 'home' }}>
        <CurrentView />
      </AllProviders>,
    )

    expect(await screen.findByRole('region', { name: /home page/i })).toBeInTheDocument()
  })

  it('renders NoRegistryState when view is not home and registry is null', async () => {
    render(
      <AllProviders appState={{ currentView: 'selectSkills', currentAction: 'install' }} hostState={{ registry: null }}>
        <CurrentView />
      </AllProviders>,
    )

    expect(await screen.findByText(/registry/i)).toBeInTheDocument()
  })

  it('renders StatusPage when currentView is status and no current action', async () => {
    const runningActionState: ActionState = {
      ...idleActionState,
      status: 'running',
      action: 'install',
      currentStep: 'Installing accessibility...',
    }

    const stubRegistry = { version: '1', categories: {}, skills: [] }

    render(
      <AllProviders
        appState={{ currentView: 'status', currentAction: null }}
        hostState={{
          isBatchProcessing: true,
          actionState: runningActionState,
          registry: stubRegistry,
        }}
      >
        <CurrentView />
      </AllProviders>,
    )

    expect(await screen.findByRole('heading', { name: /operation in progress/i })).toBeInTheDocument()
  })

  it('calls goToAgents("install") when install button is clicked on HomePage', async () => {
    const goToAgents = jest.fn()

    render(
      <AllProviders
        appState={{ currentView: 'home', goToAgents }}
        hostState={{ policy: { allowedScopes: 'all', effectiveScopes: ['local', 'global'] } }}
      >
        <CurrentView />
      </AllProviders>,
    )

    const installBtn = await screen.findByRole('button', { name: /install add new capabilities/i })
    installBtn.click()

    expect(goToAgents).toHaveBeenCalledWith('install')
  })

  it('shows home page action buttons from context state', async () => {
    render(
      <AllProviders appState={{ currentView: 'home' }}>
        <CurrentView />
      </AllProviders>,
    )

    expect(await screen.findByRole('button', { name: /install add new capabilities/i })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /uninstall remove installed skills/i })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /^update/i })).toBeInTheDocument()
  })
})
