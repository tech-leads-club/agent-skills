/**
 * Describes a skill category exposed by the catalog or registry.
 *
 * @example
 * ```ts
 * const category: CategoryInfo = {
 *   id: 'frontend',
 *   name: 'Frontend',
 *   description: 'UI and UX related skills',
 *   priority: 10,
 * }
 * ```
 */
export interface CategoryInfo {
  /** Stable identifier used in paths and registry payloads. */
  id: string
  /** Human-readable category name. */
  name: string
  /** Optional short description displayed in UIs. */
  description?: string
  /** Lower numbers sort first when ordering categories. */
  priority?: number
}

/**
 * Stores optional metadata overrides keyed by category folder name.
 *
 * @example
 * ```ts
 * const metadata: CategoryMetadata = {
 *   '(frontend)': {
 *     name: 'Frontend',
 *     description: 'UI focused skills',
 *     priority: 1,
 *   },
 * }
 * ```
 */
export interface CategoryMetadata {
  /** Metadata indexed by folder names such as `(frontend)`. */
  [categoryFolder: string]: {
    /** Optional display name override. */
    name?: string
    /** Optional description override. */
    description?: string
    /** Optional ordering override. */
    priority?: number
  }
}

/**
 * List of supported AI agent identifiers used for integration and configuration.
 */
export const AGENT_TYPES = [
  'cursor',
  'claude-code',
  'github-copilot',
  'windsurf',
  'cline',
  'aider',
  'codex',
  'gemini',
  'antigravity',
  'roo',
  'kilocode',
  'amazon-q',
  'augment',
  'tabnine',
  'opencode',
  'sourcegraph',
  'droid',
  'trae',
  'kiro',
] as const

/**
 * Union type representing a valid AI agent identifier derived from {@link AGENT_TYPES}.
 */
export type AgentType = (typeof AGENT_TYPES)[number]

/**
 * Defines how a supported agent stores project and global skills.
 *
 * @example
 * ```ts
 * const config: AgentConfig = {
 *   name: 'cursor',
 *   displayName: 'Cursor',
 *   description: 'Cursor editor',
 *   skillsDir: '.cursor/skills',
 *   globalSkillsDir: '/home/user/.cursor/skills',
 *   detectInstalled: () => true,
 * }
 * ```
 */
export interface AgentConfig {
  /** Internal agent identifier. */
  name: AgentType
  /** User-facing agent name. */
  displayName: string
  /** Short description of the agent integration. */
  description: string
  /** Project-local skills directory relative to the project root. */
  skillsDir: string
  /** Global skills directory in the user home directory. */
  globalSkillsDir: string
  /** Returns whether the agent is installed in the current environment. */
  detectInstalled: () => boolean
}

/**
 * Minimal skill information used across discovery and install flows.
 *
 * @example
 * ```ts
 * const skill: SkillInfo = {
 *   name: 'accessibility',
 *   description: 'Audit and improve web accessibility',
 *   path: '/repo/skills/(quality)/accessibility',
 *   category: 'quality',
 * }
 * ```
 */
export interface SkillInfo {
  /** Unique skill name. */
  name: string
  /** Short description shown in selection lists. */
  description: string
  /** Absolute or resolved path to the skill directory. */
  path: string
  /** Optional category identifier. */
  category?: string
}

/**
 * Options used when installing one or more skills.
 *
 * @example
 * ```ts
 * const options: InstallOptions = {
 *   global: false,
 *   method: 'symlink',
 *   agents: ['cursor', 'codex'],
 *   skills: ['accessibility'],
 *   forceUpdate: true,
 * }
 * ```
 */
export interface InstallOptions {
  /** Whether the install targets the global agent directory. */
  global: boolean
  /** Installation strategy used for agent skill directories. */
  method: 'symlink' | 'copy'
  /** Agents that should receive the skill. */
  agents: AgentType[]
  /** Requested skill names. */
  skills: string[]
  /** Whether already installed skills should be refreshed. */
  forceUpdate?: boolean
  /** Whether the operation is part of an update flow. */
  isUpdate?: boolean
}

/**
 * Outcome of a single skill installation attempt.
 *
 * @example
 * ```ts
 * const result: InstallResult = {
 *   agent: 'Cursor',
 *   skill: 'accessibility',
 *   path: '/repo/.cursor/skills/accessibility',
 *   method: 'symlink',
 *   success: true,
 * }
 * ```
 */
export interface InstallResult {
  /** Display name of the target agent. */
  agent: string
  /** Installed skill name. */
  skill: string
  /** Final installation path. */
  path: string
  /** Installation method actually used. */
  method: 'symlink' | 'copy'
  /** Whether installation completed successfully. */
  success: boolean
  /** Failure message when installation does not succeed. */
  error?: string
  /** Indicates a shared global symlink was reused. */
  usedGlobalSymlink?: boolean
  /** Indicates symlink creation failed and copy fallback was used. */
  symlinkFailed?: boolean
}

/**
 * Options used when removing installed skills.
 *
 * @example
 * ```ts
 * const options: RemoveOptions = {
 *   global: true,
 *   force: false,
 * }
 * ```
 */
export interface RemoveOptions {
  /** When set, restricts removal to global or local installs. */
  global?: boolean
  /** Removes paths even when the lockfile entry is missing. */
  force?: boolean
}

/**
 * Outcome of removing a skill from a single agent.
 *
 * @example
 * ```ts
 * const result: RemoveResult = {
 *   skill: 'accessibility',
 *   agent: 'Cursor',
 *   success: false,
 *   error: 'Skill not found',
 * }
 * ```
 */
export interface RemoveResult {
  /** Removed skill name. */
  skill: string
  /** Display name of the target agent. */
  agent: string
  /** Whether the removal succeeded. */
  success: boolean
  /** Failure reason when removal does not succeed. */
  error?: string
}

/**
 * Entry recorded for an installed skill in the shared lockfile.
 *
 * @example
 * ```ts
 * const entry: SkillLockEntry = {
 *   name: 'accessibility',
 *   source: 'registry',
 *   contentHash: 'abc123',
 *   installedAt: '2026-03-05T12:00:00.000Z',
 *   updatedAt: '2026-03-05T12:00:00.000Z',
 *   agents: ['cursor'],
 *   method: 'symlink',
 *   global: false,
 *   version: '1.2.0',
 * }
 * ```
 */
export interface SkillLockEntry {
  /** Canonical skill name. */
  name: string
  /** Source of the installed skill, such as `local` or `registry`. */
  source: string
  /** Optional content hash used for update detection. */
  contentHash?: string
  /** ISO timestamp for the first install. */
  installedAt: string
  /** ISO timestamp for the most recent update. */
  updatedAt: string
  /** Agents currently associated with this skill. */
  agents?: AgentType[]
  /** Installation strategy used for this lock entry. */
  method?: 'copy' | 'symlink'
  /** Whether the skill was installed globally. */
  global?: boolean
  /** Optional published version when known. */
  version?: string
}

/**
 * Root structure of the shared skill lockfile.
 *
 * @example
 * ```ts
 * const lock: SkillLockFile = {
 *   version: 2,
 *   skills: {
 *     accessibility: {
 *       name: 'accessibility',
 *       source: 'local',
 *       installedAt: '2026-03-05T12:00:00.000Z',
 *       updatedAt: '2026-03-05T12:00:00.000Z',
 *     },
 *   },
 * }
 * ```
 */
export interface SkillLockFile {
  /** Lockfile schema version. */
  version: number
  /** Installed skills indexed by skill name. */
  skills: Record<string, SkillLockEntry>
}

/**
 * Registry metadata for a single downloadable skill.
 *
 * @example
 * ```ts
 * const metadata: SkillMetadata = {
 *   name: 'accessibility',
 *   description: 'Audit and improve web accessibility',
 *   category: 'quality',
 *   path: '(quality)/accessibility',
 *   files: ['SKILL.md'],
 *   author: 'tech-leads-club',
 *   version: '1.0.0',
 *   contentHash: 'abc123',
 * }
 * ```
 */
export interface SkillMetadata {
  /** Unique skill name. */
  name: string
  /** Short description displayed in registry UIs. */
  description: string
  /** Category identifier for grouping and filtering. */
  category: string
  /** Relative path inside the catalog package. */
  path: string
  /** Files that belong to the skill package. */
  files: string[]
  /** Optional author metadata. */
  author?: string
  /** Optional version metadata. */
  version?: string
  /** Optional content hash used for cache validation. */
  contentHash?: string
}

/**
 * Full registry payload downloaded from the catalog CDN.
 *
 * @example
 * ```ts
 * const registry: SkillsRegistry = {
 *   version: '1.0.0',
 *   generatedAt: '2026-03-05T12:00:00.000Z',
 *   baseUrl: 'https://cdn.example.com/skills',
 *   categories: {
 *     quality: { name: 'Quality' },
 *   },
 *   skills: [],
 *   deprecated: [],
 * }
 * ```
 */
export interface SkillsRegistry {
  /** Registry package version or CDN ref. */
  version: string
  /** ISO timestamp when the registry was generated. */
  generatedAt: string
  /** Base URL used to resolve registry assets. */
  baseUrl: string
  /** Category definitions indexed by category id. */
  categories: Record<string, { name: string; description?: string }>
  /** All published skills available for download. */
  skills: SkillMetadata[]
  /** Optional deprecated skills metadata. */
  deprecated?: DeprecatedEntry[]
}

/**
 * Detailed per-agent audit result for install, remove, or update operations.
 *
 * @example
 * ```ts
 * const detail: AuditResultDetail = {
 *   skill: 'accessibility',
 *   agent: 'Cursor',
 *   success: true,
 *   path: '/repo/.cursor/skills/accessibility',
 * }
 * ```
 */
export interface AuditResultDetail {
  /** Skill processed by the operation. */
  skill: string
  /** Agent display name. */
  agent: string
  /** Whether the individual operation succeeded. */
  success: boolean
  /** Optional failure message. */
  error?: string
  /** Optional install or removal path. */
  path?: string
}

/**
 * Audit log entry written for skill lifecycle operations.
 *
 * @example
 * ```ts
 * const entry: AuditEntry = {
 *   action: 'install',
 *   skillName: 'accessibility',
 *   agents: ['Cursor'],
 *   success: 1,
 *   failed: 0,
 *   timestamp: '2026-03-05T12:00:00.000Z',
 * }
 * ```
 */
export interface AuditEntry {
  /** Operation type recorded in the audit log. */
  action: 'install' | 'remove' | 'update'
  /** Skill name or comma-separated skill names for batch operations. */
  skillName: string
  /** Agent display names involved in the operation. */
  agents: string[]
  /** Number of successful operations in the batch. */
  success: number
  /** Number of failed operations in the batch. */
  failed: number
  /** Whether the operation was forced. */
  forced?: boolean
  /** ISO timestamp of the audit event. */
  timestamp?: string
  /** Optional per-result details. */
  details?: AuditResultDetail[]
}

/**
 * Block-level markdown token produced by the parser helpers.
 *
 * @example
 * ```ts
 * const token: MarkdownToken = {
 *   type: 'heading',
 *   level: 2,
 *   text: 'Usage',
 * }
 * ```
 */
export type MarkdownToken =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list-item'; text: string; indent: number }
  | { type: 'code-block'; language: string; lines: string[] }
  | { type: 'hr' }
  | { type: 'blank' }

/**
 * Inline markdown segment produced by `parseInline`.
 *
 * @example
 * ```ts
 * const segment: InlineSegment = {
 *   text: 'npm install',
 *   code: true,
 * }
 * ```
 */
export interface InlineSegment {
  /** Text content for the inline fragment. */
  text: string
  /** Whether the segment is bold text. */
  bold?: boolean
  /** Whether the segment is italic text. */
  italic?: boolean
  /** Whether the segment is inline code. */
  code?: boolean
}

/**
 * Selects whether skills are loaded from the local catalog or remote registry.
 *
 * @example
 * ```ts
 * const mode: SkillsMode = 'remote'
 * ```
 */
export type SkillsMode = 'local' | 'remote'

/**
 * Describes a deprecated skill entry published in the registry.
 *
 * @example
 * ```ts
 * const deprecated: DeprecatedEntry = {
 *   name: 'old-skill',
 *   message: 'Use accessibility instead',
 *   alternatives: ['accessibility'],
 * }
 * ```
 */
export interface DeprecatedEntry {
  /** Deprecated skill name. */
  name: string
  /** Deprecation message shown to the user. */
  message: string
  /** Suggested replacement skills. */
  alternatives?: string[]
}
