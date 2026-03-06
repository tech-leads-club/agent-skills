export * from './env.port'
export * from './filesystem.port'
export * from './http.port'
export * from './logger.port'
export * from './package-resolver.port'
export * from './shell.port'

import type { EnvPort } from './env.port'
import type { FileSystemPort } from './filesystem.port'
import type { HttpPort } from './http.port'
import type { LoggerPort } from './logger.port'
import type { PackageResolverPort } from './package-resolver.port'
import type { ShellPort } from './shell.port'

/**
 * Aggregates all infrastructure ports required by core services.
 *
 * @example
 * ```ts
 * const ports: CorePorts = {
 *   fs,
 *   http,
 *   shell,
 *   env,
 *   logger,
 *   packageResolver,
 * }
 * ```
 */
export interface CorePorts {
  /** Filesystem adapter used by core services. */
  fs: FileSystemPort
  /** HTTP adapter used by core services. */
  http: HttpPort
  /** Shell adapter used by core services. */
  shell: ShellPort
  /** Environment adapter used by core services. */
  env: EnvPort
  /** Logger adapter used by core services. */
  logger: LoggerPort
  /** Package resolver adapter used by core services. */
  packageResolver: PackageResolverPort
}
