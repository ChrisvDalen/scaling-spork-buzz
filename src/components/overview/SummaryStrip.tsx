import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { TONE_CLASSES, type Tone } from '@/lib/statusMeta';
import { formatCompact, formatCurrency, formatNumber } from '@/lib/format';
import type { FleetSummary } from '@/types';

interface TileProps {
  readonly label: string;
  readonly value: ReactNode;
  readonly hint?: string;
  readonly tone?: Tone;
  /** Draws attention when the value is non-zero and represents a problem. */
  readonly alert?: boolean;
  readonly onClick?: () => void;
}

export function MetricTile({ label, value, hint, tone = 'neutral', alert, onClick }: TileProps) {
  const toneClasses = TONE_CLASSES[tone];
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={cn(
        'panel flex min-w-0 flex-col justify-between border-l-2 px-3 py-2 text-left',
        alert ? toneClasses.accent : 'border-l-transparent',
        onClick && 'transition-colors hover:bg-surface-50 dark:hover:bg-surface-800',
      )}
    >
      <div className="text-2xs uppercase leading-tight tracking-wider text-slate-500 dark:text-slate-500">
        {label}
      </div>
      <div
        className={cn(
          'tabular mt-1 text-xl font-semibold leading-none',
          alert ? toneClasses.text : 'text-slate-800 dark:text-slate-100',
        )}
      >
        {value}
      </div>
      {hint && (
        <div className="mt-1 truncate text-2xs text-slate-500 dark:text-slate-500">{hint}</div>
      )}
    </Wrapper>
  );
}

export function SummaryStrip({
  summary,
  onSelectView,
}: {
  readonly summary: FleetSummary;
  readonly onSelectView?: (view: 'agents' | 'tasks' | 'approvals' | 'repositories' | 'health') => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      <MetricTile
        label="Agents"
        value={formatNumber(summary.totalAgents)}
        hint={`${summary.idleAgents} idle`}
        onClick={onSelectView ? () => onSelectView('agents') : undefined}
      />
      <MetricTile
        label="Running"
        value={formatNumber(summary.activeAgents)}
        tone="success"
        alert={summary.activeAgents > 0}
        hint="executing now"
        onClick={onSelectView ? () => onSelectView('agents') : undefined}
      />
      <MetricTile
        label="Waiting"
        value={formatNumber(summary.waitingAgents)}
        tone="cyan"
        alert={summary.waitingAgents > 0}
        hint="queued or suspended"
        onClick={onSelectView ? () => onSelectView('agents') : undefined}
      />
      <MetricTile
        label="Blocked"
        value={formatNumber(summary.blockedAgents)}
        tone="violet"
        alert={summary.blockedAgents > 0}
        hint="need intervention"
        onClick={onSelectView ? () => onSelectView('agents') : undefined}
      />
      <MetricTile
        label="Approval required"
        value={formatNumber(summary.approvalRequiredAgents)}
        tone="amber"
        alert={summary.approvalRequiredAgents > 0}
        hint="agents at a gate"
        onClick={onSelectView ? () => onSelectView('approvals') : undefined}
      />
      <MetricTile
        label="Active tasks"
        value={formatNumber(summary.activeTasks)}
        hint="in progress or queued"
        onClick={onSelectView ? () => onSelectView('tasks') : undefined}
      />
      <MetricTile
        label="Failed tasks"
        value={formatNumber(summary.failedTasks)}
        tone="danger"
        alert={summary.failedTasks > 0}
        onClick={onSelectView ? () => onSelectView('tasks') : undefined}
      />
      <MetricTile
        label="Open PRs"
        value={formatNumber(summary.openPullRequests)}
        onClick={onSelectView ? () => onSelectView('repositories') : undefined}
      />
      <MetricTile
        label="Failing pipelines"
        value={formatNumber(summary.failingPipelines)}
        tone="danger"
        alert={summary.failingPipelines > 0}
        onClick={onSelectView ? () => onSelectView('repositories') : undefined}
      />
      <MetricTile
        label="Tokens"
        value={formatCompact(summary.tokenUsage.totalTokens)}
        hint={`${formatCompact(summary.tokenUsage.inputTokens)} in / ${formatCompact(
          summary.tokenUsage.outputTokens,
        )} out`}
        onClick={onSelectView ? () => onSelectView('health') : undefined}
      />
      <MetricTile
        label="Estimated cost"
        value={formatCurrency(summary.tokenUsage.estimatedCost, summary.tokenUsage.currency)}
        hint="current session"
        onClick={onSelectView ? () => onSelectView('health') : undefined}
      />
    </div>
  );
}
