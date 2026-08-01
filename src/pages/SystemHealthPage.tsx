import { MetricTile } from '@/components/overview/SummaryStrip';
import { Sparkline, UsageBar } from '@/components/ui/Sparkline';
import { Panel } from '@/components/ui/Panel';
import { Chip, StatusBadge, StatusDot } from '@/components/ui/StatusBadge';
import { useNow } from '@/hooks/useNow';
import {
  formatCompact,
  formatCurrency,
  formatDuration,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  formatTimestampFull,
} from '@/lib/format';
import { HEALTH_STATE_META } from '@/lib/statusMeta';
import { useControlCenter } from '@/state/ControlCenterContext';
import type { MetricSeries } from '@/types';

const SERIES_TONE: Record<string, { stroke: string; fill: string }> = {
  tokens_per_30m: { stroke: 'stroke-blue-500', fill: 'fill-blue-500/15' },
  cost_per_30m: { stroke: 'stroke-violet-500', fill: 'fill-violet-500/15' },
  active_agents: { stroke: 'stroke-emerald-500', fill: 'fill-emerald-500/15' },
  lead_time: { stroke: 'stroke-amber-500', fill: 'fill-amber-500/15' },
};

function formatSeriesValue(series: MetricSeries, value: number): string {
  switch (series.unit) {
    case 'tokens':
      return formatCompact(value);
    case 'usd':
      return formatCurrency(value);
    case 'ms':
      return formatDuration(value);
    case 'percent':
      return formatPercent(value, 1);
    default:
      return formatNumber(value);
  }
}

export function SystemHealthPage() {
  const { data, summary } = useControlCenter();
  const now = useNow();
  const { health } = data;

  const degraded = health.checks.filter((check) => check.state !== 'operational');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-6">
        <MetricTile
          label="Dependencies"
          value={`${health.checks.length - degraded.length}/${health.checks.length}`}
          hint="operational"
          tone={degraded.length > 0 ? 'warning' : 'success'}
          alert={degraded.length > 0}
        />
        <MetricTile
          label="Error rate"
          value={formatPercent(health.errorRate * 100, 1)}
          hint={health.reportingWindow.toLowerCase()}
          tone="danger"
          alert={health.errorRate > 0.05}
        />
        <MetricTile
          label="Avg lead time"
          value={formatDuration(health.averageLeadTimeMs)}
          hint="assignment to completion"
        />
        <MetricTile
          label="Queue depth"
          value={formatNumber(health.queue.pending + health.queue.running)}
          hint={`${health.queue.deadLettered} dead-lettered`}
          tone="warning"
          alert={health.queue.deadLettered > 0}
        />
        <MetricTile
          label="Tokens"
          value={formatCompact(health.usage.totalTokens)}
          hint={`${formatCompact(summary.tokenUsage.totalTokens)} this session`}
        />
        <MetricTile
          label="Spend"
          value={formatCurrency(health.usage.estimatedCost, health.usage.currency)}
          hint={
            health.usage.budgetLimit
              ? `of ${formatCurrency(health.usage.budgetLimit, health.usage.currency)} budget`
              : undefined
          }
          tone="warning"
          alert={
            health.usage.budgetLimit !== undefined &&
            health.usage.estimatedCost / health.usage.budgetLimit > 0.75
          }
        />
      </div>

      <Panel
        title="Dependencies"
        subtitle={`Probed continuously · report generated ${formatRelativeTime(health.generatedAt, now)}`}
        flush
      >
        <div className="scrollbar-thin overflow-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Service</th>
                <th scope="col">State</th>
                <th scope="col" className="text-right">
                  Latency
                </th>
                <th scope="col">Detail</th>
                <th scope="col">Endpoint</th>
                <th scope="col" className="text-right">
                  Checked
                </th>
              </tr>
            </thead>
            <tbody>
              {health.checks.map((check) => (
                <tr key={check.key}>
                  <td className="font-medium text-slate-800 dark:text-slate-200">{check.label}</td>
                  <td>
                    <StatusBadge meta={HEALTH_STATE_META[check.state]} />
                  </td>
                  <td className="tabular text-right text-slate-600 dark:text-slate-400">
                    {check.latencyMs !== undefined ? `${check.latencyMs} ms` : '—'}
                  </td>
                  <td className="max-w-[30rem] text-slate-600 dark:text-slate-400">
                    {check.message}
                  </td>
                  <td className="font-mono text-2xs text-slate-500 dark:text-slate-500">
                    {check.endpoint ?? '—'}
                  </td>
                  <td className="tabular text-right text-slate-500 dark:text-slate-500">
                    {formatRelativeTime(check.lastCheckedAt, now)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Rate limits" subtitle="Current window per provider">
          <ul className="space-y-2.5">
            {health.rateLimits.map((limit) => {
              const ratio = limit.used / limit.limit;
              return (
                <li key={limit.key}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-2xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {limit.label}
                    </span>
                    <span className="tabular text-slate-500 dark:text-slate-500">
                      {limit.unit === 'tokens'
                        ? `${formatCompact(limit.used)} / ${formatCompact(limit.limit)}`
                        : `${formatNumber(limit.used)} / ${formatNumber(limit.limit)}`}{' '}
                      ({formatPercent(ratio * 100)})
                    </span>
                  </div>
                  <UsageBar used={limit.used} limit={limit.limit} />
                  <div className="mt-0.5 text-2xs text-slate-500 dark:text-slate-500">
                    resets {formatRelativeTime(limit.resetsAt, now)}
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="space-y-3">
          <Panel title="Event stream" subtitle="Push transport to the control plane">
            <div className="flex flex-wrap items-center gap-2">
              <StatusDot
                tone={health.stream.state === 'connected' ? 'success' : 'danger'}
                live={health.stream.state === 'connected'}
              />
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                {health.stream.transport.toUpperCase()} {health.stream.state}
              </span>
              <Chip mono>{health.stream.endpoint}</Chip>
            </div>
            <dl className="mt-2 grid grid-cols-3 gap-3 text-2xs">
              <div>
                <dt className="text-slate-500 dark:text-slate-500">Connected since</dt>
                <dd
                  className="text-slate-700 dark:text-slate-300"
                  title={formatTimestampFull(health.stream.connectedSince)}
                >
                  {formatRelativeTime(health.stream.connectedSince, now)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-500">Last message</dt>
                <dd className="text-slate-700 dark:text-slate-300">
                  {formatRelativeTime(health.stream.lastMessageAt, now)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-500">Reconnects</dt>
                <dd className="tabular text-slate-700 dark:text-slate-300">
                  {health.stream.reconnectAttempts}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Job queue" subtitle="Agent run scheduler">
            <dl className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              <QueueStat label="Pending" value={health.queue.pending} />
              <QueueStat label="Running" value={health.queue.running} />
              <QueueStat label="Retrying" value={health.queue.retrying} tone="warning" />
              <QueueStat label="Dead-letter" value={health.queue.deadLettered} tone="danger" />
              <QueueStat label="Workers" value={health.queue.workers} />
              <QueueStat label="Capacity" value={health.queue.workerCapacity} />
            </dl>
            <p className="mt-2 text-2xs text-slate-500 dark:text-slate-500">
              Oldest pending job has waited {formatDuration(health.queue.oldestPendingAgeMs)}.
            </p>
          </Panel>
        </div>
      </div>

      <Panel title="Trends" subtitle="30-minute buckets over the last 8 hours">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.metrics.map((series) => {
            const last = series.points[series.points.length - 1];
            const first = series.points[0];
            const tone = SERIES_TONE[series.key] ?? {
              stroke: 'stroke-blue-500',
              fill: 'fill-blue-500/15',
            };
            const delta =
              last && first && first.value !== 0
                ? ((last.value - first.value) / first.value) * 100
                : 0;
            return (
              <div key={series.key}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-2xs uppercase tracking-wider text-slate-500 dark:text-slate-500">
                    {series.label}
                  </span>
                  <span
                    className={
                      delta >= 0
                        ? 'tabular text-2xs text-amber-600 dark:text-amber-400'
                        : 'tabular text-2xs text-emerald-600 dark:text-emerald-400'
                    }
                  >
                    {delta >= 0 ? '+' : ''}
                    {delta.toFixed(0)}%
                  </span>
                </div>
                <div className="tabular mt-0.5 text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {last ? formatSeriesValue(series, last.value) : '—'}
                </div>
                <Sparkline points={series.points} stroke={tone.stroke} fill={tone.fill} />
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function QueueStat({
  label,
  value,
  tone,
}: {
  readonly label: string;
  readonly value: number;
  readonly tone?: 'warning' | 'danger';
}) {
  return (
    <div>
      <dt className="text-2xs uppercase tracking-wider text-slate-500 dark:text-slate-500">
        {label}
      </dt>
      <dd
        className={
          value > 0 && tone === 'danger'
            ? 'tabular text-base font-semibold text-red-600 dark:text-red-400'
            : value > 0 && tone === 'warning'
              ? 'tabular text-base font-semibold text-amber-600 dark:text-amber-400'
              : 'tabular text-base font-semibold text-slate-800 dark:text-slate-100'
        }
      >
        {value}
      </dd>
    </div>
  );
}
