import type {
  AgentId,
  ExternalLink,
  IsoTimestamp,
  LogEntryId,
  Percentage,
  RepositoryId,
  Severity,
  TaskId,
  ToolExecutionId,
} from './common';
import type { CostUsage } from './metrics';

/**
 * Lifecycle state of an agent worker.
 *
 * - `idle`              registered, holding no work
 * - `queued`            work assigned, not yet picked up by a runner
 * - `running`           actively executing a task
 * - `waiting`           suspended on an external signal (CI run, review, sibling agent)
 * - `blocked`           cannot proceed; needs intervention
 * - `approval_required` halted at a policy gate, waiting on a human decision
 * - `completed`         finished its assignment successfully
 * - `failed`            terminated with an unrecoverable error
 * - `stopped`           halted by an operator
 */
export type AgentStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'waiting'
  | 'blocked'
  | 'approval_required'
  | 'completed'
  | 'failed'
  | 'stopped';

export const AGENT_STATUSES: readonly AgentStatus[] = [
  'idle',
  'queued',
  'running',
  'waiting',
  'blocked',
  'approval_required',
  'completed',
  'failed',
  'stopped',
] as const;

/** Functional role, used for routing work and for grouping in the UI. */
export type AgentRole =
  | 'architect'
  | 'backend_engineer'
  | 'frontend_engineer'
  | 'test_engineer'
  | 'security_reviewer'
  | 'devops_engineer'
  | 'code_reviewer'
  | 'documentation'
  | 'coordination'
  | 'release_manager';

/**
 * A capability is a coarse-grained permission grant. It is deliberately
 * separate from `allowedTools`: capabilities describe *what an agent may
 * attempt*, tools describe *how*. The policy engine reads capabilities.
 */
export type AgentCapabilityKind =
  | 'read_repository'
  | 'write_code'
  | 'run_tests'
  | 'run_build'
  | 'create_branch'
  | 'create_commit'
  | 'open_pull_request'
  | 'review_pull_request'
  | 'merge_to_main'
  | 'trigger_pipeline'
  | 'deploy_staging'
  | 'deploy_production'
  | 'modify_infrastructure'
  | 'read_secrets'
  | 'delete_files'
  | 'modify_issue_tracker'
  | 'send_external_message'
  | 'financial_action';

export interface AgentCapability {
  readonly kind: AgentCapabilityKind;
  readonly label: string;
  /** `true` when the agent may act on its own; `false` routes through the Approval Center. */
  readonly autonomous: boolean;
  /** Set when `autonomous` is false: which policy rule forces the human gate. */
  readonly gatedBy?: string;
}

/** A tool binding the runtime exposes to the agent. */
export interface AgentTool {
  readonly name: string;
  readonly description: string;
  readonly category: 'vcs' | 'filesystem' | 'shell' | 'ci' | 'tracker' | 'search' | 'analysis';
}

/** Model binding for an agent, mirrored from the runtime configuration. */
export interface AgentModelBinding {
  readonly provider: string;
  readonly model: string;
  readonly contextWindow: number;
  readonly temperature: number;
}

/** A structured log line emitted by an agent. */
export interface AgentLog {
  readonly id: LogEntryId;
  readonly agentId: AgentId;
  readonly taskId?: TaskId;
  readonly timestamp: IsoTimestamp;
  readonly severity: Severity;
  readonly message: string;
  /** Emitting subsystem, e.g. `planner`, `tool.git`, `runtime`. */
  readonly source: string;
}

/** A single tool invocation, with its result. Feeds the "commands executed" view. */
export interface ToolExecution {
  readonly id: ToolExecutionId;
  readonly agentId: AgentId;
  readonly taskId?: TaskId;
  readonly tool: string;
  /** The literal command or call, as executed. */
  readonly command: string;
  readonly startedAt: IsoTimestamp;
  readonly finishedAt?: IsoTimestamp;
  readonly durationMs?: number;
  readonly exitCode?: number;
  readonly status: 'running' | 'succeeded' | 'failed' | 'cancelled';
  /** Truncated stdout/stderr tail, as shown in the detail panel. */
  readonly output?: string;
}

/** A file touched by an agent within its working tree. */
export interface ChangedFile {
  readonly path: string;
  readonly repositoryId: RepositoryId;
  readonly changeType: 'added' | 'modified' | 'deleted' | 'renamed';
  readonly linesAdded: number;
  readonly linesRemoved: number;
  readonly lastModifiedAt: IsoTimestamp;
}

/** Any file an agent produced that is not source code: reports, SBOMs, coverage. */
export interface AgentArtifact {
  readonly id: string;
  readonly name: string;
  readonly kind: 'report' | 'coverage' | 'sbom' | 'diagram' | 'log' | 'binary' | 'document';
  readonly sizeBytes: number;
  readonly createdAt: IsoTimestamp;
  readonly url: string;
}

/** A structured error surfaced by the runtime. */
export interface AgentError {
  readonly code: string;
  readonly message: string;
  readonly occurredAt: IsoTimestamp;
  readonly severity: Severity;
  readonly retryable: boolean;
  readonly detail?: string;
}

/** Why an agent cannot make progress. */
export interface Blocker {
  readonly reason: string;
  readonly since: IsoTimestamp;
  readonly kind:
    | 'dependency'
    | 'approval'
    | 'failing_test'
    | 'missing_credential'
    | 'merge_conflict'
    | 'external_service'
    | 'rate_limit';
  /** Agent or task this blocker is waiting on, when applicable. */
  readonly waitingOn?: string;
}

/** One entry in an agent's execution history. */
export interface ExecutionHistoryEntry {
  readonly taskId: TaskId;
  readonly title: string;
  readonly startedAt: IsoTimestamp;
  readonly finishedAt?: IsoTimestamp;
  readonly outcome: 'succeeded' | 'failed' | 'cancelled' | 'in_progress';
  readonly summary: string;
  readonly tokensUsed: number;
}

/**
 * The primary agent record, as rendered in the agent table.
 * Heavier detail (logs, tool calls, artifacts) is loaded separately via
 * `AgentService.getDetail` so the list view stays cheap.
 */
export interface Agent {
  readonly id: AgentId;
  readonly name: string;
  readonly role: AgentRole;
  readonly roleLabel: string;
  readonly specialization: string;
  readonly status: AgentStatus;
  readonly currentTaskId?: TaskId;
  readonly currentTaskTitle?: string;
  readonly repositoryId?: RepositoryId;
  readonly branch?: string;
  readonly startedAt?: IsoTimestamp;
  readonly lastActivityAt: IsoTimestamp;
  readonly progress: Percentage;
  readonly model: AgentModelBinding;
  readonly activeTool?: string;
  readonly cost: CostUsage;
  /** Ids of agents whose output this agent is waiting on. */
  readonly dependsOn: readonly AgentId[];
  readonly blocker?: Blocker;
  readonly lastLogLine?: string;
  readonly host: string;
}

/** Everything the detail panel needs, keyed to a single agent. */
export interface AgentDetail {
  readonly agent: Agent;
  readonly systemPrompt: string;
  readonly capabilities: readonly AgentCapability[];
  readonly allowedTools: readonly AgentTool[];
  readonly executionHistory: readonly ExecutionHistoryEntry[];
  readonly logs: readonly AgentLog[];
  readonly changedFiles: readonly ChangedFile[];
  readonly toolExecutions: readonly ToolExecution[];
  readonly errors: readonly AgentError[];
  readonly artifacts: readonly AgentArtifact[];
  readonly links: readonly ExternalLink[];
}

/** Operator commands the console can issue against an agent or its task. */
export type AgentCommand =
  | 'pause'
  | 'resume'
  | 'stop'
  | 'retry'
  | 'reassign'
  | 'review_output';
