import { cn } from '@/lib/cn';
import {
  formatCompact,
  formatCurrency,
  formatElapsed,
  formatRelativeTime,
  shortenBranch,
} from '@/lib/format';
import { AGENT_STATUS_META, TONE_CLASSES } from '@/lib/statusMeta';
import { ProgressBar } from '@/components/ui/Controls';
import { Chip, StatusBadge } from '@/components/ui/StatusBadge';
import type { Agent, AgentId, Repository, RepositoryId } from '@/types';

export function AgentCard({
  agent,
  repositories,
  selected,
  onSelect,
  now,
}: {
  readonly agent: Agent;
  readonly repositories: ReadonlyMap<RepositoryId, Repository>;
  readonly selected: boolean;
  readonly onSelect: (id: AgentId) => void;
  readonly now: number;
}) {
  const meta = AGENT_STATUS_META[agent.status];
  const tone = TONE_CLASSES[meta.tone];
  const repository = agent.repositoryId ? repositories.get(agent.repositoryId) : undefined;

  return (
    <button
      type="button"
      onClick={() => onSelect(agent.id)}
      className={cn(
        'panel flex flex-col gap-2 border-l-2 p-3 text-left transition-colors',
        tone.accent,
        selected
          ? 'ring-1 ring-blue-500'
          : 'hover:bg-surface-50 dark:hover:bg-surface-800',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">
            {agent.name}
          </div>
          <div className="truncate text-2xs text-slate-500 dark:text-slate-400">
            {agent.roleLabel}
          </div>
        </div>
        <StatusBadge meta={meta} />
      </div>

      <p className="line-clamp-2 min-h-[2rem] text-2xs text-slate-500 dark:text-slate-500">
        {agent.specialization}
      </p>

      <div className="border-t border-surface-100 pt-2 dark:border-surface-800">
        <div className="truncate text-xs text-slate-700 dark:text-slate-300">
          {agent.currentTaskTitle ?? 'No assignment'}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-2xs text-slate-500 dark:text-slate-500">
          {repository && <Chip>{repository.name}</Chip>}
          {agent.branch && <Chip mono>{shortenBranch(agent.branch, 20)}</Chip>}
        </div>
      </div>

      <ProgressBar value={agent.progress} showLabel tone={tone.bar} />

      {agent.blocker && (
        <div
          className={cn(
            'rounded border px-1.5 py-1 text-2xs',
            TONE_CLASSES.violet.badge,
          )}
        >
          <span className="font-medium">Blocked:</span> {agent.blocker.reason}
        </div>
      )}

      <dl className="grid grid-cols-3 gap-2 border-t border-surface-100 pt-2 text-2xs dark:border-surface-800">
        <div>
          <dt className="text-slate-500 dark:text-slate-500">Tokens</dt>
          <dd className="tabular text-slate-700 dark:text-slate-300">
            {formatCompact(agent.cost.totalTokens)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-500">Cost</dt>
          <dd className="tabular text-slate-700 dark:text-slate-300">
            {formatCurrency(agent.cost.estimatedCost, agent.cost.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-500">Runtime</dt>
          <dd className="tabular text-slate-700 dark:text-slate-300">
            {formatElapsed(agent.startedAt, undefined, now)}
          </dd>
        </div>
      </dl>

      <div className="truncate font-mono text-2xs text-slate-400 dark:text-slate-600">
        {formatRelativeTime(agent.lastActivityAt, now)} · {agent.lastLogLine ?? agent.host}
      </div>
    </button>
  );
}
