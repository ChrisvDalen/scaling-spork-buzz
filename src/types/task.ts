import type {
  AgentId,
  IsoTimestamp,
  Percentage,
  Priority,
  RepositoryId,
  TaskId,
} from './common';

/**
 * Task lifecycle. The board renders one column per state, in this order.
 *
 * `waiting_approval` is distinct from `blocked`: the former is a deliberate
 * policy gate with a pending ApprovalRequest, the latter is an unplanned stall.
 */
export type TaskStatus =
  | 'backlog'
  | 'queued'
  | 'in_progress'
  | 'waiting_approval'
  | 'blocked'
  | 'completed'
  | 'failed';

export const TASK_STATUSES: readonly TaskStatus[] = [
  'backlog',
  'queued',
  'in_progress',
  'waiting_approval',
  'blocked',
  'completed',
  'failed',
] as const;

/** Where a task stands with respect to human sign-off. */
export type TaskApprovalStatus =
  | 'not_required'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'changes_requested';

/** A unit of work decomposed from a task. */
export interface Subtask {
  readonly id: string;
  readonly title: string;
  readonly status: 'pending' | 'in_progress' | 'done' | 'failed' | 'skipped';
  readonly startedAt?: IsoTimestamp;
  readonly finishedAt?: IsoTimestamp;
}

export interface Task {
  readonly id: TaskId;
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly priority: Priority;
  readonly assignedAgentId?: AgentId;
  readonly repositoryId: RepositoryId;
  /** Tracker reference, e.g. `PLAT-1482`. */
  readonly issueKey?: string;
  readonly issueUrl?: string;
  /** Tasks that must reach `completed` before this one may start. */
  readonly dependsOn: readonly TaskId[];
  readonly deadline?: IsoTimestamp;
  readonly progress: Percentage;
  readonly createdAt: IsoTimestamp;
  readonly startedAt?: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  readonly completedAt?: IsoTimestamp;
  /** Human-readable outcome once the task leaves an active state. */
  readonly result?: string;
  readonly approvalStatus: TaskApprovalStatus;
  readonly subtasks: readonly Subtask[];
  readonly labels: readonly string[];
  readonly estimatedTokens?: number;
}
