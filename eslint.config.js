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

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },

    rules: {
      // JavaScript best practices
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'object-shorthand': ['error', 'always'],

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/no-explicit-any': 'error',

      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
        },
      ],

      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
        },
      ],
    },
  },

  {
    files: ['packages/*/package.json'],

    plugins: {
      '@nx': nxPlugin,
    },

    languageOptions: {
      parser: jsoncParser,
    },

    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredDependencies: [
            '@tech-leads-club/core',

            // Peer dependency of Next.js
            'react-dom',

            // Used in postcss.config.cjs
            '@tailwindcss/postcss',

            // Used in global.css via @import
            'tailwindcss',
            'github-markdown-css',
            'highlight.js',

            // Used in tests only
            '@jest/globals',
            '@testing-library/react',
            'fast-check',

            // Used in Next.js apps
            '@nx/next',

            // Runtime import in built CLI
            'zod',
          ],
        },
      ],
    },
  },
])
