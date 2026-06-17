# Storage Patterns

Patterns for persisting data in React Native applications.

## Storage Decision Guide

| Storage      | Speed     | Async     | When to Use                                            |
| ------------ | --------- | --------- | ------------------------------------------------------ |
| MMKV         | Very fast | No (sync) | Default choice. Key-value data, settings, cached state |
| SecureStore  | Medium    | Yes       | Sensitive data: tokens, passwords, credentials         |
| AsyncStorage | Slow      | Yes       | Legacy apps. Migrate to MMKV when possible             |

## MMKV (Primary Storage)

MMKV is synchronous and significantly faster than AsyncStorage.

```tsx
import { MMKV } from 'react-native-mmkv'

const storage = new MMKV()

// Type-safe operations (synchronous)
storage.set('user.name', 'John')
const name = storage.getString('user.name')

storage.set('user.age', 25)
const age = storage.getNumber('user.age')

storage.set('user.premium', true)
const isPremium = storage.getBoolean('user.premium')

// JSON data
storage.set('user', JSON.stringify(user))
const user = JSON.parse(storage.getString('user') || '{}')

// Cleanup
storage.delete('user.name')
storage.clearAll()
```

### MMKV React Hooks

```tsx
import { useMMKVString, useMMKVNumber, useMMKVBoolean } from 'react-native-mmkv'

function Settings() {
  const [theme, setTheme] = useMMKVString('theme')
  const [fontSize, setFontSize] = useMMKVNumber('fontSize')
  const [notifications, setNotifications] = useMMKVBoolean('notifications')

  return (
    <>
      <Switch value={theme === 'dark'} onValueChange={(dark) => setTheme(dark ? 'dark' : 'light')} />
      <Slider value={fontSize} onValueChange={setFontSize} />
      <Switch value={notifications} onValueChange={setNotifications} />
    </>
  )
}
```

## Zustand with MMKV Persistence

```tsx
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { MMKV } from 'react-native-mmkv'

const storage = new MMKV()

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
}

interface SettingsStore {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}

const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
)
```

## Jotai with MMKV Persistence

Jotai's atomic model works naturally with MMKV for persistence:

```tsx
import { atom } from 'jotai'
import { atomWithStorage, createJSONStorage } from 'jotai/utils'
import { MMKV } from 'react-native-mmkv'

const storage = new MMKV()

const mmkvStorage = createJSONStorage<any>(() => ({
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
}))

// Persisted atoms
const themeAtom = atomWithStorage('theme', 'light', mmkvStorage)
const fontSizeAtom = atomWithStorage('fontSize', 16, mmkvStorage)

// Derived atom (recomputes automatically)
const isDarkModeAtom = atom((get) => get(themeAtom) === 'dark')
```

```tsx
import { useAtom, useAtomValue } from 'jotai'

function Settings() {
  const [theme, setTheme] = useAtom(themeAtom)
  const isDark = useAtomValue(isDarkModeAtom)

  return <Switch value={isDark} onValueChange={(dark) => setTheme(dark ? 'dark' : 'light')} />
}
```

## SecureStore (Sensitive Data)

Use `expo-secure-store` for tokens, passwords, and credentials. Data is encrypted using the device keychain/keystore.

```tsx
import * as SecureStore from 'expo-secure-store'

// Store sensitive data
await SecureStore.setItemAsync('auth_token', token)

// Retrieve
const token = await SecureStore.getItemAsync('auth_token')

// Delete
await SecureStore.deleteItemAsync('auth_token')
```

### Auth Token Hook

```tsx
import { useState, useEffect, useCallback } from 'react'
import * as SecureStore from 'expo-secure-store'

function useAuthToken() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    SecureStore.getItemAsync('auth_token')
      .then(setToken)
      .finally(() => setLoading(false))
  }, [])

  const saveToken = useCallback(async (newToken: string) => {
    await SecureStore.setItemAsync('auth_token', newToken)
    setToken(newToken)
  }, [])

  const clearToken = useCallback(async () => {
    await SecureStore.deleteItemAsync('auth_token')
    setToken(null)
  }, [])

  return { token, loading, saveToken, clearToken }
}
```

## TanStack Query with Persistence

```tsx
import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { MMKV } from 'react-native-mmkv'

const storage = new MMKV({ id: 'query-cache' })

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})

const persister = createSyncStoragePersister({
  storage: {
    getItem: (key: string) => storage.getString(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  },
})

function App() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <Navigation />
    </PersistQueryClientProvider>
  )
}
```

## Quick Reference

| Hook/API                     | Returns                   | Storage           |
| ---------------------------- | ------------------------- | ----------------- |
| `useMMKVString()`            | `[value, setValue]`       | MMKV              |
| `useMMKVNumber()`            | `[value, setValue]`       | MMKV              |
| `useMMKVBoolean()`           | `[value, setValue]`       | MMKV              |
| `SecureStore.getItemAsync()` | `Promise<string \| null>` | Keychain/Keystore |
| `atomWithStorage()`          | Jotai atom                | Configurable      |
| `zustand/persist`            | Zustand middleware        | Configurable      |
