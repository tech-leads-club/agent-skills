import { runTests } from '@vscode/test-electron'
import * as path from 'path'

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = process.env.EXTENSION_DEVELOPMENT_PATH ?? path.resolve(__dirname, '../..')

    // The path to the test runner
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './suite/index.js')

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: ['--disable-extensions', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    })
  } catch (err) {
    if (
      !process.env.CI &&
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code?: unknown }).code === 127
    ) {
      console.warn(
        'Skipping integration tests locally: missing Linux system libraries for VS Code test runtime. ' +
          'Install dependencies (for example libnspr4/libgtk-3) or run in CI.',
      )
      process.exit(0)
    }
    console.error('Failed to run tests', err)
    process.exit(1)
  }
}

main()
