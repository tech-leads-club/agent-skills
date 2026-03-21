import type { OperationBatchMetadata, OperationType } from '../types'

export type JobProgressCallback = (message: string, severity?: 'info' | 'warn' | 'error') => void

export interface JobExecutor {
  execute(job: QueuedJob, onProgress?: JobProgressCallback): Promise<JobResult>
}

export interface QueuedJob {
  operationId: string
  operation: OperationType
  skillName: string
  args?: string[]
  cwd?: string
  metadata?: OperationBatchMetadata
}

export interface JobResult {
  operationId: string
  operation: OperationType
  skillName: string
  status: 'completed' | 'cancelled' | 'error'
  errorMessage?: string
  error?: unknown
  metadata?: OperationBatchMetadata
}
