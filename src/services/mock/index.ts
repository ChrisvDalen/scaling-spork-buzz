import { TIME_WINDOW_MS, SEVERITY_ORDER } from '@/types';
import type {
  ActivityEvent,
  ActivityFilter,
  Agent,
  AgentCommand,
  AgentId,
  AgentLog,
  AgentStatus,
  ApprovalRequest,
  ApprovalRequestId,
  ApprovalResolution,
  FleetSummary,
  MetricSeries,
  PipelineRun,
  PullRequest,
  RepositoryId,
  StreamStatus,
  SystemHealth,
  Task,
  TaskStatus,
} from '@/types';
import type {
  ActivityService,
  AgentService,
  ApprovalService,
  CommandResult,
  MetricsService,
  RealtimeService,
  RepositoryService,
  ServiceRegistry,
  TaskService,
} from '../types';
import {
  buildEvent,
  buildLog,
  getState,
  patchAgent,
  patchTask,
  subscribe,
  update,
} from './store';

/** Simulates transport latency so loading states are exercised during development. */
const LATENCY_MS = 60;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), LATENCY_MS);
  });
}

// ---------------------------------------------------------------------------
// Command handling
// ---------------------------------------------------------------------------

/**
 * Which agent states each operator command applies to.
 * A command outside this table is refused rather than silently ignored, so the
 * operator always learns why nothing happened.
 */
const COMMAND_PRECONDITIONS: Readonly<Record<AgentCommand, readonly AgentStatus[]>> = {
  pause: ['running', 'queued'],
  resume: ['waiting', 'blocked', 'stopped', 'approval_required'],
  stop: ['running', 'queued', 'waiting', 'blocked', 'approval_required'],
  retry: ['failed', 'stopped', 'completed'],
  reassign: ['failed', 'stopped', 'blocked', 'queued', 'waiting'],
  review_output: [
    'running',
    'waiting',
    'blocked',
    'approval_required',
    'completed',
    'failed',
    'stopped',
    'queued',
    'idle',
  ],
};

const COMMAND_RESULT_STATUS: Readonly<Record<AgentCommand, AgentStatus | null>> = {
  pause: 'waiting',
  resume: 'running',
  stop: 'stopped',
  retry: 'queued',
  reassign: 'idle',
  review_output: null,
};

const COMMAND_LABELS: Readonly<Record<AgentCommand, string>> = {
  pause: 'paused',
  resume: 'resumed',
  stop: 'stopped',
  retry: 'queued for retry',
  reassign: 'released for reassignment',
  review_output: 'flagged for output review',
};

function agentById(id: AgentId): Agent | undefined {
  return getState().agents.find((agent) => agent.id === id);
}

/**
 * Refuses commands that would let an agent past a policy gate.
 *
 * `resume` on an agent held at `approval_required` is the case that matters:
 * the only legitimate way out of that state is a decision in the Approval
 * Center, not a nudge from the agent screen.
 */
function policyRefusal(agent: Agent, command: AgentCommand): string | null {
  if (command === 'resume' && agent.status === 'approval_required') {
    const gate = agent.blocker?.waitingOn ?? 'the pending request';
    return `${agent.name} is held at a policy gate. Decide ${gate} in the Approval Center; resuming here would bypass the gate.`;
  }
  if (command === 'resume' && agent.status === 'blocked' && agent.blocker?.kind === 'approval') {
    const gate = agent.blocker.waitingOn ?? 'the pending request';
    return `${agent.name} is waiting on ${gate}. Resolve it in the Approval Center first.`;
  }
  return null;
}

const agentService: AgentService = {
  list: () => delay(getState().agents),
  get: (id) => delay(agentById(id)),
  getDetail: (id) => delay(getState().agentDetails[id]),
  getLogs: (id, limit = 200) => {
    const detail = getState().agentDetails[id];
    const logs: readonly AgentLog[] = detail ? detail.logs.slice(-limit) : [];
    return delay(logs);
  },
  sendCommand: (id, command) => {
    const agent = agentById(id);
    if (!agent) {
      return delay<CommandResult>({ ok: false, message: `Unknown agent ${id}.` });
    }

    const refusal = policyRefusal(agent, command);
    if (refusal) {
      return delay<CommandResult>({ ok: false, message: refusal });
    }

    const allowed = COMMAND_PRECONDITIONS[command];
    if (!allowed.includes(agent.status)) {
      return delay<CommandResult>({
        ok: false,
        message: `Cannot ${command} ${agent.name} while it is ${agent.status.replace('_', ' ')}.`,
      });
    }

    if (command === 'review_output') {
      update((current) => ({
        events: [
          buildEvent({
            type: 'review_requested',
            severity: 'info',
            message: `Output review requested for ${agent.name}`,
            agentId: id,
            taskId: agent.currentTaskId,
          }),
          ...current.events,
        ],
      }));
      return delay<CommandResult>({
        ok: true,
        message: `Output review requested for ${agent.name}.`,
      });
    }

    const nextStatus = COMMAND_RESULT_STATUS[command];
    update((current) => {
      const patch: Partial<Agent> = {
        ...(nextStatus ? { status: nextStatus } : {}),
        ...(command === 'reassign'
          ? {
              currentTaskId: undefined,
              currentTaskTitle: undefined,
              progress: 0,
              blocker: undefined,
            }
          : {}),
        ...(command === 'resume' || command === 'retry' ? { blocker: undefined } : {}),
      };

      const logEntry = buildLog(
        id,
        command === 'stop' ? 'warning' : 'notice',
        `Operator command "${command}": agent ${COMMAND_LABELS[command]}.`,
        agent.currentTaskId,
      );

      const agentPatch = patchAgent(current, id, patch, logEntry);

      let tasks = current.tasks;
      if (agent.currentTaskId) {
        if (command === 'reassign') {
          tasks = patchTask(current, agent.currentTaskId, {
            status: 'queued',
            assignedAgentId: undefined,
          });
        } else if (command === 'retry') {
          tasks = patchTask(current, agent.currentTaskId, { status: 'queued' });
        } else if (command === 'stop') {
          tasks = patchTask(current, agent.currentTaskId, { status: 'blocked' });
        } else if (command === 'resume') {
          tasks = patchTask(current, agent.currentTaskId, { status: 'in_progress' });
        }
      }

      return {
        ...agentPatch,
        tasks,
        events: [
          buildEvent({
            type:
              command === 'stop'
                ? 'agent_stopped'
                : command === 'retry'
                  ? 'task_started'
                  : command === 'reassign'
                    ? 'task_assigned'
                    : 'agent_started',
            severity: command === 'stop' ? 'warning' : 'notice',
            message: `${agent.name} ${COMMAND_LABELS[command]} by operator`,
            agentId: id,
            taskId: agent.currentTaskId,
          }),
          ...current.events,
        ],
      };
    });

    return delay<CommandResult>({
      ok: true,
      message: `${agent.name} ${COMMAND_LABELS[command]}.`,
    });
  },
};

const taskService: TaskService = {
  list: () => delay(getState().tasks),
  get: (id) => delay(getState().tasks.find((task) => task.id === id)),
  listByStatus: (status: TaskStatus) =>
    delay(getState().tasks.filter((task) => task.status === status)),
  reassign: (id, agentId) => {
    const task = getState().tasks.find((candidate) => candidate.id === id);
    if (!task) return delay<CommandResult>({ ok: false, message: `Unknown task ${id}.` });
    update((current) => ({
      tasks: patchTask(current, id, {
        assignedAgentId: agentId ?? undefined,
        status: agentId ? 'queued' : 'backlog',
      }),
      events: [
        buildEvent({
          type: 'task_assigned',
          severity: 'notice',
          message: agentId
            ? `${task.issueKey ?? task.id} reassigned to ${agentId}`
            : `${task.issueKey ?? task.id} returned to the backlog`,
          taskId: id,
          agentId: agentId ?? undefined,
        }),
        ...current.events,
      ],
    }));
    return delay<CommandResult>({
      ok: true,
      message: agentId ? `Task reassigned to ${agentId}.` : 'Task returned to the backlog.',
    });
  },
  retry: (id) => {
    const task = getState().tasks.find((candidate) => candidate.id === id);
    if (!task) return delay<CommandResult>({ ok: false, message: `Unknown task ${id}.` });
    if (task.status !== 'failed' && task.status !== 'blocked') {
      return delay<CommandResult>({
        ok: false,
        message: `Only failed or blocked tasks can be retried; ${task.id} is ${task.status}.`,
      });
    }
    update((current) => ({
      tasks: patchTask(current, id, { status: 'queued', result: undefined }),
      events: [
        buildEvent({
          type: 'task_started',
          severity: 'notice',
          message: `${task.issueKey ?? task.id} queued for retry by operator`,
          taskId: id,
          agentId: task.assignedAgentId,
        }),
        ...current.events,
      ],
    }));
    return delay<CommandResult>({ ok: true, message: `${task.title} queued for retry.` });
  },
};

function matchesFilter(event: ActivityEvent, filter: ActivityFilter, now: number): boolean {
  if (filter.agentIds?.length && (!event.agentId || !filter.agentIds.includes(event.agentId))) {
    return false;
  }
  if (filter.taskIds?.length && (!event.taskId || !filter.taskIds.includes(event.taskId))) {
    return false;
  }
  if (
    filter.repositoryIds?.length &&
    (!event.repositoryId || !filter.repositoryIds.includes(event.repositoryId))
  ) {
    return false;
  }
  if (filter.types?.length && !filter.types.includes(event.type)) {
    return false;
  }
  if (filter.minSeverity) {
    const min = SEVERITY_ORDER.indexOf(filter.minSeverity);
    if (SEVERITY_ORDER.indexOf(event.severity) < min) return false;
  }
  if (filter.window && filter.window !== 'all') {
    const cutoff = now - TIME_WINDOW_MS[filter.window];
    if (Date.parse(event.timestamp) < cutoff) return false;
  }
  if (filter.search) {
    const needle = filter.search.toLowerCase();
    const haystack = `${event.message} ${event.detail ?? ''}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

const activityService: ActivityService = {
  query: (filter, limit = 500) => {
    const now = Date.now();
    const events = getState().events.filter((event) =>
      filter ? matchesFilter(event, filter, now) : true,
    );
    return delay(events.slice(0, limit));
  },
};

const approvalService: ApprovalService = {
  list: () => delay(getState().approvals),
  listPending: () => delay(getState().approvals.filter((request) => request.status === 'pending')),
  get: (id) => delay(getState().approvals.find((request) => request.id === id)),
  resolve: (id: ApprovalRequestId, resolution: ApprovalResolution, comment?: string) => {
    const request = getState().approvals.find((candidate) => candidate.id === id);
    if (!request) {
      return delay<CommandResult>({ ok: false, message: `Unknown approval ${id}.` });
    }
    if (request.status !== 'pending') {
      return delay<CommandResult>({
        ok: false,
        message: `${id} was already ${request.status.replace('_', ' ')}.`,
      });
    }

    const nextStatus =
      resolution === 'approve'
        ? 'approved'
        : resolution === 'reject'
          ? 'rejected'
          : 'changes_requested';

    update((current) => {
      const approvals: readonly ApprovalRequest[] = current.approvals.map((candidate) =>
        candidate.id === id
          ? {
              ...candidate,
              status: nextStatus,
              decision: {
                decidedBy: 'operator',
                decidedAt: new Date().toISOString(),
                comment,
              },
            }
          : candidate,
      );

      // The decision releases (or holds) the requesting agent.
      const agent = current.agents.find((candidate) => candidate.id === request.agentId);
      let agentPatch: Partial<Pick<typeof current, 'agents' | 'agentDetails'>> = {};
      if (agent) {
        const gated = agent.status === 'approval_required' || agent.status === 'blocked';
        if (resolution === 'approve' && gated) {
          agentPatch = patchAgent(
            current,
            agent.id,
            { status: 'running', blocker: undefined },
            buildLog(agent.id, 'notice', `${id} approved by operator; execution resumed.`),
          );
        } else if (resolution !== 'approve' && gated) {
          agentPatch = patchAgent(
            current,
            agent.id,
            {
              status: resolution === 'reject' ? 'stopped' : 'blocked',
              blocker: {
                reason:
                  resolution === 'reject'
                    ? `${id} rejected by operator.`
                    : `${id} returned for changes by operator.`,
                since: new Date().toISOString(),
                kind: 'approval',
                waitingOn: id,
              },
            },
            buildLog(
              agent.id,
              'warning',
              `${id} ${resolution === 'reject' ? 'rejected' : 'returned for changes'} by operator.`,
            ),
          );
        }
      }

      const tasks = request.taskId
        ? patchTask(current, request.taskId, {
            approvalStatus:
              resolution === 'approve'
                ? 'approved'
                : resolution === 'reject'
                  ? 'rejected'
                  : 'changes_requested',
            status:
              resolution === 'approve'
                ? 'in_progress'
                : resolution === 'reject'
                  ? 'blocked'
                  : 'blocked',
          })
        : current.tasks;

      return {
        ...agentPatch,
        approvals,
        tasks,
        events: [
          buildEvent({
            type: resolution === 'approve' ? 'approval_granted' : 'approval_rejected',
            severity: resolution === 'approve' ? 'notice' : 'warning',
            message: `${id} ${nextStatus.replace('_', ' ')}: ${request.title}`,
            agentId: request.agentId,
            taskId: request.taskId,
            detail: comment,
            metadata: { approval: id, rules: request.policyRules.join(', ') },
          }),
          ...current.events,
        ],
      };
    });

    const verb =
      resolution === 'approve' ? 'approved' : resolution === 'reject' ? 'rejected' : 'returned for changes';
    return delay<CommandResult>({ ok: true, message: `${id} ${verb}.` });
  },
};

const repositoryService: RepositoryService = {
  list: () => delay(getState().repositories),
  get: (id) => delay(getState().repositories.find((repository) => repository.id === id)),
  listPullRequests: (repositoryId?: RepositoryId) =>
    delay(
      repositoryId
        ? getState().pullRequests.filter((pr) => pr.repositoryId === repositoryId)
        : getState().pullRequests,
    ),
  listPipelineRuns: (repositoryId?: RepositoryId) =>
    delay(
      repositoryId
        ? getState().pipelineRuns.filter((run) => run.repositoryId === repositoryId)
        : getState().pipelineRuns,
    ),
};

/** Derives the summary strip from current state rather than storing it. */
export function computeSummary(
  agents: readonly Agent[],
  tasks: readonly Task[],
  pullRequests: readonly PullRequest[],
  pipelineRuns: readonly PipelineRun[],
  approvals: readonly ApprovalRequest[],
): FleetSummary {
  const byStatus = (status: AgentStatus) => agents.filter((agent) => agent.status === status).length;

  const totals = agents.reduce(
    (acc, agent) => ({
      inputTokens: acc.inputTokens + agent.cost.inputTokens,
      outputTokens: acc.outputTokens + agent.cost.outputTokens,
      totalTokens: acc.totalTokens + agent.cost.totalTokens,
      estimatedCost: acc.estimatedCost + agent.cost.estimatedCost,
    }),
    { inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCost: 0 },
  );

  return {
    totalAgents: agents.length,
    activeAgents: byStatus('running'),
    waitingAgents: byStatus('waiting') + byStatus('queued'),
    blockedAgents: byStatus('blocked'),
    approvalRequiredAgents: byStatus('approval_required'),
    idleAgents: byStatus('idle'),
    activeTasks: tasks.filter(
      (task) => task.status === 'in_progress' || task.status === 'queued',
    ).length,
    failedTasks: tasks.filter((task) => task.status === 'failed').length,
    openPullRequests: pullRequests.filter(
      (pr) => pr.state === 'open' || pr.state === 'draft' || pr.state === 'changes_requested' || pr.state === 'approved',
    ).length,
    failingPipelines: pipelineRuns.filter((run) => run.status === 'failed').length,
    pendingApprovals: approvals.filter((request) => request.status === 'pending').length,
    tokenUsage: {
      ...totals,
      currency: 'USD',
      estimatedCost: Number(totals.estimatedCost.toFixed(2)),
    },
  };
}

const metricsService: MetricsService = {
  summary: () => {
    const current = getState();
    return delay(
      computeSummary(
        current.agents,
        current.tasks,
        current.pullRequests,
        current.pipelineRuns,
        current.approvals,
      ),
    );
  },
  health: (): Promise<SystemHealth> => delay(getState().health),
  series: (): Promise<readonly MetricSeries[]> => delay(getState().metrics),
};

const realtimeService: RealtimeService = {
  status: (): StreamStatus => getState().health.stream,
  subscribe,
};

export const mockServices: ServiceRegistry = {
  agents: agentService,
  tasks: taskService,
  activity: activityService,
  approvals: approvalService,
  repositories: repositoryService,
  metrics: metricsService,
  realtime: realtimeService,
  kind: 'mock',
};
