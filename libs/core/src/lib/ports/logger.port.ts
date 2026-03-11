/**
 * Logging methods required by core services.
 */
export interface LoggerPort {
  /**
   * Logs an error-level message.
   *
   * @param message - Message to record.
   * @returns Nothing.
   */
  error(message: string): void

  /**
   * Logs a warning-level message.
   *
   * @param message - Message to record.
   * @returns Nothing.
   */
  warn(message: string): void

  /**
   * Logs an info-level message.
   *
   * @param message - Message to record.
   * @returns Nothing.
   */
  info(message: string): void

  /**
   * Logs a debug-level message.
   *
   * @param message - Message to record.
   * @returns Nothing.
   */
  debug(message: string): void
}
