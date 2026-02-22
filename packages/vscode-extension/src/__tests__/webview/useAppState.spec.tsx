import { act, renderHook } from '@testing-library/react'
import { useAppState } from '../../webview/hooks/useAppState'

describe('useAppState', () => {
  it('returns initial navigation and selection state', () => {
    const { result } = renderHook(() => useAppState())

    expect(result.current.currentView).toBe('home')
    expect(result.current.currentAction).toBeNull()
    expect(result.current.selectedSkills).toEqual([])
    expect(result.current.selectedAgents).toEqual([])
    expect(result.current.activeScope).toBe('local')
  })

  it('goToSkills sets action and route', () => {
    const { result } = renderHook(() => useAppState())

    act(() => {
      result.current.goToSkills('install')
    })

    expect(result.current.currentView).toBe('selectSkills')
    expect(result.current.currentAction).toBe('install')
  })

  it('goToAgents preserves selected skills', () => {
    const { result } = renderHook(() => useAppState())

    act(() => {
      result.current.goToSkills('install')
      result.current.toggleSkill('docs-writer')
      result.current.goToAgents()
    })

    expect(result.current.currentView).toBe('selectAgents')
    expect(result.current.selectedSkills).toEqual(['docs-writer'])
  })

  it('goHome resets view, action, and all selections', () => {
    const { result } = renderHook(() => useAppState())

    act(() => {
      result.current.goToSkills('uninstall')
      result.current.toggleSkill('docs-writer')
      result.current.toggleAgent('cursor')
      result.current.goHome()
    })

    expect(result.current.currentView).toBe('home')
    expect(result.current.currentAction).toBeNull()
    expect(result.current.selectedSkills).toEqual([])
    expect(result.current.selectedAgents).toEqual([])
  })

  it('toggles skill and agent selections', () => {
    const { result } = renderHook(() => useAppState())

    act(() => {
      result.current.toggleSkill('docs-writer')
      result.current.toggleAgent('cursor')
    })

    expect(result.current.selectedSkills).toEqual(['docs-writer'])
    expect(result.current.selectedAgents).toEqual(['cursor'])

    act(() => {
      result.current.toggleSkill('docs-writer')
      result.current.toggleAgent('cursor')
    })

    expect(result.current.selectedSkills).toEqual([])
    expect(result.current.selectedAgents).toEqual([])
  })

  it('selectAll and clearSelection update each target independently', () => {
    const { result } = renderHook(() => useAppState())

    act(() => {
      result.current.selectAll('skills', ['docs-writer', 'seo', 'docs-writer'])
      result.current.selectAll('agents', ['cursor', 'claude-code'])
    })

    expect(result.current.selectedSkills).toEqual(['docs-writer', 'seo'])
    expect(result.current.selectedAgents).toEqual(['cursor', 'claude-code'])

    act(() => {
      result.current.clearSelection('skills')
    })
    expect(result.current.selectedSkills).toEqual([])
    expect(result.current.selectedAgents).toEqual(['cursor', 'claude-code'])

    act(() => {
      result.current.clearSelection('agents')
    })
    expect(result.current.selectedAgents).toEqual([])
  })

  it('supports scope updates', () => {
    const { result } = renderHook(() => useAppState())

    act(() => {
      result.current.setScope('global')
    })

    expect(result.current.activeScope).toBe('global')
  })
})
