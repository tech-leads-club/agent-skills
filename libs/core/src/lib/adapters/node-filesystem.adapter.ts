import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import {
  appendFile,
  cp,
  lstat,
  mkdir,
  readFile,
  readdir,
  readlink,
  rename,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'

import type { FileSystemPort } from '../ports'

/**
 * Node.js implementation of {@link FileSystemPort}.
 *
 * This adapter is the single environment-specific implementation used by core
 * services for file system operations.
 */
export class NodeFileSystemAdapter implements FileSystemPort {
  /**
   * @inheritdoc
   */
  public async readFile(path: string, encoding: string): Promise<string> {
    return readFile(path, encoding as BufferEncoding)
  }

  /**
   * @inheritdoc
   */
  public async writeFile(path: string, content: string, encoding: string): Promise<void> {
    await writeFile(path, content, encoding as BufferEncoding)
  }

  /**
   * @inheritdoc
   */
  public writeFileSync(path: string, content: string, encoding: string): void {
    writeFileSync(path, content, encoding as BufferEncoding)
  }

  /**
   * @inheritdoc
   */
  public async appendFile(path: string, content: string, encoding: string): Promise<void> {
    await appendFile(path, content, encoding as BufferEncoding)
  }

  /**
   * @inheritdoc
   */
  public async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    await mkdir(path, options)
  }

  /**
   * @inheritdoc
   */
  public mkdirSync(path: string, options?: { recursive?: boolean }): void {
    mkdirSync(path, options)
  }

  /**
   * @inheritdoc
   */
  public async rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void> {
    await rm(path, options)
  }

  /**
   * @inheritdoc
   */
  public rmSync(path: string, options?: { recursive?: boolean; force?: boolean }): void {
    rmSync(path, options)
  }

  /**
   * @inheritdoc
   */
  public async rename(oldPath: string, newPath: string): Promise<void> {
    await rename(oldPath, newPath)
  }

  /**
   * @inheritdoc
   */
  public async cp(src: string, dest: string, options?: { recursive?: boolean }): Promise<void> {
    await cp(src, dest, options)
  }

  /**
   * @inheritdoc
   */
  public async symlink(target: string, linkPath: string, type?: string): Promise<void> {
    await symlink(target, linkPath, type)
  }

  /**
   * @inheritdoc
   */
  public async readlink(linkPath: string): Promise<string> {
    return readlink(linkPath)
  }

  /**
   * @inheritdoc
   */
  public async lstat(path: string): Promise<{ isDirectory(): boolean; isSymbolicLink(): boolean }> {
    return lstat(path)
  }

  /**
   * @inheritdoc
   */
  public async readdir(
    path: string,
    _options?: { withFileTypes: true },
  ): Promise<{ name: string; isDirectory(): boolean; isSymbolicLink?(): boolean }[]> {
    return readdir(path, { withFileTypes: true })
  }

  /**
   * @inheritdoc
   */
  public existsSync(path: string): boolean {
    return existsSync(path)
  }

  /**
   * @inheritdoc
   */
  public readFileSync(path: string, encoding: string): string {
    return readFileSync(path, encoding as BufferEncoding)
  }

  /**
   * @inheritdoc
   */
  public readdirSync(path: string, _options?: { withFileTypes: true }): { name: string; isDirectory(): boolean }[] {
    return readdirSync(path, { withFileTypes: true })
  }
}
