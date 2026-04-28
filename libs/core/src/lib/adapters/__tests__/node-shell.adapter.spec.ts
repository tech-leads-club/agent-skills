import { NodeShellAdapter } from '../index'

describe('NodeShellAdapter', () => {
  it('executes a shell command and returns output text', () => {
    const adapter = new NodeShellAdapter()
    const output = adapter.exec('node -e "process.stdout.write(\'hello\')"')

    expect(output).toBe('hello')
  })
})
