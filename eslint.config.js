import js from '@eslint/js'
import nxPlugin from '@nx/eslint-plugin'
import eslintConfigPrettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'
import jsoncParser from 'jsonc-eslint-parser'
import tseslint from 'typescript-eslint'

const nodeScriptGlobals = {
  Buffer: 'readonly',
  console: 'readonly',
  process: 'readonly',
  setTimeout: 'readonly',
}

const commonJsScriptGlobals = {
  ...nodeScriptGlobals,
  __dirname: 'readonly',
  module: 'readonly',
  require: 'readonly',
}

const browserEvalGlobals = {
  document: 'readonly',
  window: 'readonly',
}

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
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
    name: 'tlc-skill-node-mjs-scripts',
    files: ['packages/skills-catalog/skills/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...nodeScriptGlobals, ...browserEvalGlobals },
    },
  },
  {
    name: 'tlc-playwright-skill-cjs-scripts',
    files: ['packages/skills-catalog/skills/(web-automation)/playwright-skill/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...commonJsScriptGlobals, ...browserEvalGlobals },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
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
            '@nx/next', // Used in Next.js apps
            'prettier', // Root workspace formatting tool used by generation scripts
            'zod', // Runtime import in built CLI (from core lockfile); not a direct TS import in packages/cli
          ],
        },
      ],
    },
  },
])
