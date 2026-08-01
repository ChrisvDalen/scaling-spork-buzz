import { ACTIVITY_EVENTS } from '@/data/activity';
import { AGENT_DETAILS, AGENTS } from '@/data/agents';
import { APPROVAL_REQUESTS } from '@/data/approvals';
import { METRIC_SERIES, SYSTEM_HEALTH } from '@/data/health';
import { PIPELINE_RUNS, PULL_REQUESTS, REPOSITORIES } from '@/data/repositories';
import { TASKS } from '@/data/tasks';
import {
  activityEventId,
  logEntryId,
  type ActivityEvent,
  type ActivityEventType,
  type Agent,
  type AgentDetail,
  type AgentId,
  type AgentLog,
  type ApprovalRequest,
  type MetricSeries,
  type PipelineRun,
  type PullRequest,
  type Repository,
  type Severity,
  type SystemHealth,
  type Task,
  type TaskId,
} from '@/types';

/**
 * In-memory state for the mock backend.
 *
 * The console is read-mostly, but operator commands must visibly change
 * something, so state lives here rather than in component state. Every
 * mutation goes through `update`, which bumps a version counter and notifies
 * subscribers; React reads it with `useSyncExternalStore`.
 */
export interface ControlCenterState {
  readonly agents: readonly Agent[];
  readonly agentDetails: Readonly<Record<AgentId, AgentDetail>>;
  readonly tasks: readonly Task[];
  readonly events: readonly ActivityEvent[];
  readonly approvals: readonly ApprovalRequest[];
  readonly repositories: readonly Repository[];
  readonly pullRequests: readonly PullRequest[];
  readonly pipelineRuns: readonly PipelineRun[];
  readonly health: SystemHealth;
  readonly metrics: readonly MetricSeries[];
  /** Incremented on every mutation. Used as the external store snapshot. */
  readonly version: number;
}

let state: ControlCenterState = {
  agents: AGENTS,
  agentDetails: AGENT_DETAILS,
  tasks: TASKS,
  events: ACTIVITY_EVENTS,
  approvals: APPROVAL_REQUESTS,
  repositories: REPOSITORIES,
  pullRequests: PULL_REQUESTS,
  pipelineRuns: PIPELINE_RUNS,
  health: SYSTEM_HEALTH,
  metrics: METRIC_SERIES,
  version: 0,
};

const listeners = new Set<() => void>();

export function getState(): ControlCenterState {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(): void {
  for (const listener of listeners) listener();
}

type Mutator = (current: ControlCenterState) => Partial<ControlCenterState>;

export function update(mutate: Mutator): void {
  const patch = mutate(state);
  state = { ...state, ...patch, version: state.version + 1 };
  emit();
}

// ---------------------------------------------------------------------------
// Mutation helpers shared by the service implementations
// ---------------------------------------------------------------------------

let syntheticEventCounter = 0;
let syntheticLogCounter = 0;

export interface AppendEventInput {
  readonly type: ActivityEventType;
  readonly severity: Severity;
  readonly message: string;
  readonly agentId?: AgentId;
  readonly taskId?: TaskId;
  readonly detail?: string;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}

/**
 * Records an operator action on the timeline.
 *
 * Console-originated entries carry `origin: 'console'` so they are
 * distinguishable from events an agent runtime produced. Nothing here
 * fabricates agent activity: only actions a human actually took.
 */
export function buildEvent(input: AppendEventInput): ActivityEvent {
  syntheticEventCounter += 1;
  return {
    id: activityEventId(`evt-op-${syntheticEventCounter.toString().padStart(4, '0')}`),
    type: input.type,
    timestamp: new Date().toISOString(),
    severity: input.severity,
    message: input.message,
    agentId: input.agentId,
    taskId: input.taskId,
    detail: input.detail,
    metadata: { ...input.metadata, origin: 'console' },
  };
}

export function buildLog(
  agentId: AgentId,
  severity: Severity,
  message: string,
  taskId?: TaskId,
): AgentLog {
  syntheticLogCounter += 1;
  return {
    id: logEntryId(`log-op-${syntheticLogCounter.toString().padStart(4, '0')}`),
    agentId,
    taskId,
    timestamp: new Date().toISOString(),
    severity,
    message,
    source: 'console',
  };
}

/**
 * Applies a patch to one agent and mirrors it into the detail record.
 *
 * When a log entry accompanies the patch it also becomes the agent's
 * `lastLogLine`: that field is by definition the most recent line, so leaving
 * the old one in place would show an operator a stale reason next to a status
 * that has already changed.
 */
export function patchAgent(
  current: ControlCenterState,
  id: AgentId,
  patch: Partial<Agent>,
  logEntry?: AgentLog,
): Pick<ControlCenterState, 'agents' | 'agentDetails'> {
  const agents = current.agents.map((agent) =>
    agent.id === id
      ? {
          ...agent,
          ...patch,
          ...(logEntry ? { lastLogLine: logEntry.message } : {}),
          lastActivityAt: new Date().toISOString(),
        }
      : agent,
  );
  const updated = agents.find((agent) => agent.id === id);
  const existingDetail = current.agentDetails[id];
  if (!updated || !existingDetail) {
    return { agents, agentDetails: current.agentDetails };
  }
  const agentDetails: Record<AgentId, AgentDetail> = {
    ...current.agentDetails,
    [id]: {
      ...existingDetail,
      agent: updated,
      logs: logEntry ? [...existingDetail.logs, logEntry] : existingDetail.logs,
    },
  };
  return { agents, agentDetails };
}

export function patchTask(
  current: ControlCenterState,
  id: TaskId,
  patch: Partial<Task>,
): readonly Task[] {
  return current.tasks.map((task) =>
    task.id === id ? { ...task, ...patch, updatedAt: new Date().toISOString() } : task,
  );
}

/** Resets the store to the shipped fixtures. Exposed through Settings. */
export function resetState(): void {
  state = {
    agents: AGENTS,
    agentDetails: AGENT_DETAILS,
    tasks: TASKS,
    events: ACTIVITY_EVENTS,
    approvals: APPROVAL_REQUESTS,
    repositories: REPOSITORIES,
    pullRequests: PULL_REQUESTS,
    pipelineRuns: PIPELINE_RUNS,
    health: SYSTEM_HEALTH,
    metrics: METRIC_SERIES,
    version: state.version + 1,
  };
  emit();
}
