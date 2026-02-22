import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('webview build pipeline', () => {
  it('keeps codicon styles in the webview entry bundle', () => {
    const mainEntryPath = join(process.cwd(), 'src/webview/main.tsx')
    const mainEntrySource = readFileSync(mainEntryPath, 'utf8')

    expect(mainEntrySource).toMatch(/import\s+['"]@vscode\/codicons\/dist\/codicon\.css['"]/)
  })

  it('keeps font assets resolvable in packaged webviews', () => {
    const viteConfigPath = join(process.cwd(), 'vite.config.ts')
    const viteConfigSource = readFileSync(viteConfigPath, 'utf8')

    expect(viteConfigSource).toMatch(/base:\s*['"]\.\//)
    expect(viteConfigSource).toMatch(/assetFileNames:\s*\(assetInfo\)\s*=>/)
    expect(viteConfigSource).toContain("return 'assets/[name]-[hash][extname]'")
  })
})
