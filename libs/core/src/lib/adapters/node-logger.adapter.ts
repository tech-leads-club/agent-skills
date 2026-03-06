import type { LoggerPort } from '../ports'

/**
 * Node.js implementation of {@link LoggerPort} using console methods.
 */
export class NodeLoggerAdapter implements LoggerPort {
  /**
   * Logs an error-level message.
   *
   * @param message - Message to log.
   */
  public error(message: string): void {
    console.error(message)
  }

  /**
   * Logs a warning-level message.
   *
   * @param message - Message to log.
   */
  public warn(message: string): void {
    console.warn(message)
  }

  /**
   * Logs an info-level message.
   *
   * @param message - Message to log.
   */
  public info(message: string): void {
    console.info(message)
  }

  /**
   * Logs a debug-level message.
   *
   * @param message - Message to log.
   */
  public debug(message: string): void {
    console.debug(message)
  }
}
