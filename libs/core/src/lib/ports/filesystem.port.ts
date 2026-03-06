/**
 * Filesystem operations required by core services.
 */
export interface FileSystemPort {
  /**
   * Reads a text file from disk.
   *
   * @param path - Absolute or relative file path to read.
   * @param encoding - Text encoding used to decode the file contents.
   * @returns A promise that resolves to the file contents.
   */
  readFile(path: string, encoding: string): Promise<string>

  /**
   * Writes a text file to disk, replacing any existing content.
   *
   * @param path - Absolute or relative file path to write.
   * @param content - Text content to persist.
   * @param encoding - Text encoding used to encode the file contents.
   * @returns A promise that resolves when the file has been written.
   */
  writeFile(path: string, content: string, encoding: string): Promise<void>

  /**
   * Appends text content to an existing file.
   *
   * @param path - Absolute or relative file path to append to.
   * @param content - Text content to append.
   * @param encoding - Text encoding used to encode the appended content.
   * @returns A promise that resolves when the content has been appended.
   */
  appendFile(path: string, content: string, encoding: string): Promise<void>

  /**
   * Creates a directory.
   *
   * @param path - Directory path to create.
   * @param options - Optional directory creation behavior.
   * @returns A promise that resolves when the directory exists.
   */
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>

  /**
   * Removes a file system path.
   *
   * @param path - File or directory path to remove.
   * @param options - Optional removal behavior.
   * @returns A promise that resolves when the path has been removed.
   */
  rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>

  /**
   * Renames or moves a file system path.
   *
   * @param oldPath - Existing file or directory path.
   * @param newPath - New file or directory path.
   * @returns A promise that resolves when the path has been renamed.
   */
  rename(oldPath: string, newPath: string): Promise<void>

  /**
   * Copies a file or directory.
   *
   * @param src - Source file or directory path.
   * @param dest - Destination file or directory path.
   * @param options - Optional copy behavior.
   * @returns A promise that resolves when the copy has completed.
   */
  cp(src: string, dest: string, options?: { recursive?: boolean }): Promise<void>

  /**
   * Creates a symbolic link.
   *
   * @param target - Target path the symlink should point to.
   * @param linkPath - Path where the symlink should be created.
   * @param type - Optional symlink type hint for the platform.
   * @returns A promise that resolves when the symlink has been created.
   */
  symlink(target: string, linkPath: string, type?: string): Promise<void>

  /**
   * Resolves the target of a symbolic link.
   *
   * @param linkPath - Symlink path to inspect.
   * @returns A promise that resolves to the symlink target path.
   */
  readlink(linkPath: string): Promise<string>

  /**
   * Retrieves file system metadata for a path without following symlinks.
   *
   * @param path - File or directory path to inspect.
   * @returns A promise that resolves to metadata helpers for the path.
   */
  lstat(path: string): Promise<{ isDirectory(): boolean; isSymbolicLink(): boolean }>

  /**
   * Lists the entries in a directory.
   *
   * @param path - Directory path to read.
   * @param options - Optional read behavior.
   * @returns A promise that resolves to the discovered directory entries.
   */
  readdir(
    path: string,
    options?: { withFileTypes: true },
  ): Promise<{ name: string; isDirectory(): boolean; isSymbolicLink?(): boolean }[]>

  /**
   * Checks whether a path exists.
   *
   * @param path - File or directory path to check.
   * @returns `true` when the path exists; otherwise `false`.
   */
  existsSync(path: string): boolean

  /**
   * Reads a text file synchronously.
   *
   * @param path - Absolute or relative file path to read.
   * @param encoding - Text encoding used to decode the file contents.
   * @returns The file contents.
   */
  readFileSync(path: string, encoding: string): string

  /**
   * Lists directory entries synchronously.
   *
   * @param path - Directory path to read.
   * @param options - Optional read behavior.
   * @returns The discovered directory entries.
   */
  readdirSync(
    path: string,
    options?: { withFileTypes: true },
  ): { name: string; isDirectory(): boolean }[]
}
