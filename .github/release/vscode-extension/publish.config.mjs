import baseConfig from './shared.config.mjs'

const publishConfig = {
  ...baseConfig,
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
        packageVsix: false,
        publishPackagePath: 'artifacts/vscode-extension.vsix',
        skipDuplicate: true,
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['packages/vscode-extension/package.json'],
        message: 'chore(release): publish vscode extension {{nextRelease.version}}',
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: [
          {
            path: 'artifacts/vscode-extension.vsix',
            label: 'VSIX package',
          },
        ],
      },
    ],
  ],
}

export default publishConfig
