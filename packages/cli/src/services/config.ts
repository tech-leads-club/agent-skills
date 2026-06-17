import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

import { CONFIG_DIR, CONFIG_FILE, CURRENT_CONFIG_VERSION } from '../utils/constants'

export interface UserConfig {
  firstLaunchComplete: boolean
  shortcutsOverlayDismissed: boolean
  version: string
}

const DEFAULT_CONFIG: UserConfig = {
  firstLaunchComplete: false,
  shortcutsOverlayDismissed: false,
  version: CURRENT_CONFIG_VERSION,
}

function getConfigPath(): string {
  return join(homedir(), CONFIG_DIR, CONFIG_FILE)
}

function validateConfig(config: unknown): UserConfig {
  if (typeof config !== 'object' || config === null) return DEFAULT_CONFIG
  const partial = config as Partial<UserConfig>

  return {
    firstLaunchComplete: Boolean(partial.firstLaunchComplete),
    shortcutsOverlayDismissed: Boolean(partial.shortcutsOverlayDismissed),
    version: String(partial.version || CURRENT_CONFIG_VERSION),
  }
}

export async function loadConfig(): Promise<UserConfig> {
  const configPath = getConfigPath()

  try {
    const content = await readFile(configPath, 'utf-8')
    const parsed = JSON.parse(content)
    return validateConfig(parsed)
  } catch {
    // Return defaults if file doesn't exist or is invalid
    return DEFAULT_CONFIG
  }
}

export async function saveConfig(config: Partial<UserConfig>): Promise<void> {
  const configPath = getConfigPath()
  const currentConfig = await loadConfig()
  const updatedConfig = { ...currentConfig, ...config }
  await mkdir(dirname(configPath), { recursive: true })
  const tempPath = `${configPath}.tmp`
  const content = JSON.stringify(updatedConfig, null, 2)

  try {
    await writeFile(tempPath, content, 'utf-8')
    await rename(tempPath, configPath)
  } catch (error) {
    try {
      await rm(tempPath, { force: true })
    } catch {
      // Ignore cleanup error
    }
    throw error
  }
}

export async function isFirstLaunch(): Promise<boolean> {
  const config = await loadConfig()
  return !config.firstLaunchComplete
}

export async function markFirstLaunchComplete(): Promise<void> {
  await saveConfig({ firstLaunchComplete: true })
}

export async function hasShortcutsBeenDismissed(): Promise<boolean> {
  const config = await loadConfig()
  return config.shortcutsOverlayDismissed
}

export async function markShortcutsDismissed(): Promise<void> {
  await saveConfig({ shortcutsOverlayDismissed: true })
}
