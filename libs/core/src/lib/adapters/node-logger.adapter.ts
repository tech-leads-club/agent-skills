import type { LoggerPort } from '../ports'

/**
 * Node.js implementation of {@link LoggerPort} using console methods.
 */
export class NodeLoggerAdapter implements LoggerPort {
  /**
   * @inheritdoc
   */
  public error(message: string): void {
    console.error(message)
  }

  /**
   * @inheritdoc
   */
  public warn(message: string): void {
    console.warn(message)
  }

  /**
   * @inheritdoc
   */
  public info(message: string): void {
    console.info(message)
  }

  /**
   * @inheritdoc
   */
  public debug(message: string): void {
    console.debug(message)
  }
}
