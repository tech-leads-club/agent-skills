/* global process, console */
import { mkdirSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')
const integrationTsconfig = resolve(projectRoot, 'tsconfig.integration.json')
const compiledTestEntry = resolve(projectRoot, 'dist/integration-test/activation.test.js')
const compiledPackageJson = resolve(projectRoot, 'dist/integration-test/package.json')

function runOrThrow(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: false,
    ...opts,
  })

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status)
  }

  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }
}

function commandExists(cmd) {
  const result = spawnSync('bash', ['-lc', `command -v ${cmd}`], {
    cwd: projectRoot,
    stdio: 'ignore',
    shell: false,
  })
  return result.status === 0
}

function runIntegration() {
  const isLinux = process.platform === 'linux'
  const hasXvfb = isLinux && commandExists('xvfb-run')
  const runner = hasXvfb ? 'xvfb-run' : 'node'
  const runnerArgs = hasXvfb ? ['-a', 'node', compiledTestEntry] : [compiledTestEntry]

  const result = spawnSync(runner, runnerArgs, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      EXTENSION_DEVELOPMENT_PATH: projectRoot,
    },
  })

  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }

  if (result.status === 0) {
    return
  }

  process.exit(typeof result.status === 'number' ? result.status : 1)
}

runOrThrow('npx', ['tsc', '-p', integrationTsconfig])
mkdirSync(resolve(projectRoot, 'dist/integration-test'), { recursive: true })
writeFileSync(compiledPackageJson, '{"type":"commonjs"}\n', 'utf8')
runIntegration()
