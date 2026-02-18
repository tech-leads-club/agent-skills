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
  globalIgnores([
    'dist/**',
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
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
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
          ],
        },
      ],
    },
  },
])
