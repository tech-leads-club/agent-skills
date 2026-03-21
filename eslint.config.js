import js from '@eslint/js'
import nxPlugin from '@nx/eslint-plugin'
import eslintConfigPrettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'
import jsoncParser from 'jsonc-eslint-parser'
import tseslint from 'typescript-eslint'

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['packages/ide-extension/scripts/**/*.mjs', 'packages/skills-catalog/skills/**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        URL: 'readonly',
        window: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  globalIgnores([
    'dist/**',
    '**/dist/**',
    'node_modules/**',
    '**/*.js',
    '**/*.d.ts',
    '.nx/**',
    '**/.*/**',
    '**/next.config.mjs',
    '**/postcss.config.cjs',
  ]),
  {
    name: 'tlc-typescript',
    files: ['**/*.ts'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
    rules: {
      'prefer-const': 'error',
      'no-var': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['packages/*/package.json'],
    plugins: { '@nx': nxPlugin },
    languageOptions: { parser: jsoncParser },
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredDependencies: [
            '@tech-leads-club/core',
            'react-dom', // Peer dependency of Next.js
            '@tailwindcss/postcss', // Used in postcss.config.cjs
            'tailwindcss', // Used in global.css via @import
            'github-markdown-css', // Used in global.css via @import
            'highlight.js', // Used in global.css via @import
            '@jest/globals', // Used in tests only
            '@testing-library/react', // Used in tests only
            'fast-check', // Used in tests only
            '@nx/next', // Used in Next.js apps
            // ide-extension: build/test deps in devDependencies
            'glob',
            'mocha',
            '@testing-library/jest-dom',
            'jest-axe',
            '@testing-library/user-event',
            'react',
            '@types/vscode',
            '@vscode/codicons',
            'fuse.js',
            '@vitejs/plugin-react',
            'vite',
            'esbuild', // ide-extension: build script only (devDependencies)
          ],
        },
      ],
    },
  },
])
