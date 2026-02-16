import * as assert from 'assert'
import * as path from 'path'
import * as vscode from 'vscode'

function getExtensionUnderTest(): vscode.Extension<unknown> | undefined {
  const devPath = process.env.EXTENSION_DEVELOPMENT_PATH
  if (!devPath) return undefined

  const normalizedDevPath = path.resolve(devPath)
  return vscode.extensions.all.find((ext) => path.resolve(ext.extensionPath) === normalizedDevPath)
}

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.')

  test('Extension should be present', () => {
    const ext = getExtensionUnderTest()
    assert.ok(ext, 'Extension under test was not found in vscode.extensions.all')
  })

  test('Extension should activate', async () => {
    const ext = getExtensionUnderTest()
    assert.ok(ext, 'Extension under test was not found in vscode.extensions.all')
    // It might be already activated by previous test or startup
    if (!ext.isActive) {
      await ext.activate()
    }
    assert.ok(ext.isActive)
  })

  test('Commands should be registered', async () => {
    const ext = getExtensionUnderTest()
    assert.ok(ext, 'Extension under test was not found in vscode.extensions.all')
    if (!ext.isActive) {
      await ext.activate()
    }

    const commands = await vscode.commands.getCommands(true)
    assert.ok(commands.includes('agentSkills.refresh'), 'Refresh command missing')
    assert.ok(commands.includes('agentSkills.openSettings'), 'Settings command missing')
  })
})
