import { cn } from '@/lib/cn';
import { formatRelativeTime, formatTimestamp, formatTimestampFull } from '@/lib/format';
import { ACTIVITY_EVENT_META, SEVERITY_META, TONE_CLASSES } from '@/lib/statusMeta';
import { EmptyState } from '@/components/ui/Panel';
import { Chip, StatusDot } from '@/components/ui/StatusBadge';
import type { ActivityEvent, Agent, AgentId, Repository, RepositoryId } from '@/types';

export function ActivityTimeline({
  events,
  agents,
  repositories,
  now,
  onSelectAgent,
  compact = false,
}: {
  readonly events: readonly ActivityEvent[];
  readonly agents: ReadonlyMap<AgentId, Agent>;
  readonly repositories: ReadonlyMap<RepositoryId, Repository>;
  readonly now: number;
  readonly onSelectAgent?: (id: AgentId) => void;
  readonly compact?: boolean;
}) {
  if (events.length === 0) {
    return <EmptyState title="No events match the current filter." hint="Widen the time window or clear a filter." />;
  }

  return (
    <ol className="divide-y divide-surface-100 dark:divide-surface-800">
      {events.map((entry) => {
        const typeMeta = ACTIVITY_EVENT_META[entry.type];
        const severityMeta = SEVERITY_META[entry.severity];
        const agent = entry.agentId ? agents.get(entry.agentId) : undefined;
        const repository = entry.repositoryId ? repositories.get(entry.repositoryId) : undefined;
        const attention = entry.severity === 'error' || entry.severity === 'critical';

        return (
          <li
            key={entry.id}
            className={cn(
              'flex gap-3 border-l-2 px-3 py-2',
              attention ? TONE_CLASSES.danger.accent : 'border-l-transparent',
            )}
          >
            <div
              className="tabular w-24 shrink-0 whitespace-nowrap pt-0.5 text-2xs text-slate-400 dark:text-slate-600"
              title={formatTimestampFull(entry.timestamp)}
            >
              {compact ? formatRelativeTime(entry.timestamp, now) : formatTimestamp(entry.timestamp)}
            </div>

            <div className="pt-1">
              <StatusDot tone={typeMeta.tone} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-2xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-500">
                  {typeMeta.label}
                </span>
                {entry.severity !== 'info' && (
                  <span className={cn('text-2xs font-medium', TONE_CLASSES[severityMeta.tone].text)}>
                    {severityMeta.label}
                  </span>
                )}
              </div>

              <p className="mt-0.5 text-xs leading-snug text-slate-800 dark:text-slate-200">
                {entry.message}
              </p>

              {entry.detail && (
                <p className="mt-0.5 text-2xs leading-relaxed text-slate-500 dark:text-slate-500">
                  {entry.detail}
                </p>
              )}

              <div className="mt-1 flex flex-wrap items-center gap-1">
                {agent && (
                  <button
                    type="button"
                    onClick={() => onSelectAgent?.(agent.id)}
                    disabled={!onSelectAgent}
                    className="inline-flex items-center rounded border border-surface-200 px-1.5 py-0.5 font-mono text-2xs text-slate-600 hover:bg-surface-50 disabled:cursor-default dark:border-surface-700 dark:text-slate-400 dark:hover:bg-surface-800"
                  >
                    {agent.name}
                  </button>
                )}
                {repository && <Chip>{repository.name}</Chip>}
                {entry.taskId && <Chip mono>{entry.taskId}</Chip>}
                {entry.metadata &&
                  Object.entries(entry.metadata)
                    .filter(([key]) => key !== 'origin')
                    .slice(0, 4)
                    .map(([key, value]) => (
                      <Chip key={key} mono>
                        {key}={String(value)}
                      </Chip>
                    ))}
                {entry.metadata?.origin === 'console' && <Chip tone="info">console</Chip>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
