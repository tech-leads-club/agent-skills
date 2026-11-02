import { join, resolve, sep } from 'node:path'

/** Resolve absolute fixture paths with the host platform's native separators. */
export const fixturePath = (path: string): string => resolve(path)

/** Join fixture path segments with the host platform's native separators. */
export const joinFixturePath = (...segments: string[]): string => join(...segments)

/** Return a path prefix that matches descendants using the host platform's separator. */
export const fixturePathPrefix = (path: string): string => `${resolve(path)}${sep}`
