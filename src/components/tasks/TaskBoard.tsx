import { cn } from '@/lib/cn';
import { formatRelativeTime } from '@/lib/format';
import { PRIORITY_META, TASK_STATUS_META, TONE_CLASSES } from '@/lib/statusMeta';
import { ProgressBar } from '@/components/ui/Controls';
import { Chip, StatusDot } from '@/components/ui/StatusBadge';
import { TASK_STATUSES, type Agent, type AgentId, type Task, type TaskId } from '@/types';

/**
 * Operational board.
 *
 * One narrow column per state, rows rather than cards: the point is to see the
 * whole fleet's work at once, not to drag items around. Ordering inside a
 * column is by priority then by last update.
 */
export function TaskBoard({
  tasks,
  agents,
  selectedId,
  onSelect,
  now,
}: {
  readonly tasks: readonly Task[];
  readonly agents: ReadonlyMap<AgentId, Agent>;
  readonly selectedId?: TaskId;
  readonly onSelect: (id: TaskId) => void;
  readonly now: number;
}) {
  const priorityRank: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

  return (
    <div className="scrollbar-thin flex h-full min-h-0 gap-2 overflow-x-auto pb-1">
      {TASK_STATUSES.map((status) => {
        const meta = TASK_STATUS_META[status];
        const column = tasks
          .filter((task) => task.status === status)
          .slice()
          .sort((a, b) => {
            const byPriority =
              (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9);
            if (byPriority !== 0) return byPriority;
            return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
          });

        return (
          <section
            key={status}
            className="panel flex h-full w-64 shrink-0 flex-col"
            aria-label={`${meta.label}, ${column.length} tasks`}
          >
            <header className="flex items-center justify-between gap-2 border-b border-surface-200 px-2.5 py-1.5 dark:border-surface-700">
              <div className="flex items-center gap-1.5">
                <StatusDot tone={meta.tone} live={meta.live} />
                <span className="text-2xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  {meta.label}
                </span>
              </div>
              <span className="tabular text-2xs text-slate-500 dark:text-slate-500">
                {column.length}
              </span>
            </header>

            <div className="scrollbar-thin min-h-0 flex-1 space-y-px overflow-y-auto p-1">
              {column.length === 0 ? (
                <p className="px-1.5 py-3 text-center text-2xs text-slate-400 dark:text-slate-600">
                  Empty
                </p>
              ) : (
                column.map((task) => {
                  const agent = task.assignedAgentId ? agents.get(task.assignedAgentId) : undefined;
                  const selected = selectedId === task.id;
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onSelect(task.id)}
                      className={cn(
                        'w-full rounded border-l-2 px-2 py-1.5 text-left transition-colors',
                        TONE_CLASSES[PRIORITY_META[task.priority].tone].accent,
                        selected
                          ? 'bg-blue-50 dark:bg-blue-500/10'
                          : 'hover:bg-surface-50 dark:hover:bg-surface-800',
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-2xs text-slate-500 dark:text-slate-500">
                          {task.issueKey ?? task.id}
                        </span>
                        {task.priority !== 'normal' && (
                          <Chip tone={PRIORITY_META[task.priority].tone}>
                            {PRIORITY_META[task.priority].label}
                          </Chip>
                        )}
                        {task.approvalStatus === 'pending' && <Chip tone="amber">Gate</Chip>}
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-2xs font-medium leading-snug text-slate-800 dark:text-slate-200">
                        {task.title}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-2xs text-slate-500 dark:text-slate-500">
                        <span className="truncate font-mono">{agent?.name ?? 'unassigned'}</span>
                        <span className="tabular shrink-0">
                          {formatRelativeTime(task.updatedAt, now)}
                        </span>
                      </div>
                      {task.progress > 0 && task.progress < 100 && (
                        <ProgressBar
                          value={task.progress}
                          className="mt-1"
                          tone={TONE_CLASSES[meta.tone].bar}
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
