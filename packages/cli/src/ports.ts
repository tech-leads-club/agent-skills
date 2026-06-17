import { createNodeAdapters } from '@tech-leads-club/core'

/**
 * Shared Node.js adapter instances for all CLI services.
 *
 * This singleton provides a complete set of I/O ports (filesystem, HTTP, shell, environment, logger, package resolver)
 * that are injected into core business logic functions. By centralizing adapter creation, the CLI avoids
 * instantiating duplicate adapters across different command handlers.
 *
 * @example
 * ```typescript
 * import { ports } from './ports'
 * import { installSkills } from '@tech-leads-club/core'
 *
 * const result = await installSkills(ports, skillNames, agentType)
 * ```
 */
export const ports = createNodeAdapters()
