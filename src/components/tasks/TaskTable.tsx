import { cn } from '@/lib/cn';
import { formatRelativeTime, formatTimestamp } from '@/lib/format';
import { PRIORITY_META, TASK_APPROVAL_META, TASK_STATUS_META, TONE_CLASSES } from '@/lib/statusMeta';
import { ProgressBar } from '@/components/ui/Controls';
import { EmptyState } from '@/components/ui/Panel';
import { Chip, StatusBadge } from '@/components/ui/StatusBadge';
import type { Agent, AgentId, Repository, RepositoryId, Task, TaskId } from '@/types';

export function TaskTable({
  tasks,
  agents,
  repositories,
  selectedId,
  onSelect,
  now,
}: {
  readonly tasks: readonly Task[];
  readonly agents: ReadonlyMap<AgentId, Agent>;
  readonly repositories: ReadonlyMap<RepositoryId, Repository>;
  readonly selectedId?: TaskId;
  readonly onSelect: (id: TaskId) => void;
  readonly now: number;
}) {
  if (tasks.length === 0) {
    return <EmptyState title="No tasks match the current filter." />;
  }

  return (
    <div className="scrollbar-thin overflow-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Issue</th>
            <th scope="col">Title</th>
            <th scope="col">Status</th>
            <th scope="col">Priority</th>
            <th scope="col">Agent</th>
            <th scope="col">Repository</th>
            <th scope="col">Approval</th>
            <th scope="col" className="w-28">
              Progress
            </th>
            <th scope="col" className="text-right">
              Deadline
            </th>
            <th scope="col" className="text-right">
              Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const agent = task.assignedAgentId ? agents.get(task.assignedAgentId) : undefined;
            const repository = repositories.get(task.repositoryId);
            const statusMeta = TASK_STATUS_META[task.status];
            const overdue =
              task.deadline !== undefined &&
              Date.parse(task.deadline) < now &&
              task.status !== 'completed';
            return (
              <tr
                key={task.id}
                onClick={() => onSelect(task.id)}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(task.id);
                  }
                }}
                className={cn(
                  'cursor-pointer border-l-2',
                  selectedId === task.id
                    ? 'row-selected border-l-blue-500'
                    : 'border-l-transparent',
                )}
              >
                <td className="whitespace-nowrap font-mono text-2xs text-slate-500 dark:text-slate-500">
                  {task.issueKey ?? task.id}
                </td>
                <td className="max-w-[24rem]">
                  <div className="truncate text-xs text-slate-800 dark:text-slate-200">
                    {task.title}
                  </div>
                  {task.dependsOn.length > 0 && (
                    <div className="truncate text-2xs text-slate-500 dark:text-slate-500">
                      depends on {task.dependsOn.join(', ')}
                    </div>
                  )}
                </td>
                <td>
                  <StatusBadge meta={statusMeta} />
                </td>
                <td>
                  <Chip tone={PRIORITY_META[task.priority].tone}>
                    {PRIORITY_META[task.priority].label}
                  </Chip>
                </td>
                <td className="whitespace-nowrap font-mono text-2xs text-slate-600 dark:text-slate-400">
                  {agent?.name ?? '—'}
                </td>
                <td className="whitespace-nowrap text-slate-600 dark:text-slate-400">
                  {repository?.name ?? '—'}
                </td>
                <td>
                  <StatusBadge
                    meta={TASK_APPROVAL_META[task.approvalStatus]}
                    showDot={task.approvalStatus !== 'not_required'}
                  />
                </td>
                <td>
                  <ProgressBar
                    value={task.progress}
                    showLabel
                    tone={TONE_CLASSES[statusMeta.tone].bar}
                  />
                </td>
                <td
                  className={cn(
                    'tabular whitespace-nowrap text-right',
                    overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-500',
                  )}
                >
                  {task.deadline ? formatTimestamp(task.deadline) : '—'}
                </td>
                <td className="tabular whitespace-nowrap text-right text-slate-500 dark:text-slate-500">
                  {formatRelativeTime(task.updatedAt, now)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
