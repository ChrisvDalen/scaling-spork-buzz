import type {
  ActivityEventId,
  AgentId,
  IsoTimestamp,
  RepositoryId,
  Severity,
  TaskId,
} from './common';

/** Every event kind the timeline can render. */
export type ActivityEventType =
  | 'agent_started'
  | 'agent_stopped'
  | 'agent_blocked'
  | 'task_assigned'
  | 'task_started'
  | 'task_completed'
  | 'task_failed'
  | 'repository_cloned'
  | 'branch_created'
  | 'file_changed'
  | 'command_executed'
  | 'test_run'
  | 'test_failed'
  | 'commit_created'
  | 'pull_request_opened'
  | 'review_requested'
  | 'review_submitted'
  | 'pipeline_started'
  | 'pipeline_succeeded'
  | 'pipeline_failed'
  | 'approval_requested'
  | 'approval_granted'
  | 'approval_rejected'
  | 'policy_violation_blocked';

export const ACTIVITY_EVENT_TYPES: readonly ActivityEventType[] = [
  'agent_started',
  'agent_stopped',
  'agent_blocked',
  'task_assigned',
  'task_started',
  'task_completed',
  'task_failed',
  'repository_cloned',
  'branch_created',
  'file_changed',
  'command_executed',
  'test_run',
  'test_failed',
  'commit_created',
  'pull_request_opened',
  'review_requested',
  'review_submitted',
  'pipeline_started',
  'pipeline_succeeded',
  'pipeline_failed',
  'approval_requested',
  'approval_granted',
  'approval_rejected',
  'policy_violation_blocked',
] as const;

/**
 * A single entry in the central timeline.
 *
 * `metadata` is intentionally loose: the transport may carry event-specific
 * fields (commit sha, test counts, pipeline id) that the UI renders as
 * key/value chips without needing a type per event.
 */
export interface ActivityEvent {
  readonly id: ActivityEventId;
  readonly type: ActivityEventType;
  readonly timestamp: IsoTimestamp;
  readonly severity: Severity;
  readonly message: string;
  readonly agentId?: AgentId;
  readonly taskId?: TaskId;
  readonly repositoryId?: RepositoryId;
  readonly detail?: string;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}

/** Filter state for the activity view; also the query shape for the service. */
export interface ActivityFilter {
  readonly agentIds?: readonly AgentId[];
  readonly taskIds?: readonly TaskId[];
  readonly repositoryIds?: readonly RepositoryId[];
  readonly types?: readonly ActivityEventType[];
  readonly minSeverity?: Severity;
  /** Relative window; `all` disables time filtering. */
  readonly window?: TimeWindow;
  readonly search?: string;
}

export type TimeWindow = '15m' | '1h' | '6h' | '24h' | '7d' | 'all';

export const TIME_WINDOWS: readonly TimeWindow[] = ['15m', '1h', '6h', '24h', '7d', 'all'] as const;

export const TIME_WINDOW_MS: Readonly<Record<Exclude<TimeWindow, 'all'>, number>> = {
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};
