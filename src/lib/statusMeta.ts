import type {
  ActivityEventType,
  AgentStatus,
  ApprovalStatus,
  HealthState,
  PipelineStatus,
  Priority,
  PullRequestState,
  RiskLevel,
  Severity,
  TaskApprovalStatus,
  TaskStatus,
  TestStatus,
} from '@/types';

/**
 * Presentation metadata for every enum that reaches the screen.
 *
 * Colour is expressed as a small set of semantic tones rather than raw Tailwind
 * classes, so the palette can be retuned in one place and so that a status
 * never picks up an ad-hoc colour in a single component.
 */
export type Tone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'violet'
  | 'amber'
  | 'cyan';

export interface ToneClasses {
  /** Badge: background + text + border. */
  readonly badge: string;
  /** Solid dot / indicator. */
  readonly dot: string;
  /** Text-only emphasis. */
  readonly text: string;
  /** Filled bar segment. */
  readonly bar: string;
  /** Left border accent for rows and cards. */
  readonly accent: string;
}

export const TONE_CLASSES: Readonly<Record<Tone, ToneClasses>> = {
  neutral: {
    badge:
      'bg-surface-100 text-surface-700 border-surface-200 dark:bg-surface-750 dark:text-slate-300 dark:border-surface-700',
    dot: 'bg-slate-400 dark:bg-slate-500',
    text: 'text-slate-600 dark:text-slate-400',
    bar: 'bg-slate-400 dark:bg-slate-500',
    accent: 'border-l-slate-400 dark:border-l-slate-600',
  },
  info: {
    badge:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30',
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    bar: 'bg-blue-500',
    accent: 'border-l-blue-500',
  },
  success: {
    badge:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    bar: 'bg-emerald-500',
    accent: 'border-l-emerald-500',
  },
  warning: {
    badge:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    bar: 'bg-amber-500',
    accent: 'border-l-amber-500',
  },
  danger: {
    badge:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30',
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-300',
    bar: 'bg-red-500',
    accent: 'border-l-red-500',
  },
  violet: {
    badge:
      'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30',
    dot: 'bg-violet-500',
    text: 'text-violet-700 dark:text-violet-300',
    bar: 'bg-violet-500',
    accent: 'border-l-violet-500',
  },
  amber: {
    badge:
      'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/30',
    dot: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-300',
    bar: 'bg-orange-500',
    accent: 'border-l-orange-500',
  },
  cyan: {
    badge:
      'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/30',
    dot: 'bg-cyan-500',
    text: 'text-cyan-700 dark:text-cyan-300',
    bar: 'bg-cyan-500',
    accent: 'border-l-cyan-500',
  },
};

export interface StatusMeta {
  readonly label: string;
  readonly tone: Tone;
  /** Short operator-facing explanation, used in tooltips. */
  readonly description: string;
  /** Whether the indicator should pulse. Reserved for genuinely live states. */
  readonly live?: boolean;
}

export const AGENT_STATUS_META: Readonly<Record<AgentStatus, StatusMeta>> = {
  idle: {
    label: 'Idle',
    tone: 'neutral',
    description: 'Registered and healthy, holding no work.',
  },
  queued: {
    label: 'Queued',
    tone: 'info',
    description: 'Work assigned, waiting for a runner slot.',
  },
  running: {
    label: 'Running',
    tone: 'success',
    description: 'Executing its current task.',
    live: true,
  },
  waiting: {
    label: 'Waiting',
    tone: 'cyan',
    description: 'Suspended on an external signal such as CI or a review.',
  },
  blocked: {
    label: 'Blocked',
    tone: 'violet',
    description: 'Cannot proceed without intervention.',
  },
  approval_required: {
    label: 'Approval required',
    tone: 'amber',
    description: 'Halted at a policy gate, waiting on a human decision.',
  },
  completed: {
    label: 'Completed',
    tone: 'success',
    description: 'Finished its assignment successfully.',
  },
  failed: {
    label: 'Failed',
    tone: 'danger',
    description: 'Terminated with an unrecoverable error.',
  },
  stopped: {
    label: 'Stopped',
    tone: 'neutral',
    description: 'Halted by an operator.',
  },
};

export const TASK_STATUS_META: Readonly<Record<TaskStatus, StatusMeta>> = {
  backlog: { label: 'Backlog', tone: 'neutral', description: 'Not scheduled yet.' },
  queued: { label: 'Queued', tone: 'info', description: 'Scheduled, awaiting an agent.' },
  in_progress: {
    label: 'In progress',
    tone: 'success',
    description: 'An agent is actively working on it.',
    live: true,
  },
  waiting_approval: {
    label: 'Waiting for approval',
    tone: 'amber',
    description: 'Held at a policy gate pending a human decision.',
  },
  blocked: { label: 'Blocked', tone: 'violet', description: 'Stalled on a dependency or failure.' },
  completed: { label: 'Completed', tone: 'success', description: 'Delivered and accepted.' },
  failed: { label: 'Failed', tone: 'danger', description: 'Ended without delivering.' },
};

export const TASK_APPROVAL_META: Readonly<Record<TaskApprovalStatus, StatusMeta>> = {
  not_required: { label: 'Not required', tone: 'neutral', description: 'No policy gate applies.' },
  pending: { label: 'Pending', tone: 'amber', description: 'Awaiting a decision.' },
  approved: { label: 'Approved', tone: 'success', description: 'Cleared by an operator.' },
  rejected: { label: 'Rejected', tone: 'danger', description: 'Declined by an operator.' },
  changes_requested: {
    label: 'Changes requested',
    tone: 'warning',
    description: 'Operator asked for a revision before deciding.',
  },
};

export const APPROVAL_STATUS_META: Readonly<Record<ApprovalStatus, StatusMeta>> = {
  pending: { label: 'Pending', tone: 'amber', description: 'Awaiting a human decision.' },
  approved: { label: 'Approved', tone: 'success', description: 'Granted.' },
  rejected: { label: 'Rejected', tone: 'danger', description: 'Denied.' },
  changes_requested: {
    label: 'Changes requested',
    tone: 'warning',
    description: 'Returned to the agent for revision.',
  },
  expired: { label: 'Expired', tone: 'neutral', description: 'Timed out without a decision.' },
};

export const RISK_META: Readonly<Record<RiskLevel, StatusMeta>> = {
  low: { label: 'Low', tone: 'neutral', description: 'Reversible, limited blast radius.' },
  medium: { label: 'Medium', tone: 'info', description: 'Reversible but visible to others.' },
  high: { label: 'High', tone: 'warning', description: 'Hard to reverse or affects shared state.' },
  critical: {
    label: 'Critical',
    tone: 'danger',
    description: 'Production, secrets, infrastructure, or spend.',
  },
};

export const PRIORITY_META: Readonly<Record<Priority, StatusMeta>> = {
  low: { label: 'Low', tone: 'neutral', description: 'Deferrable.' },
  normal: { label: 'Normal', tone: 'info', description: 'Standard queue position.' },
  high: { label: 'High', tone: 'warning', description: 'Ahead of normal work.' },
  urgent: { label: 'Urgent', tone: 'danger', description: 'Pre-empts other work.' },
};

export const SEVERITY_META: Readonly<Record<Severity, StatusMeta>> = {
  debug: { label: 'Debug', tone: 'neutral', description: 'Diagnostic detail.' },
  info: { label: 'Info', tone: 'info', description: 'Normal operation.' },
  notice: { label: 'Notice', tone: 'cyan', description: 'Noteworthy but not a problem.' },
  warning: { label: 'Warning', tone: 'warning', description: 'Needs attention soon.' },
  error: { label: 'Error', tone: 'danger', description: 'Operation failed.' },
  critical: { label: 'Critical', tone: 'danger', description: 'Immediate attention required.' },
};

export const PIPELINE_STATUS_META: Readonly<Record<PipelineStatus, StatusMeta>> = {
  queued: { label: 'Queued', tone: 'neutral', description: 'Waiting for a runner.' },
  running: { label: 'Running', tone: 'info', description: 'In progress.', live: true },
  succeeded: { label: 'Succeeded', tone: 'success', description: 'All stages passed.' },
  failed: { label: 'Failed', tone: 'danger', description: 'At least one stage failed.' },
  cancelled: { label: 'Cancelled', tone: 'neutral', description: 'Stopped before finishing.' },
};

export const PR_STATE_META: Readonly<Record<PullRequestState, StatusMeta>> = {
  draft: { label: 'Draft', tone: 'neutral', description: 'Not ready for review.' },
  open: { label: 'Open', tone: 'info', description: 'Awaiting review.' },
  approved: { label: 'Approved', tone: 'success', description: 'Approved, merge is gated.' },
  changes_requested: {
    label: 'Changes requested',
    tone: 'warning',
    description: 'A reviewer asked for changes.',
  },
  merged: { label: 'Merged', tone: 'violet', description: 'Merged into the target branch.' },
  closed: { label: 'Closed', tone: 'neutral', description: 'Closed without merging.' },
};

export const TEST_STATUS_META: Readonly<Record<TestStatus, StatusMeta>> = {
  passing: { label: 'Passing', tone: 'success', description: 'Last run was green.' },
  failing: { label: 'Failing', tone: 'danger', description: 'Last run had failures.' },
  flaky: { label: 'Flaky', tone: 'warning', description: 'Inconsistent results across runs.' },
  not_run: { label: 'Not run', tone: 'neutral', description: 'No recent run recorded.' },
};

export const HEALTH_STATE_META: Readonly<Record<HealthState, StatusMeta>> = {
  operational: { label: 'Operational', tone: 'success', description: 'Responding normally.' },
  degraded: { label: 'Degraded', tone: 'warning', description: 'Elevated latency or errors.' },
  outage: { label: 'Outage', tone: 'danger', description: 'Unavailable.' },
  unknown: { label: 'Unknown', tone: 'neutral', description: 'No recent probe result.' },
};

/** Grouping and tone for the activity timeline. */
export const ACTIVITY_EVENT_META: Readonly<
  Record<ActivityEventType, { readonly label: string; readonly tone: Tone; readonly group: string }>
> = {
  agent_started: { label: 'Agent started', tone: 'info', group: 'Agent' },
  agent_stopped: { label: 'Agent stopped', tone: 'neutral', group: 'Agent' },
  agent_blocked: { label: 'Agent blocked', tone: 'violet', group: 'Agent' },
  task_assigned: { label: 'Task assigned', tone: 'info', group: 'Task' },
  task_started: { label: 'Task started', tone: 'info', group: 'Task' },
  task_completed: { label: 'Task completed', tone: 'success', group: 'Task' },
  task_failed: { label: 'Task failed', tone: 'danger', group: 'Task' },
  repository_cloned: { label: 'Repository cloned', tone: 'neutral', group: 'Repository' },
  branch_created: { label: 'Branch created', tone: 'neutral', group: 'Repository' },
  file_changed: { label: 'File changed', tone: 'neutral', group: 'Repository' },
  command_executed: { label: 'Command executed', tone: 'neutral', group: 'Execution' },
  test_run: { label: 'Test run', tone: 'info', group: 'Quality' },
  test_failed: { label: 'Test failed', tone: 'danger', group: 'Quality' },
  commit_created: { label: 'Commit created', tone: 'success', group: 'Repository' },
  pull_request_opened: { label: 'Pull request opened', tone: 'success', group: 'Review' },
  review_requested: { label: 'Review requested', tone: 'info', group: 'Review' },
  review_submitted: { label: 'Review submitted', tone: 'success', group: 'Review' },
  pipeline_started: { label: 'Pipeline started', tone: 'info', group: 'CI/CD' },
  pipeline_succeeded: { label: 'Pipeline succeeded', tone: 'success', group: 'CI/CD' },
  pipeline_failed: { label: 'Pipeline failed', tone: 'danger', group: 'CI/CD' },
  approval_requested: { label: 'Approval requested', tone: 'amber', group: 'Governance' },
  approval_granted: { label: 'Approval granted', tone: 'success', group: 'Governance' },
  approval_rejected: { label: 'Approval rejected', tone: 'danger', group: 'Governance' },
  policy_violation_blocked: {
    label: 'Policy violation blocked',
    tone: 'danger',
    group: 'Governance',
  },
};

/** Statuses that mean "this agent is doing work right now". */
export const ACTIVE_AGENT_STATUSES: readonly AgentStatus[] = ['running', 'queued'];

/** Statuses that mean "an operator needs to look at this". */
export const ATTENTION_AGENT_STATUSES: readonly AgentStatus[] = [
  'blocked',
  'approval_required',
  'failed',
];
