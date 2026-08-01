import { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { formatCompact, formatRelativeTime, formatTimestampFull, humanize } from '@/lib/format';
import {
  PRIORITY_META,
  TASK_APPROVAL_META,
  TASK_STATUS_META,
  APPROVAL_STATUS_META,
  RISK_META,
} from '@/lib/statusMeta';
import { Button, ProgressBar } from '@/components/ui/Controls';
import { Drawer, DrawerSection } from '@/components/ui/Drawer';
import { EmptyState, KeyValueGrid } from '@/components/ui/Panel';
import { Chip, StatusBadge } from '@/components/ui/StatusBadge';
import { IconExternal, IconReassign, IconRetry } from '@/components/ui/Icon';
import { useControlCenter } from '@/state/ControlCenterContext';
import type { TaskId } from '@/types';

export function TaskDetailDrawer({
  taskId,
  onClose,
  onOpenAgent,
  now,
}: {
  readonly taskId: TaskId | null;
  readonly onClose: () => void;
  readonly onOpenAgent: (id: string) => void;
  readonly now: number;
}) {
  const { data, retryTask, reassignTask } = useControlCenter();

  const task = useMemo(
    () => (taskId ? data.tasks.find((candidate) => candidate.id === taskId) : undefined),
    [data.tasks, taskId],
  );

  const approvals = useMemo(
    () => (taskId ? data.approvals.filter((request) => request.taskId === taskId) : []),
    [data.approvals, taskId],
  );

  const events = useMemo(
    () =>
      taskId ? data.events.filter((candidate) => candidate.taskId === taskId).slice(0, 25) : [],
    [data.events, taskId],
  );

  if (!taskId || !task) return null;

  const agent = task.assignedAgentId
    ? data.agents.find((candidate) => candidate.id === task.assignedAgentId)
    : undefined;
  const repository = data.repositories.find((candidate) => candidate.id === task.repositoryId);
  const statusMeta = TASK_STATUS_META[task.status];

  return (
    <Drawer
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <span className="font-mono text-2xs text-slate-500 dark:text-slate-500">
            {task.issueKey ?? task.id}
          </span>
          <span>{task.title}</span>
        </span>
      }
      subtitle={
        <span className="flex items-center gap-2">
          <StatusBadge meta={statusMeta} />
          <Chip tone={PRIORITY_META[task.priority].tone}>
            {PRIORITY_META[task.priority].label} priority
          </Chip>
          <StatusBadge meta={TASK_APPROVAL_META[task.approvalStatus]} showDot={false} />
        </span>
      }
      footer={
        <div className="flex flex-wrap items-center gap-1.5">
          <Button icon={<IconRetry />} onClick={() => void retryTask(task.id)}>
            Retry task
          </Button>
          <Button icon={<IconReassign />} onClick={() => void reassignTask(task.id, null)}>
            Return to backlog
          </Button>
          {agent && (
            <Button onClick={() => onOpenAgent(agent.id)}>Open {agent.name}</Button>
          )}
          {task.issueUrl && (
            <a
              href={task.issueUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-6 items-center gap-1 rounded border border-surface-300 px-2 text-2xs text-blue-700 hover:bg-surface-50 dark:border-surface-700 dark:text-blue-300 dark:hover:bg-surface-800"
            >
              Open issue
              <IconExternal size={11} />
            </a>
          )}
        </div>
      }
    >
      <DrawerSection title="Description">
        <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          {task.description}
        </p>
        {task.labels.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {task.labels.map((label) => (
              <Chip key={label}>{label}</Chip>
            ))}
          </div>
        )}
      </DrawerSection>

      <DrawerSection title="Assignment">
        <KeyValueGrid
          columns={3}
          items={[
            { label: 'Responsible agent', value: agent?.name ?? 'Unassigned' },
            { label: 'Repository', value: repository?.name ?? '—' },
            { label: 'Issue', value: task.issueKey ?? '—' },
            {
              label: 'Created',
              value: (
                <span title={formatTimestampFull(task.createdAt)}>
                  {formatRelativeTime(task.createdAt, now)}
                </span>
              ),
            },
            {
              label: 'Started',
              value: task.startedAt ? formatRelativeTime(task.startedAt, now) : '—',
            },
            {
              label: 'Last update',
              value: (
                <span title={formatTimestampFull(task.updatedAt)}>
                  {formatRelativeTime(task.updatedAt, now)}
                </span>
              ),
            },
            {
              label: 'Deadline',
              value: task.deadline ? (
                <span
                  className={cn(
                    Date.parse(task.deadline) < now &&
                      task.status !== 'completed' &&
                      'text-red-600 dark:text-red-400',
                  )}
                  title={formatTimestampFull(task.deadline)}
                >
                  {formatRelativeTime(task.deadline, now)}
                </span>
              ) : (
                '—'
              ),
            },
            {
              label: 'Dependencies',
              value:
                task.dependsOn.length > 0 ? (
                  <span className="font-mono text-2xs">{task.dependsOn.join(', ')}</span>
                ) : (
                  'None'
                ),
            },
            {
              label: 'Estimated tokens',
              value: task.estimatedTokens ? formatCompact(task.estimatedTokens) : '—',
            },
          ]}
        />
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-2xs text-slate-500 dark:text-slate-500">
            <span>Progress</span>
            <span className="tabular">{task.progress}%</span>
          </div>
          <ProgressBar value={task.progress} />
        </div>
      </DrawerSection>

      {task.result && (
        <DrawerSection title="Result">
          <p
            className={cn(
              'rounded border p-2 text-xs leading-relaxed',
              task.status === 'failed' || task.status === 'blocked'
                ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
                : 'border-surface-200 bg-surface-50 text-slate-700 dark:border-surface-700 dark:bg-surface-800 dark:text-slate-300',
            )}
          >
            {task.result}
          </p>
        </DrawerSection>
      )}

      <DrawerSection title={`Subtasks (${task.subtasks.length})`}>
        {task.subtasks.length === 0 ? (
          <EmptyState title="No subtasks defined." className="py-4" />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Subtask</th>
                <th scope="col">Status</th>
                <th scope="col" className="text-right">
                  Started
                </th>
                <th scope="col" className="text-right">
                  Finished
                </th>
              </tr>
            </thead>
            <tbody>
              {task.subtasks.map((subtask) => (
                <tr key={subtask.id}>
                  <td className="text-slate-700 dark:text-slate-300">{subtask.title}</td>
                  <td>
                    <Chip
                      tone={
                        subtask.status === 'done'
                          ? 'success'
                          : subtask.status === 'failed'
                            ? 'danger'
                            : subtask.status === 'in_progress'
                              ? 'info'
                              : 'neutral'
                      }
                    >
                      {humanize(subtask.status)}
                    </Chip>
                  </td>
                  <td className="tabular text-right text-slate-500 dark:text-slate-500">
                    {subtask.startedAt ? formatRelativeTime(subtask.startedAt, now) : '—'}
                  </td>
                  <td className="tabular text-right text-slate-500 dark:text-slate-500">
                    {subtask.finishedAt ? formatRelativeTime(subtask.finishedAt, now) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DrawerSection>

      {approvals.length > 0 && (
        <DrawerSection title={`Approvals (${approvals.length})`}>
          <ul className="space-y-1.5">
            {approvals.map((request) => (
              <li
                key={request.id}
                className="flex items-center gap-2 rounded border border-surface-200 px-2 py-1.5 dark:border-surface-700"
              >
                <span className="font-mono text-2xs text-slate-500 dark:text-slate-500">
                  {request.id}
                </span>
                <span className="min-w-0 flex-1 truncate text-2xs text-slate-700 dark:text-slate-300">
                  {request.title}
                </span>
                <StatusBadge meta={RISK_META[request.risk]} showDot={false} />
                <StatusBadge meta={APPROVAL_STATUS_META[request.status]} />
              </li>
            ))}
          </ul>
        </DrawerSection>
      )}

      <DrawerSection title="Recent events">
        {events.length === 0 ? (
          <EmptyState title="No events recorded for this task." className="py-4" />
        ) : (
          <ul className="space-y-1">
            {events.map((entry) => (
              <li key={entry.id} className="flex gap-2 text-2xs">
                <span className="tabular w-14 shrink-0 text-slate-400 dark:text-slate-600">
                  {formatRelativeTime(entry.timestamp, now)}
                </span>
                <span className="flex-1 text-slate-600 dark:text-slate-400">{entry.message}</span>
              </li>
            ))}
          </ul>
        )}
      </DrawerSection>
    </Drawer>
  );
}
