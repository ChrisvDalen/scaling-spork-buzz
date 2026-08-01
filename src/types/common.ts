/**
 * Shared primitives used across the domain model.
 *
 * Timestamps are ISO-8601 strings rather than `Date` objects so that every
 * entity can be transported over REST / WebSocket / SSE without a
 * (de)serialisation step. Parsing happens at the edge, in the formatting
 * helpers.
 */

/** ISO-8601 timestamp, e.g. `2026-08-01T09:32:11.000Z`. */
export type IsoTimestamp = string;

/** Branded identifier types keep unrelated ids from being swapped by mistake. */
declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

export type AgentId = Brand<string, 'AgentId'>;
export type TaskId = Brand<string, 'TaskId'>;
export type ActivityEventId = Brand<string, 'ActivityEventId'>;
export type ApprovalRequestId = Brand<string, 'ApprovalRequestId'>;
export type RepositoryId = Brand<string, 'RepositoryId'>;
export type PullRequestId = Brand<string, 'PullRequestId'>;
export type PipelineRunId = Brand<string, 'PipelineRunId'>;
export type ToolExecutionId = Brand<string, 'ToolExecutionId'>;
export type LogEntryId = Brand<string, 'LogEntryId'>;

/** Constructors — the single sanctioned way to mint a branded id. */
export const agentId = (value: string): AgentId => value as AgentId;
export const taskId = (value: string): TaskId => value as TaskId;
export const activityEventId = (value: string): ActivityEventId => value as ActivityEventId;
export const approvalRequestId = (value: string): ApprovalRequestId => value as ApprovalRequestId;
export const repositoryId = (value: string): RepositoryId => value as RepositoryId;
export const pullRequestId = (value: string): PullRequestId => value as PullRequestId;
export const pipelineRunId = (value: string): PipelineRunId => value as PipelineRunId;
export const toolExecutionId = (value: string): ToolExecutionId => value as ToolExecutionId;
export const logEntryId = (value: string): LogEntryId => value as LogEntryId;

/** Operational severity, aligned with the activity feed and health checks. */
export type Severity = 'debug' | 'info' | 'notice' | 'warning' | 'error' | 'critical';

export const SEVERITY_ORDER: readonly Severity[] = [
  'debug',
  'info',
  'notice',
  'warning',
  'error',
  'critical',
] as const;

/** Risk classification for actions that need a human decision. */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export const RISK_LEVELS: readonly RiskLevel[] = ['low', 'medium', 'high', 'critical'] as const;

/** Work item priority. */
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export const PRIORITIES: readonly Priority[] = ['low', 'normal', 'high', 'urgent'] as const;

/** A percentage in the range 0 to 100. Not enforced by the type system; validated at the edge. */
export type Percentage = number;

/** Pagination envelope, so list endpoints can grow a cursor without breaking callers. */
export interface Page<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly cursor?: string | null;
}

/** A link out to an external system (GitHub, Jira, CI, artifact store). */
export interface ExternalLink {
  readonly label: string;
  readonly url: string;
  readonly system: 'github' | 'jira' | 'ci' | 'artifact' | 'docs' | 'other';
}
