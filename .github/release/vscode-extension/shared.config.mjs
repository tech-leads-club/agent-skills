const baseConfig = {
  repositoryUrl: 'https://github.com/tech-leads-club/agent-skills',
  branches: [
    {
      name: 'main',
      channel: 'latest',
    },
  ],
  tagFormat: 'vscode-extension-v${version}',
}

export default baseConfig
