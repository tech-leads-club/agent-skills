# Project Structure

## Expo Router Project Layout

```
my-app/
├── app/                      # File-based routing (Expo Router)
│   ├── _layout.tsx           # Root layout
│   ├── index.tsx             # Home screen
│   ├── +not-found.tsx        # 404 screen
│   ├── (tabs)/               # Tab navigator group
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── search.tsx
│   │   └── profile.tsx
│   ├── (auth)/               # Auth screens (no tabs)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── [id].tsx              # Dynamic route
├── components/
│   ├── ui/                   # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   └── features/             # Feature-specific components
│       ├── ProductCard.tsx
│       └── UserAvatar.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useStorage.ts
│   └── useApi.ts
├── services/
│   ├── api.ts                # API client (axios/ky)
│   └── auth.ts               # Auth service
├── stores/
│   ├── useUserStore.ts       # Zustand stores
│   └── atoms/                # Jotai atoms (if using Jotai)
│       └── userAtoms.ts
├── constants/
│   ├── colors.ts
│   └── layout.ts
├── types/
│   └── index.ts
├── utils/
│   └── helpers.ts
├── assets/
│   ├── images/
│   └── fonts/
├── app.json
└── tsconfig.json
```

## app.json Configuration

```json
{
  "expo": {
    "name": "My App",
    "slug": "my-app",
    "version": "1.0.0",
    "scheme": "myapp",
    "orientation": "portrait",
    "newArchEnabled": true,
    "icon": "./assets/images/icon.png",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.company.myapp"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.company.myapp"
    },
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://myapp.com",
          "asyncRoutes": {
            "web": true,
            "default": "development"
          }
        }
      ],
      [
        "expo-font",
        {
          "fonts": ["./assets/fonts/Inter-Regular.otf", "./assets/fonts/Inter-Bold.otf"]
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    }
  }
}
```

## tsconfig.json

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

**Note:** With Expo SDK 53+, `babel.config.js` is no longer needed for most setups. Metro handles module resolution and the Reanimated plugin is configured via `app.json`.

## Essential Dependencies

```json
{
  "dependencies": {
    "expo": "~53.0.0",
    "expo-router": "~4.0.0",
    "expo-image": "~2.0.0",
    "expo-font": "~13.0.0",
    "react": "19.0.0",
    "react-native": "0.79.0",
    "react-native-safe-area-context": "~5.0.0",
    "react-native-screens": "~4.5.0",
    "@react-navigation/native": "^7.0.0",
    "react-native-reanimated": "~4.0.0",
    "react-native-gesture-handler": "~2.20.0",
    "@legendapp/list": "~2.0.0",
    "zustand": "^5.0.0",
    "jotai": "^2.10.0",
    "@tanstack/react-query": "^5.60.0",
    "react-native-mmkv": "^3.0.0",
    "zeego": "^2.0.0",
    "react-native-bottom-tabs": "~0.5.0"
  },
  "devDependencies": {
    "@types/react": "~19.0.0",
    "typescript": "^5.5.0"
  }
}
```

**State management note:** Both Zustand and Jotai are excellent choices. Zustand is better when you need a single store with persistence (Zustand persist + MMKV). Jotai shines when you need fine-grained atomic state with derived atoms — its atomic model naturally prevents unnecessary re-renders in list items.

## Quick Reference

| Directory              | Purpose                              |
| ---------------------- | ------------------------------------ |
| `app/`                 | File-based routes (Expo Router)      |
| `components/ui/`       | Reusable, generic UI components      |
| `components/features/` | Feature-specific components          |
| `hooks/`               | Custom React hooks                   |
| `services/`            | API clients, auth, external services |
| `stores/`              | Zustand stores or Jotai atoms        |
| `constants/`           | App-wide constants (colors, layout)  |
| `types/`               | TypeScript type definitions          |
| `utils/`               | Pure utility functions               |
| `assets/`              | Images, fonts, static files          |
