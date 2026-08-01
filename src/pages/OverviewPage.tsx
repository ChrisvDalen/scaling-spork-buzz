import { useMemo, useState } from 'react';
import { ActivityTimeline } from '@/components/activity/ActivityTimeline';
import { AgentTable } from '@/components/agents/AgentTable';
import { AgentDetailDrawer } from '@/components/agents/AgentDetailDrawer';
import { SummaryStrip } from '@/components/overview/SummaryStrip';
import { Button } from '@/components/ui/Controls';
import { EmptyState, Panel } from '@/components/ui/Panel';
import { Chip, StatusBadge } from '@/components/ui/StatusBadge';
import { useNow } from '@/hooks/useNow';
import { formatDuration, formatPercent, formatRelativeTime, shortSha } from '@/lib/format';
import { APPROVAL_ACTION_LABELS } from '@/lib/policy';
import {
  AGENT_STATUS_META,
  ATTENTION_AGENT_STATUSES,
  PIPELINE_STATUS_META,
  RISK_META,
} from '@/lib/statusMeta';
import type { ViewId } from '@/navigation/routes';
import { useAgentLookup, useControlCenter, useRepositoryLookup } from '@/state/ControlCenterContext';
import type { AgentId } from '@/types';

export function OverviewPage({ onNavigate }: { readonly onNavigate: (view: ViewId) => void }) {
  const { data, summary } = useControlCenter();
  const agentLookup = useAgentLookup();
  const repositoryLookup = useRepositoryLookup();
  const now = useNow();
  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null);

  const attention = useMemo(
    () => data.agents.filter((agent) => ATTENTION_AGENT_STATUSES.includes(agent.status)),
    [data.agents],
  );

  const active = useMemo(
    () =>
      data.agents.filter(
        (agent) => agent.status === 'running' || agent.status === 'queued' || agent.status === 'waiting',
      ),
    [data.agents],
  );

  const pendingApprovals = useMemo(
    () => data.approvals.filter((request) => request.status === 'pending'),
    [data.approvals],
  );

  const recentEvents = useMemo(() => data.events.slice(0, 14), [data.events]);

  const runs = useMemo(
    () =>
      [...data.pipelineRuns].sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt)).slice(0, 6),
    [data.pipelineRuns],
  );

  return (
    <div className="space-y-3">
      <SummaryStrip summary={summary} onSelectView={onNavigate} />

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title={`Needs attention (${attention.length})`}
          subtitle="Blocked, failed, or held at a policy gate"
          actions={
            <Button onClick={() => onNavigate('agents')}>All agents</Button>
          }
          flush
        >
          {attention.length === 0 ? (
            <EmptyState
              title="Nothing needs attention."
              hint="Every agent is idle, running, or finished cleanly."
            />
          ) : (
            <ul className="divide-y divide-surface-100 dark:divide-surface-800">
              {attention.map((agent) => {
                const meta = AGENT_STATUS_META[agent.status];
                return (
                  <li key={agent.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedAgent(agent.id)}
                      className="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-surface-50 dark:hover:bg-surface-800"
                    >
                      <div className="w-28 shrink-0">
                        <div className="font-mono text-xs font-medium text-slate-800 dark:text-slate-100">
                          {agent.name}
                        </div>
                        <div className="text-2xs text-slate-500 dark:text-slate-500">
                          {agent.roleLabel}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge meta={meta} />
                          {agent.blocker?.waitingOn && (
                            <Chip mono>{agent.blocker.waitingOn}</Chip>
                          )}
                        </div>
                        <p className="mt-1 text-2xs leading-relaxed text-slate-600 dark:text-slate-400">
                          {agent.blocker?.reason ?? agent.lastLogLine ?? agent.currentTaskTitle}
                        </p>
                      </div>
                      <div className="tabular w-16 shrink-0 text-right text-2xs text-slate-400 dark:text-slate-600">
                        {formatRelativeTime(agent.lastActivityAt, now)}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title={`Pending approvals (${pendingApprovals.length})`}
          subtitle="Actions an agent may not take alone"
          actions={<Button onClick={() => onNavigate('approvals')}>Approval Center</Button>}
          flush
          bodyClassName="scrollbar-thin max-h-[22rem] overflow-y-auto"
        >
          {pendingApprovals.length === 0 ? (
            <EmptyState title="No pending approvals." />
          ) : (
            <ul className="divide-y divide-surface-100 dark:divide-surface-800">
              {pendingApprovals.map((request) => (
                <li key={request.id} className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-2xs text-slate-500 dark:text-slate-500">
                      {request.id}
                    </span>
                    <StatusBadge meta={RISK_META[request.risk]} showDot={false} />
                    <span className="tabular ml-auto text-2xs text-slate-400 dark:text-slate-600">
                      {formatRelativeTime(request.requestedAt, now)}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-2xs text-slate-700 dark:text-slate-300">
                    {request.title}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Chip>{APPROVAL_ACTION_LABELS[request.actionType]}</Chip>
                    <Chip mono>{agentLookup.get(request.agentId)?.name ?? request.agentId}</Chip>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title={`Active agents (${active.length})`}
        subtitle="Running, queued, or waiting on an external signal"
        flush
      >
        <AgentTable
          agents={active}
          repositories={repositoryLookup}
          onSelect={setSelectedAgent}
          selectedId={selectedAgent ?? undefined}
          now={now}
        />
      </Panel>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Recent activity"
          subtitle="Newest events across the fleet"
          actions={<Button onClick={() => onNavigate('activity')}>Full timeline</Button>}
          flush
        >
          <ActivityTimeline
            events={recentEvents}
            agents={agentLookup}
            repositories={repositoryLookup}
            now={now}
            onSelectAgent={setSelectedAgent}
            compact
          />
        </Panel>

        <Panel title="Pipelines" subtitle="Most recent run per branch" flush>
          <ul className="divide-y divide-surface-100 dark:divide-surface-800">
            {runs.map((run) => {
              const repository = repositoryLookup.get(run.repositoryId);
              return (
                <li key={run.id} className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <StatusBadge meta={PIPELINE_STATUS_META[run.status]} />
                    <span className="truncate text-2xs text-slate-700 dark:text-slate-300">
                      {repository?.name}
                    </span>
                    <span className="tabular ml-auto text-2xs text-slate-400 dark:text-slate-600">
                      {run.durationMs ? formatDuration(run.durationMs) : 'running'}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate font-mono text-2xs text-slate-500 dark:text-slate-500">
                    {run.workflow} #{run.runNumber} · {run.branch} · {shortSha(run.commitSha)}
                  </div>
                  {run.failureSummary && (
                    <p className="mt-1 line-clamp-2 text-2xs text-red-600 dark:text-red-400">
                      {run.failureSummary}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Fleet consumption" subtitle={data.health.reportingWindow}>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Error rate" value={formatPercent(data.health.errorRate * 100, 1)} />
            <Metric
              label="Avg lead time"
              value={formatDuration(data.health.averageLeadTimeMs)}
            />
            <Metric
              label="Queue depth"
              value={`${data.health.queue.pending + data.health.queue.running}`}
            />
            <Metric
              label="Workers"
              value={`${data.health.queue.workers} / ${data.health.queue.workerCapacity}`}
            />
          </dl>
        </Panel>

        <Panel title="Safety posture" subtitle="Human-in-the-loop enforcement">
          <ul className="space-y-1.5 text-2xs text-slate-600 dark:text-slate-400">
            <li>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {pendingApprovals.length}
              </span>{' '}
              gated actions are waiting on a human decision.
            </li>
            <li>
              No agent in this fleet can merge to a protected branch, deploy to production, read a
              secret, or change infrastructure without an approval.
            </li>
            <li>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {data.approvals.filter((request) => request.status === 'rejected').length}
              </span>{' '}
              requests were rejected and{' '}
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {data.approvals.filter((request) => request.status === 'changes_requested').length}
              </span>{' '}
              returned for changes in this window.
            </li>
          </ul>
        </Panel>
      </div>

      <AgentDetailDrawer
        agentId={selectedAgent}
        onClose={() => setSelectedAgent(null)}
        now={now}
      />
    </div>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <dt className="text-2xs uppercase tracking-wider text-slate-500 dark:text-slate-500">
        {label}
      </dt>
      <dd className="tabular mt-0.5 text-lg font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}
