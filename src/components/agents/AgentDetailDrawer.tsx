import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import {
  formatBytes,
  formatCompact,
  formatCurrency,
  formatDuration,
  formatElapsed,
  formatLogTime,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  formatTimestampFull,
  humanize,
} from '@/lib/format';
import {
  AGENT_STATUS_META,
  APPROVAL_STATUS_META,
  RISK_META,
  SEVERITY_META,
  TONE_CLASSES,
} from '@/lib/statusMeta';
import { Button, ProgressBar } from '@/components/ui/Controls';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Drawer, DrawerSection } from '@/components/ui/Drawer';
import { EmptyState, KeyValueGrid } from '@/components/ui/Panel';
import { Chip, StatusBadge } from '@/components/ui/StatusBadge';
import {
  IconCheck,
  IconExternal,
  IconLogs,
  IconPause,
  IconPlay,
  IconReassign,
  IconReject,
  IconRetry,
  IconStop,
} from '@/components/ui/Icon';
import { useControlCenter } from '@/state/ControlCenterContext';
import type { AgentDetail, AgentId, Task } from '@/types';

const TABS = [
  'overview',
  'prompt',
  'logs',
  'files',
  'commands',
  'history',
  'artifacts',
] as const;
type TabId = (typeof TABS)[number];

const TAB_LABELS: Record<TabId, string> = {
  overview: 'Overview',
  prompt: 'Prompt & capabilities',
  logs: 'Live logs',
  files: 'Changed files',
  commands: 'Commands',
  history: 'History',
  artifacts: 'Artifacts',
};

export function AgentDetailDrawer({
  agentId,
  onClose,
  now,
}: {
  readonly agentId: AgentId | null;
  readonly onClose: () => void;
  readonly now: number;
}) {
  if (!agentId) return null;

  return <AgentDetailContent key={agentId} agentId={agentId} onClose={onClose} now={now} />;
}

function AgentDetailContent({
  agentId,
  onClose,
  now,
}: {
  readonly agentId: AgentId;
  readonly onClose: () => void;
  readonly now: number;
}) {
  const { data, sendAgentCommand, resolveApproval } = useControlCenter();
  const [tab, setTab] = useState<TabId>('overview');
  const detail: AgentDetail | undefined = data.agentDetails[agentId];

  const task: Task | undefined = useMemo(() => {
    if (!detail?.agent.currentTaskId) return undefined;
    return data.tasks.find((candidate) => candidate.id === detail.agent.currentTaskId);
  }, [data.tasks, detail]);

  const approvals = useMemo(
    () => data.approvals.filter((request) => request.agentId === agentId),
    [data.approvals, agentId],
  );

  const repository = detail?.agent.repositoryId
    ? data.repositories.find((candidate) => candidate.id === detail.agent.repositoryId)
    : undefined;

  if (!detail) return null;

  const { agent } = detail;
  const statusMeta = AGENT_STATUS_META[agent.status];
  const pendingApprovals = approvals.filter((request) => request.status === 'pending');

  return (
    <Drawer
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <span className="font-mono">{agent.name}</span>
          <StatusBadge meta={statusMeta} />
        </span>
      }
      subtitle={`${agent.roleLabel} · ${agent.id} · ${agent.host}`}
      footer={
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            icon={<IconPause />}
            onClick={() => void sendAgentCommand(agent.id, 'pause')}
          >
            Pause task
          </Button>
          <Button icon={<IconPlay />} onClick={() => void sendAgentCommand(agent.id, 'resume')}>
            Resume task
          </Button>
          <Button
            variant="danger"
            icon={<IconStop />}
            onClick={() => void sendAgentCommand(agent.id, 'stop')}
          >
            Stop agent
          </Button>
          <Button icon={<IconRetry />} onClick={() => void sendAgentCommand(agent.id, 'retry')}>
            Retry task
          </Button>
          <Button
            icon={<IconReassign />}
            onClick={() => void sendAgentCommand(agent.id, 'reassign')}
          >
            Reassign task
          </Button>
          <Button icon={<IconLogs />} onClick={() => setTab('logs')}>
            View logs
          </Button>
          <Button
            icon={<IconCheck />}
            onClick={() => void sendAgentCommand(agent.id, 'review_output')}
          >
            Review output
          </Button>
        </div>
      }
    >
      <nav
        className="sticky top-0 z-10 flex gap-0.5 overflow-x-auto border-b border-surface-200 bg-white px-3 dark:border-surface-700 dark:bg-surface-850"
        role="tablist"
      >
        {TABS.map((candidate) => (
          <button
            key={candidate}
            type="button"
            role="tab"
            aria-selected={tab === candidate}
            onClick={() => setTab(candidate)}
            className={cn(
              'whitespace-nowrap border-b-2 px-2.5 py-2 text-2xs font-medium transition-colors',
              tab === candidate
                ? 'border-blue-500 text-slate-900 dark:text-slate-100'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
            )}
          >
            {TAB_LABELS[candidate]}
            {candidate === 'logs' && detail.logs.length > 0 && (
              <span className="ml-1 text-slate-400 dark:text-slate-600">{detail.logs.length}</span>
            )}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <>
          <DrawerSection title="Assignment">
            <KeyValueGrid
              columns={3}
              items={[
                { label: 'Agent id', value: <span className="font-mono">{agent.id}</span> },
                { label: 'Role', value: agent.roleLabel },
                { label: 'Specialization', value: agent.specialization },
                { label: 'Status', value: <StatusBadge meta={statusMeta} /> },
                { label: 'Repository', value: repository?.name ?? '—' },
                {
                  label: 'Branch',
                  value: <span className="font-mono text-2xs">{agent.branch ?? '—'}</span>,
                },
                {
                  label: 'Started',
                  value: (
                    <span title={formatTimestampFull(agent.startedAt)}>
                      {formatRelativeTime(agent.startedAt, now)}
                    </span>
                  ),
                },
                {
                  label: 'Runtime',
                  value: formatElapsed(agent.startedAt, undefined, now),
                },
                {
                  label: 'Last activity',
                  value: (
                    <span title={formatTimestampFull(agent.lastActivityAt)}>
                      {formatRelativeTime(agent.lastActivityAt, now)}
                    </span>
                  ),
                },
                {
                  label: 'Model',
                  value: (
                    <span className="font-mono text-2xs">
                      {agent.model.provider}/{agent.model.model}
                    </span>
                  ),
                },
                { label: 'Temperature', value: agent.model.temperature.toFixed(2) },
                { label: 'Active tool', value: agent.activeTool ?? '—' },
              ]}
            />
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-2xs text-slate-500 dark:text-slate-500">
                <span>Task progress</span>
                <span className="tabular">{formatPercent(agent.progress)}</span>
              </div>
              <ProgressBar value={agent.progress} tone={TONE_CLASSES[statusMeta.tone].bar} />
            </div>
          </DrawerSection>

          {agent.blocker && (
            <DrawerSection title="Blocker">
              <div className={cn('rounded border p-2 text-xs', TONE_CLASSES.violet.badge)}>
                <div className="font-medium">{humanize(agent.blocker.kind)}</div>
                <p className="mt-1 leading-relaxed">{agent.blocker.reason}</p>
                <div className="mt-1.5 flex items-center gap-2 text-2xs opacity-80">
                  <span>Since {formatRelativeTime(agent.blocker.since, now)}</span>
                  {agent.blocker.waitingOn && <span>Waiting on {agent.blocker.waitingOn}</span>}
                </div>
              </div>
            </DrawerSection>
          )}

          <DrawerSection title="Cost and consumption">
            <KeyValueGrid
              columns={4}
              items={[
                { label: 'Input tokens', value: formatNumber(agent.cost.inputTokens) },
                { label: 'Output tokens', value: formatNumber(agent.cost.outputTokens) },
                { label: 'Total tokens', value: formatNumber(agent.cost.totalTokens) },
                {
                  label: 'Estimated cost',
                  value: formatCurrency(agent.cost.estimatedCost, agent.cost.currency),
                },
              ]}
            />
            {agent.cost.budgetLimit !== undefined && (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-2xs text-slate-500 dark:text-slate-500">
                  <span>Budget consumption</span>
                  <span className="tabular">
                    {formatCurrency(agent.cost.estimatedCost, agent.cost.currency)} of{' '}
                    {formatCurrency(agent.cost.budgetLimit, agent.cost.currency)}
                  </span>
                </div>
                <ProgressBar
                  value={(agent.cost.estimatedCost / agent.cost.budgetLimit) * 100}
                  tone={
                    agent.cost.estimatedCost / agent.cost.budgetLimit > 0.85
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                  }
                />
              </div>
            )}
          </DrawerSection>

          {task && (
            <DrawerSection title="Active task">
              <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                {task.issueKey ? `${task.issueKey} — ` : ''}
                {task.title}
              </div>
              <p className="mt-1 text-2xs leading-relaxed text-slate-600 dark:text-slate-400">
                {task.description}
              </p>
              <ul className="mt-2 space-y-1">
                {task.subtasks.map((subtask) => (
                  <li key={subtask.id} className="flex items-center gap-2 text-2xs">
                    <span
                      className={cn(
                        'h-1.5 w-1.5 shrink-0 rounded-full',
                        subtask.status === 'done'
                          ? 'bg-emerald-500'
                          : subtask.status === 'in_progress'
                            ? 'bg-blue-500'
                            : subtask.status === 'failed'
                              ? 'bg-red-500'
                              : 'bg-slate-300 dark:bg-slate-600',
                      )}
                    />
                    <span
                      className={cn(
                        'flex-1',
                        subtask.status === 'done'
                          ? 'text-slate-500 line-through dark:text-slate-500'
                          : 'text-slate-700 dark:text-slate-300',
                      )}
                    >
                      {subtask.title}
                    </span>
                    <span className="font-mono text-slate-400 dark:text-slate-600">
                      {subtask.status}
                    </span>
                  </li>
                ))}
              </ul>
            </DrawerSection>
          )}

          {agent.dependsOn.length > 0 && (
            <DrawerSection title="Dependencies">
              <div className="flex flex-wrap gap-1.5">
                {agent.dependsOn.map((dependency) => {
                  const other = data.agents.find((candidate) => candidate.id === dependency);
                  return (
                    <Chip key={dependency} tone={other ? AGENT_STATUS_META[other.status].tone : undefined}>
                      {other?.name ?? dependency}
                      {other && ` · ${AGENT_STATUS_META[other.status].label}`}
                    </Chip>
                  );
                })}
              </div>
            </DrawerSection>
          )}

          <DrawerSection title={`Approvals (${approvals.length})`}>
            {approvals.length === 0 ? (
              <EmptyState title="No approval requests from this agent." className="py-4" />
            ) : (
              <ul className="space-y-2">
                {approvals.map((request) => (
                  <li
                    key={request.id}
                    className="rounded border border-surface-200 p-2 dark:border-surface-700"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-2xs text-slate-500 dark:text-slate-500">
                            {request.id}
                          </span>
                          <StatusBadge meta={APPROVAL_STATUS_META[request.status]} />
                          <StatusBadge meta={RISK_META[request.risk]} showDot={false} />
                        </div>
                        <div className="mt-1 text-xs text-slate-800 dark:text-slate-200">
                          {request.title}
                        </div>
                        <p className="mt-0.5 text-2xs text-slate-500 dark:text-slate-500">
                          {request.reason}
                        </p>
                      </div>
                    </div>
                    {request.status === 'pending' && (
                      <div className="mt-2 flex gap-1.5">
                        <Button
                          variant="primary"
                          icon={<IconCheck />}
                          onClick={() => void resolveApproval(request.id, 'approve')}
                        >
                          Approve change
                        </Button>
                        <Button
                          variant="danger"
                          icon={<IconReject />}
                          onClick={() => void resolveApproval(request.id, 'reject')}
                        >
                          Reject change
                        </Button>
                        <Button
                          onClick={() => void resolveApproval(request.id, 'request_changes')}
                        >
                          Request changes
                        </Button>
                      </div>
                    )}
                    {request.decision && (
                      <div className="mt-1.5 text-2xs text-slate-500 dark:text-slate-500">
                        {request.decision.decidedBy} ·{' '}
                        {formatRelativeTime(request.decision.decidedAt, now)}
                        {request.decision.comment ? ` — ${request.decision.comment}` : ''}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </DrawerSection>

          <DrawerSection title={`Errors (${detail.errors.length})`}>
            {detail.errors.length === 0 ? (
              <EmptyState title="No errors recorded." className="py-4" />
            ) : (
              <ul className="space-y-2">
                {detail.errors.map((error) => (
                  <li
                    key={`${error.code}-${error.occurredAt}`}
                    className="rounded border border-surface-200 p-2 dark:border-surface-700"
                  >
                    <div className="flex items-center gap-2">
                      <StatusBadge meta={SEVERITY_META[error.severity]} />
                      <span className="font-mono text-2xs text-slate-500 dark:text-slate-500">
                        {error.code}
                      </span>
                      <span className="ml-auto text-2xs text-slate-500 dark:text-slate-500">
                        {formatRelativeTime(error.occurredAt, now)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-800 dark:text-slate-200">{error.message}</p>
                    {error.detail && <CodeBlock className="mt-1.5">{error.detail}</CodeBlock>}
                    <div className="mt-1 text-2xs text-slate-500 dark:text-slate-500">
                      {error.retryable ? 'Retryable' : 'Not retryable'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DrawerSection>

          {detail.links.length > 0 && (
            <DrawerSection title="Links">
              <div className="flex flex-wrap gap-1.5">
                {detail.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded border border-surface-200 px-1.5 py-0.5 text-2xs text-blue-700 hover:bg-surface-50 dark:border-surface-700 dark:text-blue-300 dark:hover:bg-surface-800"
                  >
                    {link.label}
                    <IconExternal size={11} />
                  </a>
                ))}
              </div>
            </DrawerSection>
          )}
        </>
      )}

      {tab === 'prompt' && (
        <>
          <DrawerSection title="System prompt">
            <CodeBlock maxHeight="24rem">{detail.systemPrompt}</CodeBlock>
          </DrawerSection>

          <DrawerSection title={`Capabilities (${detail.capabilities.length})`}>
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Capability</th>
                  <th scope="col">Autonomy</th>
                  <th scope="col">Gate</th>
                </tr>
              </thead>
              <tbody>
                {detail.capabilities.map((capability) => (
                  <tr key={capability.kind}>
                    <td className="text-slate-700 dark:text-slate-300">{capability.label}</td>
                    <td>
                      <Chip tone={capability.autonomous ? 'success' : 'amber'}>
                        {capability.autonomous ? 'Autonomous' : 'Requires approval'}
                      </Chip>
                    </td>
                    <td className="font-mono text-2xs text-slate-500 dark:text-slate-500">
                      {capability.gatedBy ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DrawerSection>

          <DrawerSection title={`Allowed tools (${detail.allowedTools.length})`}>
            <ul className="space-y-1.5">
              {detail.allowedTools.map((tool) => (
                <li key={tool.name} className="flex items-start gap-2">
                  <Chip mono className="mt-px">
                    {tool.name}
                  </Chip>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xs text-slate-600 dark:text-slate-400">{tool.description}</p>
                  </div>
                  <span className="shrink-0 text-2xs uppercase tracking-wider text-slate-400 dark:text-slate-600">
                    {tool.category}
                  </span>
                </li>
              ))}
            </ul>
          </DrawerSection>
        </>
      )}

      {tab === 'logs' && (
        <div className="p-3">
          {detail.logs.length === 0 ? (
            <EmptyState title="No log lines for this agent." />
          ) : (
            <div className="scrollbar-thin overflow-auto rounded border border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-900">
              {[...detail.logs]
                .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
                .map((entry) => {
                  const meta = SEVERITY_META[entry.severity];
                  return (
                    <div
                      key={entry.id}
                      className="flex gap-2 border-b border-surface-100 px-2 py-1 font-mono text-2xs last:border-b-0 dark:border-surface-800"
                    >
                      <span className="tabular shrink-0 text-slate-400 dark:text-slate-600">
                        {formatLogTime(entry.timestamp)}
                      </span>
                      <span
                        className={cn(
                          'w-14 shrink-0 uppercase',
                          TONE_CLASSES[meta.tone].text,
                        )}
                      >
                        {entry.severity}
                      </span>
                      <span className="w-24 shrink-0 truncate text-slate-500 dark:text-slate-500">
                        {entry.source}
                      </span>
                      <span className="flex-1 text-slate-700 dark:text-slate-300">
                        {entry.message}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {tab === 'files' && (
        <div className="p-3">
          {detail.changedFiles.length === 0 ? (
            <EmptyState title="This agent has not modified any files." />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Path</th>
                  <th scope="col">Change</th>
                  <th scope="col" className="text-right">
                    Added
                  </th>
                  <th scope="col" className="text-right">
                    Removed
                  </th>
                  <th scope="col" className="text-right">
                    Modified
                  </th>
                </tr>
              </thead>
              <tbody>
                {detail.changedFiles.map((file) => (
                  <tr key={file.path}>
                    <td className="max-w-[26rem] truncate font-mono text-2xs text-slate-700 dark:text-slate-300">
                      {file.path}
                    </td>
                    <td>
                      <Chip
                        tone={
                          file.changeType === 'added'
                            ? 'success'
                            : file.changeType === 'deleted'
                              ? 'danger'
                              : 'info'
                        }
                      >
                        {file.changeType}
                      </Chip>
                    </td>
                    <td className="tabular text-right text-emerald-600 dark:text-emerald-400">
                      +{formatNumber(file.linesAdded)}
                    </td>
                    <td className="tabular text-right text-red-600 dark:text-red-400">
                      -{formatNumber(file.linesRemoved)}
                    </td>
                    <td className="tabular text-right text-slate-500 dark:text-slate-500">
                      {formatRelativeTime(file.lastModifiedAt, now)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'commands' && (
        <div className="p-3">
          {detail.toolExecutions.length === 0 ? (
            <EmptyState title="No commands executed." />
          ) : (
            <ul className="space-y-2">
              {detail.toolExecutions.map((execution) => (
                <li
                  key={execution.id}
                  className="rounded border border-surface-200 p-2 dark:border-surface-700"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Chip mono>{execution.tool}</Chip>
                    <Chip
                      tone={
                        execution.status === 'succeeded'
                          ? 'success'
                          : execution.status === 'failed'
                            ? 'danger'
                            : execution.status === 'running'
                              ? 'info'
                              : 'neutral'
                      }
                    >
                      {execution.status}
                    </Chip>
                    {execution.exitCode !== undefined && (
                      <span className="font-mono text-2xs text-slate-500 dark:text-slate-500">
                        exit {execution.exitCode}
                      </span>
                    )}
                    <span className="ml-auto text-2xs text-slate-500 dark:text-slate-500">
                      {formatRelativeTime(execution.startedAt, now)}
                      {execution.durationMs !== undefined
                        ? ` · ${formatDuration(execution.durationMs)}`
                        : ' · running'}
                    </span>
                  </div>
                  <CodeBlock className="mt-1.5" maxHeight="8rem">
                    {execution.command}
                  </CodeBlock>
                  {execution.output && (
                    <CodeBlock className="mt-1" maxHeight="8rem">
                      {execution.output}
                    </CodeBlock>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="p-3">
          {detail.executionHistory.length === 0 ? (
            <EmptyState title="No execution history." />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Task</th>
                  <th scope="col">Outcome</th>
                  <th scope="col">Duration</th>
                  <th scope="col" className="text-right">
                    Tokens
                  </th>
                </tr>
              </thead>
              <tbody>
                {detail.executionHistory.map((entry) => (
                  <tr key={`${entry.taskId}-${entry.startedAt}`}>
                    <td className="max-w-[24rem]">
                      <div className="truncate text-xs text-slate-800 dark:text-slate-200">
                        {entry.title}
                      </div>
                      <div className="truncate text-2xs text-slate-500 dark:text-slate-500">
                        {entry.summary}
                      </div>
                    </td>
                    <td>
                      <Chip
                        tone={
                          entry.outcome === 'succeeded'
                            ? 'success'
                            : entry.outcome === 'failed'
                              ? 'danger'
                              : entry.outcome === 'in_progress'
                                ? 'info'
                                : 'neutral'
                        }
                      >
                        {humanize(entry.outcome)}
                      </Chip>
                    </td>
                    <td className="tabular whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {formatElapsed(entry.startedAt, entry.finishedAt, now)}
                    </td>
                    <td className="tabular text-right text-slate-600 dark:text-slate-400">
                      {formatCompact(entry.tokensUsed)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'artifacts' && (
        <div className="p-3">
          {detail.artifacts.length === 0 ? (
            <EmptyState title="No artifacts produced." />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Artifact</th>
                  <th scope="col">Kind</th>
                  <th scope="col" className="text-right">
                    Size
                  </th>
                  <th scope="col" className="text-right">
                    Created
                  </th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {detail.artifacts.map((artifact) => (
                  <tr key={artifact.id}>
                    <td className="font-mono text-2xs text-slate-700 dark:text-slate-300">
                      {artifact.name}
                    </td>
                    <td>
                      <Chip>{artifact.kind}</Chip>
                    </td>
                    <td className="tabular text-right text-slate-600 dark:text-slate-400">
                      {formatBytes(artifact.sizeBytes)}
                    </td>
                    <td className="tabular text-right text-slate-500 dark:text-slate-500">
                      {formatRelativeTime(artifact.createdAt, now)}
                    </td>
                    <td className="text-right">
                      <a
                        href={artifact.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-2xs text-blue-700 dark:text-blue-300"
                      >
                        Open
                        <IconExternal size={11} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {pendingApprovals.length > 0 && tab !== 'overview' && (
        <div className="border-t border-amber-300 bg-amber-50 px-4 py-2 text-2xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          {pendingApprovals.length} pending approval
          {pendingApprovals.length === 1 ? '' : 's'} for this agent. Decide them on the Overview tab
          or in the Approval Center.
        </div>
      )}
    </Drawer>
  );
}
