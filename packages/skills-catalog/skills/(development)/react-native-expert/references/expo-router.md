# Expo Router

Patterns for Expo Router 4+ (SDK 53+) with file-based routing, native navigators, and typed routes.

## Project Structure

```
app/
├── _layout.tsx           # Root layout (Stack)
├── index.tsx             # Home (/)
├── +not-found.tsx        # 404 page
├── (tabs)/               # Tab group
│   ├── _layout.tsx       # Tab bar config (NativeTabs)
│   ├── index.tsx         # First tab
│   └── profile.tsx       # Profile tab
├── (auth)/               # Auth group (no tabs)
│   ├── _layout.tsx
│   ├── login.tsx
│   └── register.tsx
├── settings/
│   ├── _layout.tsx       # Nested stack
│   ├── index.tsx         # Settings main
│   └── notifications.tsx
└── details/[id].tsx      # Dynamic route
```

## Root Layout

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router'
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native'
import { useColorScheme } from 'react-native'

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="details/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  )
}
```

## Native Tabs (SDK 53+)

```tsx
// app/(tabs)/_layout.tsx
import { NativeTabs, Label } from 'expo-router/unstable-native-tabs'

export default function TabLayout() {
  return (
    <NativeTabs minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <NativeTabs.Trigger.Icon sf="person.fill" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
```

On iOS, native tabs automatically enable `contentInsetAdjustmentBehavior` on the first ScrollView at the root of each tab screen.

## JS Tabs (Fallback)

If you need more customization than NativeTabs provides:

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#007AFF' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
```

## Navigation

```tsx
import { router, useLocalSearchParams, Link } from 'expo-router'

// Programmatic
router.push('/details/123')
router.replace('/home')
router.back()
router.canGoBack()
router.dismissAll()

// With params
router.push({
  pathname: '/details/[id]',
  params: { id: '123', title: 'Item' },
})

// Link component (with prefetch for faster navigation)
<Link href="/profile" prefetch asChild>
  <Pressable>
    <Text>Go to Profile</Text>
  </Pressable>
</Link>

// Reading params
function DetailsScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>()
  return <Text>Details for {id}</Text>
}
```

## Protected Routes

```tsx
// app/(auth)/_layout.tsx
import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'

export default function AuthLayout() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <LoadingScreen />
  if (user) return <Redirect href="/(tabs)" />

  return <Stack screenOptions={{ headerShown: false }} />
}

// app/(tabs)/_layout.tsx
export default function TabLayout() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <LoadingScreen />
  if (!user) return <Redirect href="/(auth)/login" />

  return <NativeTabs>...</NativeTabs>
}
```

## Native Form Sheets

```tsx
// app/_layout.tsx
<Stack.Screen
  name="details/[id]"
  options={{
    presentation: 'formSheet',
    sheetAllowedDetents: 'fitToContents',
  }}
/>
```

## Deep Linking

```json
// app.json
{
  "expo": {
    "scheme": "myapp",
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://acme.com",
          "asyncRoutes": {
            "web": true,
            "default": "development"
          }
        }
      ]
    ]
  }
}
```

Dynamic routes handle deep links automatically: `myapp://details/123` → `app/details/[id].tsx`

## Async Routes (Bundle Splitting)

Enable async routes for production bundle splitting:

```json
// app.json
{
  "expo": {
    "plugins": [
      [
        "expo-router",
        {
          "asyncRoutes": {
            "web": true,
            "default": "development"
          }
        }
      ]
    ]
  }
}
```

## Quick Reference

| Component      | Purpose                        |
| -------------- | ------------------------------ |
| `<Stack>`      | Native stack navigator         |
| `<Tabs>`       | JS tab navigator               |
| `<NativeTabs>` | Native tab navigator (SDK 53+) |
| `<Drawer>`     | Drawer navigator               |
| `<Link>`       | Declarative navigation         |
| `<Redirect>`   | Route redirect                 |

| router method  | Behavior             |
| -------------- | -------------------- |
| `push()`       | Add to stack         |
| `replace()`    | Replace current      |
| `back()`       | Go back              |
| `dismissAll()` | Dismiss all modals   |
| `canGoBack()`  | Check if can go back |
