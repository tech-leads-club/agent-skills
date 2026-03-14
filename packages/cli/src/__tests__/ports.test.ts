import { describe, expect, it } from '@jest/globals'
import { ports } from '../ports'

describe('ports', () => {
  it('should export a valid CorePorts instance with all required port fields', () => {
    expect(ports).toBeDefined()
    expect(ports.fs).toBeDefined()
    expect(ports.http).toBeDefined()
    expect(ports.shell).toBeDefined()
    expect(ports.env).toBeDefined()
    expect(ports.logger).toBeDefined()
    expect(ports.packageResolver).toBeDefined()
  })

  it('should have fs port with required methods', () => {
    expect(typeof ports.fs.readFile).toBe('function')
    expect(typeof ports.fs.writeFile).toBe('function')
    expect(typeof ports.fs.writeFileSync).toBe('function')
    expect(typeof ports.fs.existsSync).toBe('function')
    expect(typeof ports.fs.mkdir).toBe('function')
    expect(typeof ports.fs.readdir).toBe('function')
    expect(typeof ports.fs.symlink).toBe('function')
    expect(typeof ports.fs.readlink).toBe('function')
    expect(typeof ports.fs.lstat).toBe('function')
    expect(typeof ports.fs.cp).toBe('function')
    expect(typeof ports.fs.rm).toBe('function')
    expect(typeof ports.fs.rename).toBe('function')
    expect(typeof ports.fs.appendFile).toBe('function')
  })

  it('should have http port with required methods', () => {
    expect(typeof ports.http.get).toBe('function')
  })

  it('should have shell port with required methods', () => {
    expect(typeof ports.shell.exec).toBe('function')
  })

  it('should have env port with required methods', () => {
    expect(typeof ports.env.getEnv).toBe('function')
    expect(typeof ports.env.homedir).toBe('function')
    expect(typeof ports.env.platform).toBe('function')
    expect(typeof ports.env.cwd).toBe('function')
  })

  it('should have logger port with required methods', () => {
    expect(typeof ports.logger.info).toBe('function')
    expect(typeof ports.logger.warn).toBe('function')
    expect(typeof ports.logger.error).toBe('function')
    expect(typeof ports.logger.debug).toBe('function')
  })

  it('should have packageResolver port with required methods', () => {
    expect(typeof ports.packageResolver.getLatestVersion).toBe('function')
  })
})
