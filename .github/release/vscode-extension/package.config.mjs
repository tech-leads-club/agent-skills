import baseConfig from './shared.config.mjs'

const packageConfig = {
  ...baseConfig,
  git: {
    push: false,
  },
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
        pkgRoot: 'packages/vscode-extension',
      },
    ],
    [
      'semantic-release-vsce',
      {
        packageRoot: 'packages/vscode-extension',
        packageVsix: true,
        publish: false,
      },
    ],
    'semantic-release-stop-before-publish',
  ],
}

export default packageConfig
