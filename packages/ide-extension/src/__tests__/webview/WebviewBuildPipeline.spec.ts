import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const testDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testDirectory, '../../..')

describe('webview build pipeline', () => {
  it('keeps codicon styles in the webview entry bundle', () => {
    const mainEntryPath = resolve(projectRoot, 'src/webview/main.tsx')
    const mainEntrySource = readFileSync(mainEntryPath, 'utf8')

    expect(mainEntrySource).toMatch(/import\s+['"]@vscode\/codicons\/dist\/codicon\.css['"]/)
  })

  it('keeps font assets resolvable in packaged webviews', () => {
    const viteConfigPath = resolve(projectRoot, 'vite.config.ts')
    const viteConfigSource = readFileSync(viteConfigPath, 'utf8')

    expect(viteConfigSource).toMatch(/base:\s*['"]\.\//)
    expect(viteConfigSource).toMatch(/assetFileNames:\s*\(assetInfo\)\s*=>/)
    expect(viteConfigSource).toContain("return 'assets/[name]-[hash][extname]'")
  })
})
