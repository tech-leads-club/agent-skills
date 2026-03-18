import { build } from 'esbuild'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')
const isProduction = process.argv.includes('--production')

await build({
  absWorkingDir: projectRoot,
  entryPoints: [resolve(projectRoot, 'src/extension.ts')],
  bundle: true,
  format: 'esm',
  minify: isProduction,
  outfile: resolve(projectRoot, 'dist/extension.js'),
  platform: 'node',
  sourcemap: true,
  sourcesContent: false,
  target: 'node22',
  tsconfig: resolve(projectRoot, 'tsconfig.lib.json'),
  external: ['vscode'],
  logLevel: 'info',
})
