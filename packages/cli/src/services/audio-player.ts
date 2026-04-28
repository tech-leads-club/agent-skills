import { execSync, spawn, type ChildProcess } from 'node:child_process'
import { platform } from 'node:os'

function commandExists(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function spawnLinuxPlayer(filePath: string): ChildProcess {
  const players = [
    { cmd: 'mpv', args: ['--no-video', '--no-terminal', filePath] },
    { cmd: 'ffplay', args: ['-nodisp', '-autoexit', '-loglevel', 'quiet', filePath] },
    { cmd: 'paplay', args: [filePath] },
    { cmd: 'aplay', args: [filePath] },
  ]

  for (const { cmd, args } of players) {
    if (commandExists(cmd)) return spawn(cmd, args, { stdio: 'ignore' })
  }

  return spawn('mpv', ['--no-video', '--no-terminal', filePath], { stdio: 'ignore' })
}

export function play(filePath: string): ChildProcess | null {
  try {
    const os = platform()
    let proc: ChildProcess

    if (os === 'darwin') {
      proc = spawn('afplay', [filePath], { stdio: 'ignore' })
    } else if (os === 'win32') {
      proc = spawn('powershell', ['-c', `(New-Object Media.SoundPlayer "${filePath}").PlaySync()`], {
        stdio: 'ignore',
      })
    } else {
      proc = spawnLinuxPlayer(filePath)
    }

    proc.on('error', () => {
      // Player not available, silently ignore
    })

    return proc
  } catch {
    return null
  }
}

export function stop(proc: ChildProcess | null): void {
  if (proc && !proc.killed) proc.kill()
}
