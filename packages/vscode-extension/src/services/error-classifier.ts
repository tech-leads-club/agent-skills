import { ErrorInfo } from '../shared/types'

/**
 * Classifies CLI stderr output into user-friendly error types with actionable messages.
 * Evaluates rules in priority order: Signal > Stderr Patterns > Exit Code > Fallback.
 *
 * @param stderr - Standard error output from the process
 * @param exitCode - Process exit code (null if killed by signal)
 * @param signal - Signal that terminated the process (null if exited normally)
 * @returns Categorized error information
 */
export function classifyError(stderr: string, exitCode: number | null, signal: NodeJS.Signals | null): ErrorInfo {
  // 1. Signal-based classification
  if (signal === 'SIGTERM') {
    return {
      category: 'cancelled',
      message: 'Operation cancelled',
      retryable: false,
    }
  }
  if (signal === 'SIGKILL') {
    return {
      category: 'terminated',
      message: 'Operation was unexpectedly terminated.',
      retryable: false,
    }
  }

  // 2. Stderr pattern matching (case-insensitive)
  const lower = stderr.toLowerCase()

  if (lower.includes('eperm') || lower.includes('ebusy')) {
    return {
      category: 'file-locked',
      message:
        'Files are currently in use by another process. Please close any open files in the skill directory and try again.',
      retryable: true,
    }
  }

  if (lower.includes('enoent') && lower.includes('npx')) {
    return {
      category: 'npx-missing',
      message: "Cannot find 'npx'. Ensure Node.js is installed and available in your system PATH.",
      retryable: false,
    }
  }

  if (lower.includes('enospc')) {
    return {
      category: 'disk-full',
      message: 'Insufficient disk space. Free up disk space and try again.',
      retryable: false,
    }
  }

  if (lower.includes('eacces')) {
    return {
      category: 'permission-denied',
      message: 'Permission denied. Check file permissions for the skill directory.',
      retryable: false,
    }
  }

  if (lower.includes('module_not_found') || lower.includes('err_module_not_found')) {
    return {
      category: 'cli-missing',
      message: 'The @tech-leads-club/agent-skills CLI is not installed.',
      retryable: false,
      action: { label: 'Install CLI', command: 'npm install -g @tech-leads-club/agent-skills' },
    }
  }

  // 3. Generic non-zero exit
  if (exitCode !== null && exitCode !== 0) {
    return {
      category: 'cli-error',
      message: stderr.trim() || `Process exited with code ${exitCode}`,
      retryable: false,
    }
  }

  // 4. Fallback
  return {
    category: 'unknown',
    message: "An unexpected error occurred. Check the 'Agent Skills' output channel for details.",
    retryable: false,
  }
}
