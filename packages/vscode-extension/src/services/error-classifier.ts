import { ErrorInfo } from '../shared/types'

const signalErrorMap: Partial<Record<NodeJS.Signals, ErrorInfo>> = {
  SIGTERM: {
    category: 'cancelled',
    message: 'Operation cancelled',
    retryable: false,
  },
  SIGKILL: {
    category: 'terminated',
    message: 'Operation was unexpectedly terminated.',
    retryable: false,
  },
}

const stderrRules: Array<{ predicate: (value: string) => boolean; info: ErrorInfo }> = [
  {
    predicate: (value) => value.includes('eperm') || value.includes('ebusy'),
    info: {
      category: 'file-locked',
      message:
        'Files are currently in use by another process. Please close any open files in the skill directory and try again.',
      retryable: true,
    },
  },
  {
    predicate: (value) => value.includes('enoent') && value.includes('npx'),
    info: {
      category: 'npx-missing',
      message: "Cannot find 'npx'. Ensure Node.js is installed and available in your system PATH.",
      retryable: false,
    },
  },
  {
    predicate: (value) => value.includes('enospc'),
    info: {
      category: 'disk-full',
      message: 'Insufficient disk space. Free up disk space and try again.',
      retryable: false,
    },
  },
  {
    predicate: (value) => value.includes('eacces'),
    info: {
      category: 'permission-denied',
      message: 'Permission denied. Check file permissions for the skill directory.',
      retryable: false,
    },
  },
  {
    predicate: (value) => value.includes('module_not_found') || value.includes('err_module_not_found'),
    info: {
      category: 'cli-missing',
      message: 'The @tech-leads-club/agent-skills CLI is not installed.',
      retryable: false,
      action: { label: 'Install CLI', command: 'npm install -g @tech-leads-club/agent-skills' },
    },
  },
]

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
  if (signal && signalErrorMap[signal]) {
    return signalErrorMap[signal] as ErrorInfo
  }

  const lower = stderr.toLowerCase()
  for (const { predicate, info } of stderrRules) {
    if (predicate(lower)) {
      return info
    }
  }

  if (exitCode !== null && exitCode !== 0) {
    return {
      category: 'cli-error',
      message: stderr.trim() || `Process exited with code ${exitCode}`,
      retryable: false,
    }
  }

  return {
    category: 'unknown',
    message: "An unexpected error occurred. Check the 'Agent Skills' output channel for details.",
    retryable: false,
  }
}
