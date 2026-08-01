import type {
  ActivityEvent,
  ActivityFilter,
  Agent,
  AgentCommand,
  AgentDetail,
  AgentId,
  AgentLog,
  ApprovalRequest,
  ApprovalRequestId,
  ApprovalResolution,
  FleetSummary,
  MetricSeries,
  PipelineRun,
  PullRequest,
  Repository,
  RepositoryId,
  StreamStatus,
  SystemHealth,
  Task,
  TaskId,
  TaskStatus,
} from '@/types';

/**
 * Service contracts.
 *
 * Every screen talks to these interfaces and never to the fixture modules
 * directly. Swapping the mock implementation for REST, WebSocket, or SSE is
 * therefore a change in `src/services/index.ts` and nowhere else.
 *
 * All reads are asynchronous even though the mock resolves immediately: a
 * synchronous read would let components take a dependency that a network
 * implementation could not honour.
 */

export interface CommandResult {
  readonly ok: boolean;
  /** Operator-facing confirmation or refusal, shown in the toast strip. */
  readonly message: string;
}

export interface AgentService {
  list(): Promise<readonly Agent[]>;
  get(id: AgentId): Promise<Agent | undefined>;
  getDetail(id: AgentId): Promise<AgentDetail | undefined>;
  /** Tail of the agent log. A streaming implementation would add `follow`. */
  getLogs(id: AgentId, limit?: number): Promise<readonly AgentLog[]>;
  /**
   * Issues an operator command. Commands that would breach a policy rule are
   * refused here rather than in the UI, so the same guard applies to any caller.
   */
  sendCommand(id: AgentId, command: AgentCommand): Promise<CommandResult>;
}

export interface TaskService {
  list(): Promise<readonly Task[]>;
  get(id: TaskId): Promise<Task | undefined>;
  listByStatus(status: TaskStatus): Promise<readonly Task[]>;
  reassign(id: TaskId, agentId: AgentId | null): Promise<CommandResult>;
  retry(id: TaskId): Promise<CommandResult>;
}

export interface ActivityService {
  query(filter?: ActivityFilter, limit?: number): Promise<readonly ActivityEvent[]>;
}

export interface ApprovalService {
  list(): Promise<readonly ApprovalRequest[]>;
  listPending(): Promise<readonly ApprovalRequest[]>;
  get(id: ApprovalRequestId): Promise<ApprovalRequest | undefined>;
  resolve(
    id: ApprovalRequestId,
    resolution: ApprovalResolution,
    comment?: string,
  ): Promise<CommandResult>;
}

export interface RepositoryService {
  list(): Promise<readonly Repository[]>;
  get(id: RepositoryId): Promise<Repository | undefined>;
  listPullRequests(repositoryId?: RepositoryId): Promise<readonly PullRequest[]>;
  listPipelineRuns(repositoryId?: RepositoryId): Promise<readonly PipelineRun[]>;
}

export interface MetricsService {
  summary(): Promise<FleetSummary>;
  health(): Promise<SystemHealth>;
  series(): Promise<readonly MetricSeries[]>;
}

/**
 * Push channel. The mock reports a synthetic "connected" state and notifies
 * subscribers whenever local state changes, which is the same shape a real
 * WebSocket or SSE client would expose.
 */
export type Unsubscribe = () => void;

export interface RealtimeService {
  status(): StreamStatus;
  /** Fires after any state change. Payload is intentionally coarse for v1. */
  subscribe(listener: () => void): Unsubscribe;
}

export interface ServiceRegistry {
  readonly agents: AgentService;
  readonly tasks: TaskService;
  readonly activity: ActivityService;
  readonly approvals: ApprovalService;
  readonly repositories: RepositoryService;
  readonly metrics: MetricsService;
  readonly realtime: RealtimeService;
  /** Identifies which implementation is wired up, shown in Settings. */
  readonly kind: 'mock' | 'rest' | 'websocket' | 'sse';
}
