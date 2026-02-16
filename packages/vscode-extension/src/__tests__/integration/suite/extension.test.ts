import * as assert from 'assert'
import * as vscode from 'vscode'

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.')

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('tech-leads-club.vscode-extension'))
  })

  test('Extension should activate', async () => {
    const ext = vscode.extensions.getExtension('tech-leads-club.vscode-extension')
    assert.ok(ext)
    // It might be already activated by previous test or startup
    if (!ext.isActive) {
      await ext.activate()
    }
    assert.ok(ext.isActive)
  })

  test('Commands should be registered', async () => {
    const commands = await vscode.commands.getCommands(true)
    assert.ok(commands.includes('agentSkills.refresh'), 'Refresh command missing')
    assert.ok(commands.includes('agentSkills.openSettings'), 'Settings command missing')
  })
})
