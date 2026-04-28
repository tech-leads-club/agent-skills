# Performance Rules

Comprehensive performance rules for React Native applications, prioritized by impact. Each rule includes incorrect and correct code examples.

**React Compiler note:** When using React Compiler (React 19+), manual `memo()`, `useCallback()`, and `useMemo()` are handled automatically. However, object reference stability still matters for virtualized lists.

---

## Table of Contents

1. [Core Rendering (CRITICAL)](#1-core-rendering)
2. [List Performance (HIGH)](#2-list-performance)
3. [Animation (HIGH)](#3-animation)
4. [Scroll Performance (HIGH)](#4-scroll-performance)
5. [Navigation (HIGH)](#5-navigation)
6. [React State (MEDIUM)](#6-react-state)
7. [State Architecture (MEDIUM)](#7-state-architecture)
8. [React Compiler (MEDIUM)](#8-react-compiler)
9. [User Interface (MEDIUM)](#9-user-interface)
10. [Design System (MEDIUM)](#10-design-system)
11. [Monorepo (LOW)](#11-monorepo)
12. [Configuration (LOW)](#12-configuration)

---

## 1. Core Rendering

**Impact: CRITICAL — violations cause runtime crashes.**

### 1.1 Never Use && with Potentially Falsy Values

React Native crashes if `0` or `""` is rendered outside `<Text>`.

```tsx
// CRASH: if count is 0
{
  count && <Text>{count} items</Text>
}

// SAFE: ternary
{
  count ? <Text>{count} items</Text> : null
}

// SAFE: boolean coercion
{
  !!count && <Text>{count} items</Text>
}

// BEST: early return
if (!name) return null
```

**Lint:** Enable `react/jsx-no-leaked-render` from eslint-plugin-react.

### 1.2 Wrap Strings in Text Components

Strings must be inside `<Text>`. Direct children of `<View>` crash.

```tsx
// CRASH
<View>Hello, {name}!</View>

// CORRECT
<View><Text>Hello, {name}!</Text></View>
```

---

## 2. List Performance

**Impact: HIGH — affects scroll smoothness and memory.**

### 2.1 Always Use a Virtualizer

Use LegendList (preferred) or FlashList. Never use ScrollView with `.map()`.

```tsx
// WRONG: renders all items upfront
;<ScrollView>
  {items.map((item) => (
    <ItemCard key={item.id} item={item} />
  ))}
</ScrollView>

// CORRECT: only renders visible items
import { LegendList } from '@legendapp/list'

;<LegendList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  keyExtractor={(item) => item.id}
  estimatedItemSize={80}
/>
```

### 2.2 Keep List Items Lightweight

No queries, no expensive computations, no Context access inside list items. Pass pre-computed primitives.

```tsx
// WRONG: heavy list item
function ProductRow({ id }: { id: string }) {
  const { data } = useQuery(['product', id], () => fetchProduct(id))
  const theme = useContext(ThemeContext)
  return <View>{/* ... */}</View>
}

// CORRECT: lightweight, receives primitives
function ProductRow({ name, price, imageUrl }: Props) {
  return (
    <View>
      <Image source={{ uri: imageUrl }} />
      <Text>{name}</Text>
      <Text>{price}</Text>
    </View>
  )
}
```

Use Zustand selectors instead of Context when you need shared state in list items:

```tsx
// Zustand selector: only re-renders when this specific value changes
const inCart = useCartStore((s) => s.items.has(id))
```

### 2.3 Avoid Inline Objects in renderItem

Inline objects create new references on every render, breaking memoization. Pass the item directly or pass primitives.

```tsx
// WRONG: new object every render
<UserRow user={{ id: item.id, name: item.name }} />
<UserRow style={{ backgroundColor: item.isActive ? 'green' : 'gray' }} />

// CORRECT: pass item directly or primitives
<UserRow user={item} />
<UserRow id={item.id} name={item.name} isActive={item.isActive} />
```

### 2.4 Maintain Stable Object References

Don't `.map()` or `.filter()` data before passing to virtualized lists. Transform inside items using Zustand selectors.

```tsx
// WRONG: creates new references on every keystroke
const domains = tlds.map(tld => ({
  domain: `${keyword}.${tld.name}`,
  tld: tld.name,
}))
<LegendList data={domains} ... />

// CORRECT: pass stable data, transform inside item
<LegendList data={tlds} renderItem={({ item }) => <DomainItem tld={item} />} />

function DomainItem({ tld }: { tld: Tld }) {
  const domain = useKeywordStore(s => s.keyword + '.' + tld.name)
  return <Text>{domain}</Text>
}
```

### 2.5 Pass Primitives for Memoization

Primitive props (strings, numbers, booleans) enable shallow comparison in `memo()`.

```tsx
// LESS OPTIMAL: object prop requires reference comparison
<UserRow user={item} />

// OPTIMAL: primitive props enable shallow comparison
<UserRow id={item.id} name={item.name} email={item.email} />
```

### 2.6 Hoist Callbacks to List Root

Create a single callback instance at the list root. Items call it with an identifier.

```tsx
// WRONG: new callback per render
renderItem={({ item }) => {
  const onPress = () => handlePress(item.id)
  return <Item item={item} onPress={onPress} />
}}

// CORRECT: pass ID, handle in child
<Item id={item.id} name={item.name} />

const Item = memo(function Item({ id, name }: Props) {
  const handlePress = useCallback(() => { /* use id */ }, [id])
  return <Pressable onPress={handlePress}><Text>{name}</Text></Pressable>
})
```

### 2.7 Use Item Types for Heterogeneous Lists

Use `getItemType` for lists with different item layouts to enable efficient recycling.

```tsx
type FeedItem =
  | { id: string; type: 'header'; title: string }
  | { id: string; type: 'message'; text: string }
  | { id: string; type: 'image'; url: string }

;<LegendList
  data={items}
  getItemType={(item) => item.type}
  getEstimatedItemSize={(_, __, itemType) => {
    switch (itemType) {
      case 'header':
        return 48
      case 'message':
        return 72
      case 'image':
        return 300
      default:
        return 72
    }
  }}
  renderItem={({ item }) => {
    switch (item.type) {
      case 'header':
        return <SectionHeader title={item.title} />
      case 'message':
        return <MessageRow text={item.text} />
      case 'image':
        return <ImageRow url={item.url} />
    }
  }}
  recycleItems
/>
```

### 2.8 Use Compressed Images in Lists

Request appropriately-sized images. Use 2x display size for retina.

```tsx
// WRONG: 4000x3000 image for a 100x100 thumbnail
<Image source={{ uri: product.imageUrl }} style={{ width: 100, height: 100 }} />

// CORRECT: request 200x200 (2x retina)
const thumbnailUrl = `${product.imageUrl}?w=200&h=200&fit=cover`
<Image source={{ uri: thumbnailUrl }} contentFit="cover" style={{ width: 100, height: 100 }} />
```

---

## 3. Animation

**Impact: HIGH — affects frame rate and smoothness.**

### 3.1 Animate Transform and Opacity Only

Never animate layout properties (`width`, `height`, `top`, `left`, `margin`, `padding`). They trigger layout recalculation on every frame.

```tsx
// WRONG: animates height
useAnimatedStyle(() => ({
  height: withTiming(expanded ? 200 : 0),
}))

// CORRECT: animates transform (GPU-accelerated)
useAnimatedStyle(() => ({
  transform: [{ scaleY: withTiming(expanded ? 1 : 0) }],
  opacity: withTiming(expanded ? 1 : 0),
}))
```

### 3.2 Use useDerivedValue for Computed Animations

Use `useDerivedValue` for deriving one shared value from another. Reserve `useAnimatedReaction` for side effects only.

```tsx
// WRONG: useAnimatedReaction for derivation
useAnimatedReaction(
  () => progress.get(),
  (current) => {
    opacity.set(1 - current)
  },
)

// CORRECT: useDerivedValue
const opacity = useDerivedValue(() => 1 - progress.get())
```

### 3.3 Use GestureDetector for Animated Press States

GestureDetector callbacks run on the UI thread. Pressable callbacks run on the JS thread.

```tsx
// CORRECT: UI thread press animation
const pressed = useSharedValue(0)

const tap = Gesture.Tap()
  .onBegin(() => pressed.set(withTiming(1)))
  .onFinalize(() => pressed.set(withTiming(0)))
  .onEnd(() => runOnJS(onPress)())

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: interpolate(pressed.get(), [0, 1], [1, 0.95]) }],
}))

<GestureDetector gesture={tap}>
  <Animated.View style={animatedStyle}>{children}</Animated.View>
</GestureDetector>
```

---

## 4. Scroll Performance

**Impact: HIGH — prevents render thrashing.**

### 4.1 Never Track Scroll Position in useState

Use Reanimated shared value or a ref instead.

```tsx
// WRONG: re-renders on every frame
const [scrollY, setScrollY] = useState(0)
const onScroll = e => setScrollY(e.nativeEvent.contentOffset.y)

// CORRECT: Reanimated (for animations)
const scrollY = useSharedValue(0)
const onScroll = useAnimatedScrollHandler({
  onScroll: e => { scrollY.value = e.contentOffset.y },
})
<Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} />

// CORRECT: ref (for non-reactive tracking)
const scrollY = useRef(0)
const onScroll = e => { scrollY.current = e.nativeEvent.contentOffset.y }
```

---

## 5. Navigation

**Impact: HIGH — affects transitions, gestures, and platform feel.**

### 5.1 Use Native Navigators

- **Stacks:** `@react-navigation/native-stack` or Expo Router `<Stack>` (native by default)
- **Tabs:** `react-native-bottom-tabs` or Expo Router `<NativeTabs>`
- **Never:** `@react-navigation/stack` (JS-based) or `@react-navigation/bottom-tabs`

### 5.2 Use Native Headers

Prefer native header options over custom header components—they support iOS large titles, search bars, blur effects, and proper safe area handling.

```tsx
// WRONG: custom header
options={{ header: () => <CustomHeader title="Profile" /> }}

// CORRECT: native header
options={{
  title: 'Profile',
  headerLargeTitleEnabled: true,
  headerSearchBarOptions: { placeholder: 'Search' },
}}
```

---

## 6. React State

**Impact: MEDIUM — prevents stale closures and unnecessary re-renders.**

### 6.1 Minimize State, Derive Values

```tsx
// WRONG: redundant state
const [total, setTotal] = useState(0)
useEffect(() => setTotal(items.reduce((s, i) => s + i.price, 0)), [items])

// CORRECT: derived during render
const total = items.reduce((s, i) => s + i.price, 0)
```

### 6.2 Use Fallback Pattern for Reactive Defaults

```tsx
// WRONG: loses reactivity when defaultEnabled changes
const [enabled, setEnabled] = useState(defaultEnabled)

// CORRECT: undefined = user hasn't chosen yet
const [_enabled, setEnabled] = useState<boolean | undefined>(undefined)
const enabled = _enabled ?? defaultEnabled
```

### 6.3 Use Dispatch Updaters

When next state depends on current state:

```tsx
// WRONG: may be stale
setCount(count + 1)

// CORRECT: always latest value
setCount((prev) => prev + 1)
```

---

## 7. State Architecture

**Impact: MEDIUM — single source of truth.**

### 7.1 State Must Represent Ground Truth

Store the state (`pressed`, `isOpen`), derive the visual (`scale`, `opacity`):

```tsx
// WRONG: storing visual output
const scale = useSharedValue(1)
tap.onBegin(() => scale.set(withTiming(0.95)))

// CORRECT: storing state, deriving visual
const pressed = useSharedValue(0)
tap.onBegin(() => pressed.set(withTiming(1)))

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: interpolate(pressed.get(), [0, 1], [1, 0.95]) }],
}))
```

---

## 8. React Compiler

**Impact: MEDIUM — compatibility patterns.**

### 8.1 Destructure Functions Early

Destructured functions are stable references. Dotting into objects creates new references.

```tsx
// WRONG: unstable references
const router = useRouter()
const handlePress = () => {
  props.onSave()
  router.push('/success')
}

// CORRECT: stable references
const { push } = useRouter()
const { onSave } = props
const handlePress = () => {
  onSave()
  push('/success')
}
```

### 8.2 Use .get() and .set() for Shared Values

Required for React Compiler compatibility:

```tsx
// WRONG: opts out of compiler
count.value = count.value + 1

// CORRECT: compiler compatible
count.set(count.get() + 1)
```

---

## 9. User Interface

**Impact: MEDIUM — native look and feel.**

### 9.1 Modern Styling Patterns

```tsx
// Use gap for spacing between children (not margin)
<View style={{ gap: 8 }}><Text>A</Text><Text>B</Text></View>

// Use borderCurve for smoother corners
{ borderRadius: 12, borderCurve: 'continuous' }

// Use CSS boxShadow (not legacy shadow objects or elevation)
{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }

// Use native gradients (not third-party libraries)
{ experimental_backgroundImage: 'linear-gradient(to bottom, #000, #fff)' }
```

### 9.2 Use expo-image

Always use `expo-image` instead of React Native's `Image`:

```tsx
import { Image } from 'expo-image'

;<Image
  source={{ uri: url }}
  placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
/>
```

### 9.3 Use Pressable (Never Touchable)

```tsx
// WRONG
import { TouchableOpacity } from 'react-native'

// CORRECT
import { Pressable } from 'react-native'
// or for lists:
import { Pressable } from 'react-native-gesture-handler'
```

### 9.4 Use Native Modals

```tsx
// WRONG: JS bottom sheet library
<BottomSheet ref={sheetRef} snapPoints={['50%', '90%']}>

// CORRECT: native Modal
<Modal presentationStyle="formSheet" animationType="slide"
  onRequestClose={() => setVisible(false)}>

// CORRECT: React Navigation v7 form sheet
<Stack.Screen name="Details" options={{
  presentation: 'formSheet',
  sheetAllowedDetents: 'fitToContents',
}} />
```

### 9.5 Use Native Menus (zeego)

```tsx
import * as DropdownMenu from 'zeego/dropdown-menu'

;<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    <Pressable>
      <Text>Options</Text>
    </Pressable>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item key="edit" onSelect={() => console.log('edit')}>
      <DropdownMenu.ItemTitle>Edit</DropdownMenu.ItemTitle>
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
```

### 9.6 Safe Areas

Use `contentInsetAdjustmentBehavior="automatic"` on ScrollViews instead of wrapping in SafeAreaView:

```tsx
// CORRECT
<ScrollView contentInsetAdjustmentBehavior="automatic">{children}</ScrollView>
```

### 9.7 Measuring Views

Use `useLayoutEffect` with `getBoundingClientRect()` for synchronous measurement, plus `onLayout` for updates:

```tsx
const ref = useRef<View>(null)
const [size, setSize] = useState<Size | undefined>(undefined)

useLayoutEffect(() => {
  const rect = ref.current?.getBoundingClientRect()
  if (rect) setSize({ width: rect.width, height: rect.height })
}, [])

const onLayout = (e: LayoutChangeEvent) => {
  const { width, height } = e.nativeEvent.layout
  setSize((prev) => {
    if (prev?.width === width && prev?.height === height) return prev
    return { width, height }
  })
}
```

### 9.8 Use Galeria for Image Galleries

```tsx
import { Galeria } from '@nandorojo/galeria'
import { Image } from 'expo-image'

;<Galeria urls={urls}>
  {urls.map((url, index) => (
    <Galeria.Image index={index} key={url}>
      <Image source={{ uri: url }} style={styles.thumbnail} />
    </Galeria.Image>
  ))}
</Galeria>
```

### 9.9 Use contentInset for Dynamic Spacing

```tsx
// WRONG: padding triggers layout recalculation
<ScrollView contentContainerStyle={{ paddingBottom: offset }}>

// CORRECT: contentInset adjusts scroll bounds only
<ScrollView
  contentInset={{ bottom: offset }}
  scrollIndicatorInsets={{ bottom: offset }}
>
```

---

## 10. Design System

**Impact: MEDIUM — maintainable component architecture.**

### 10.1 Use Compound Components

```tsx
// WRONG: polymorphic children
<Button icon={<Icon />}>Save</Button>

// CORRECT: compound components
<Button>
  <ButtonIcon><SaveIcon /></ButtonIcon>
  <ButtonText>Save</ButtonText>
</Button>
```

### 10.2 Import from Design System Folder

Re-export dependencies from a design system folder for easy refactoring:

```tsx
// WRONG: direct import
import { View, Text } from 'react-native'

// CORRECT: design system wrapper
import { View } from '@/components/view'
import { Text } from '@/components/text'
```

---

## 11. Monorepo

**Impact: LOW — but critical when applicable.**

### 11.1 Native Dependencies in App Directory

Autolinking only scans the app's `node_modules`. Native deps must be listed in the app's `package.json`, even if a shared package also uses them.

### 11.2 Single Dependency Versions

Use exact versions (`3.16.1` not `^3.0.0`) across all packages. Use syncpack or pnpm overrides to enforce.

---

## 12. Configuration

**Impact: LOW — incremental improvements.**

### 12.1 Load Fonts at Build Time

Use `expo-font` config plugin instead of `useFonts`/`Font.loadAsync`. Fonts are available immediately at launch.

### 12.2 Hoist Intl Formatters

```tsx
// WRONG: new formatter every render
function Price({ amount }: { amount: number }) {
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
  return <Text>{fmt.format(amount)}</Text>
}

// CORRECT: module-level
const currencyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
function Price({ amount }: { amount: number }) {
  return <Text>{currencyFmt.format(amount)}</Text>
}
```

---

## References

1. [React Native](https://reactnative.dev)
2. [Expo](https://docs.expo.dev)
3. [Reanimated](https://docs.swmansion.com/react-native-reanimated)
4. [Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler)
5. [LegendList](https://legendapp.com/open-source/legend-list)
6. [Galeria](https://github.com/nandorojo/galeria)
7. [Zeego](https://zeego.dev)
8. [React Compiler](https://react.dev/learn/react-compiler)
