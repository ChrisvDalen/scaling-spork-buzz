import { cn } from '@/lib/cn';
import { formatCompact, formatCurrency, formatPercent, formatRelativeTime, shortenBranch } from '@/lib/format';
import { AGENT_STATUS_META, TONE_CLASSES } from '@/lib/statusMeta';
import { ProgressBar } from '@/components/ui/Controls';
import { Chip, StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/Panel';
import type { Agent, AgentId, Repository, RepositoryId } from '@/types';

export function AgentTable({
  agents,
  repositories,
  selectedId,
  onSelect,
  now,
  dense = false,
}: {
  readonly agents: readonly Agent[];
  readonly repositories: ReadonlyMap<RepositoryId, Repository>;
  readonly selectedId?: AgentId;
  readonly onSelect: (id: AgentId) => void;
  readonly now: number;
  readonly dense?: boolean;
}) {
  if (agents.length === 0) {
    return <EmptyState title="No agents match the current filter." />;
  }

  return (
    <div className="scrollbar-thin overflow-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Agent</th>
            <th scope="col">Status</th>
            <th scope="col">Current task</th>
            {!dense && (
              <>
                <th scope="col">Repository</th>
                <th scope="col">Branch</th>
              </>
            )}
            <th scope="col" className="w-32">
              Progress
            </th>
            {!dense && (
              <>
                <th scope="col" className="text-right">
                  Tokens
                </th>
                <th scope="col" className="text-right">
                  Cost
                </th>
                <th scope="col">Model</th>
              </>
            )}
            <th scope="col" className="text-right">
              Last activity
            </th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => {
            const meta = AGENT_STATUS_META[agent.status];
            const repository = agent.repositoryId ? repositories.get(agent.repositoryId) : undefined;
            const selected = selectedId === agent.id;
            return (
              <tr
                key={agent.id}
                onClick={() => onSelect(agent.id)}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(agent.id);
                  }
                }}
                className={cn(
                  'cursor-pointer border-l-2',
                  selected ? 'row-selected border-l-blue-500' : 'border-l-transparent',
                )}
              >
                <td>
                  <div className="flex items-center gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-medium text-slate-800 dark:text-slate-100">
                        {agent.name}
                      </div>
                      <div className="truncate text-2xs text-slate-500 dark:text-slate-500">
                        {agent.roleLabel}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex flex-col items-start gap-1">
                    <StatusBadge meta={meta} />
                    {agent.blocker && (
                      <span
                        className={cn('text-2xs', TONE_CLASSES.violet.text)}
                        title={agent.blocker.reason}
                      >
                        {agent.blocker.waitingOn ?? agent.blocker.kind.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </td>
                <td className="max-w-[22rem]">
                  {agent.currentTaskTitle ? (
                    <div className="min-w-0">
                      <div className="truncate text-xs text-slate-700 dark:text-slate-300">
                        {agent.currentTaskTitle}
                      </div>
                      {agent.lastLogLine && (
                        <div className="truncate font-mono text-2xs text-slate-500 dark:text-slate-500">
                          {agent.lastLogLine}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-2xs text-slate-400 dark:text-slate-600">No assignment</span>
                  )}
                </td>
                {!dense && (
                  <>
                    <td className="whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {repository?.name ?? '—'}
                    </td>
                    <td className="whitespace-nowrap font-mono text-2xs text-slate-600 dark:text-slate-400">
                      {shortenBranch(agent.branch, 24)}
                    </td>
                  </>
                )}
                <td>
                  <ProgressBar
                    value={agent.progress}
                    showLabel
                    tone={TONE_CLASSES[meta.tone].bar}
                  />
                </td>
                {!dense && (
                  <>
                    <td className="tabular whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                      {formatCompact(agent.cost.totalTokens)}
                    </td>
                    <td className="tabular whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                      <span title={`Budget ${formatCurrency(agent.cost.budgetLimit, agent.cost.currency)}`}>
                        {formatCurrency(agent.cost.estimatedCost, agent.cost.currency)}
                      </span>
                      {agent.cost.budgetLimit ? (
                        <span className="ml-1 text-2xs text-slate-400 dark:text-slate-600">
                          {formatPercent((agent.cost.estimatedCost / agent.cost.budgetLimit) * 100)}
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <Chip mono>{agent.activeTool ?? agent.model.model}</Chip>
                    </td>
                  </>
                )}
                <td className="tabular whitespace-nowrap text-right text-slate-500 dark:text-slate-500">
                  {formatRelativeTime(agent.lastActivityAt, now)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
