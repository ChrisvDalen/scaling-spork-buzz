import type { MetricSeries, SystemHealth } from '@/types';
import { CLOCK_BASE, hoursAgo, minutesAgo, minutesFromNow, nowIso, secondsAgo } from './time';

export const SYSTEM_HEALTH: SystemHealth = {
  checks: [
    {
      key: 'control_api',
      label: 'Control plane API',
      state: 'operational',
      latencyMs: 42,
      message: 'All endpoints responding. p95 42 ms over the last 15 minutes.',
      lastCheckedAt: secondsAgo(18),
      endpoint: 'https://agents.internal.northwind/api',
    },
    {
      key: 'github',
      label: 'GitHub connectivity',
      state: 'operational',
      latencyMs: 188,
      message: 'REST and GraphQL reachable. 2 webhook deliveries retried in the last hour.',
      lastCheckedAt: secondsAgo(24),
      endpoint: 'https://api.github.com',
    },
    {
      key: 'jira',
      label: 'Jira connectivity',
      state: 'degraded',
      latencyMs: 1_940,
      message: 'Elevated latency on issue search. Writes are queued behind a 40 s backlog.',
      lastCheckedAt: secondsAgo(31),
      endpoint: 'https://northwind.atlassian.net',
    },
    {
      key: 'ci',
      label: 'CI/CD (GitHub Actions)',
      state: 'degraded',
      latencyMs: 610,
      message: 'Shared runner pool at 92% utilisation; queue depth 14, oldest job waiting 6m12s.',
      lastCheckedAt: secondsAgo(19),
      endpoint: 'https://api.github.com/actions',
    },
    {
      key: 'model_provider',
      label: 'Model provider',
      state: 'operational',
      latencyMs: 740,
      message: 'Anthropic API responding. 0 overload responses in the last 30 minutes.',
      lastCheckedAt: secondsAgo(12),
      endpoint: 'https://api.anthropic.com',
    },
    {
      key: 'container_runtime',
      label: 'Container runtime pool',
      state: 'outage',
      message:
        'runner-eu-west-1a-11 cannot reach the Docker socket. 1 task failed; 3 runners in the pool are unaffected.',
      lastCheckedAt: minutesAgo(2),
      endpoint: 'runner-pool://eu-west-1a',
    },
    {
      key: 'vault',
      label: 'Secret store',
      state: 'operational',
      latencyMs: 96,
      message: 'Vault sealed status: unsealed. All secret reads in the last 24 h were gated by POL-003.',
      lastCheckedAt: secondsAgo(44),
      endpoint: 'https://vault.internal.northwind',
    },
    {
      key: 'artifact_registry',
      label: 'Artifact registry',
      state: 'degraded',
      latencyMs: 2_310,
      message: 'Private registry returning 401 for anonymous resolution; expected, but slowing scans.',
      lastCheckedAt: minutesAgo(1),
      endpoint: 'https://nexus.internal.northwind',
    },
  ],
  rateLimits: [
    {
      key: 'github_rest',
      label: 'GitHub REST',
      used: 3_118,
      limit: 5_000,
      resetsAt: minutesFromNow(23),
      unit: 'requests',
    },
    {
      key: 'github_graphql',
      label: 'GitHub GraphQL',
      used: 1_842,
      limit: 5_000,
      resetsAt: minutesFromNow(23),
      unit: 'requests',
    },
    {
      key: 'model_input',
      label: 'Model input tokens',
      used: 3_517_900,
      limit: 8_000_000,
      resetsAt: minutesFromNow(37),
      unit: 'tokens',
    },
    {
      key: 'model_output',
      label: 'Model output tokens',
      used: 632_400,
      limit: 1_000_000,
      resetsAt: minutesFromNow(37),
      unit: 'tokens',
    },
    {
      key: 'jira_api',
      label: 'Jira API',
      used: 412,
      limit: 500,
      resetsAt: minutesFromNow(8),
      unit: 'requests',
    },
  ],
  stream: {
    transport: 'websocket',
    state: 'connected',
    connectedSince: hoursAgo(9.6),
    reconnectAttempts: 2,
    lastMessageAt: secondsAgo(3),
    endpoint: 'wss://agents.internal.northwind/stream',
  },
  queue: {
    pending: 6,
    running: 4,
    retrying: 1,
    deadLettered: 1,
    oldestPendingAgeMs: 372_000,
    workers: 8,
    workerCapacity: 12,
  },
  errorRate: 0.083,
  averageLeadTimeMs: 11_640_000,
  usage: {
    inputTokens: 3_517_900,
    outputTokens: 632_400,
    totalTokens: 4_150_300,
    estimatedCost: 65.69,
    currency: 'USD',
    budgetLimit: 220,
    windowStartedAt: hoursAgo(24),
  },
  reportingWindow: 'Last 24 hours',
  generatedAt: nowIso(),
};

/** Deterministic sparkline data. No randomness: the same input renders the same chart. */
function series(
  key: string,
  label: string,
  unit: MetricSeries['unit'],
  values: readonly number[],
  stepMinutes = 30,
): MetricSeries {
  return {
    key,
    label,
    unit,
    points: values.map((value, index) => ({
      timestamp: new Date(
        CLOCK_BASE - (values.length - 1 - index) * stepMinutes * 60_000,
      ).toISOString(),
      value,
    })),
  };
}

export const METRIC_SERIES: readonly MetricSeries[] = [
  series(
    'tokens_per_30m',
    'Token consumption',
    'tokens',
    [
      118_000, 142_000, 96_000, 187_000, 214_000, 238_000, 201_000, 176_000, 249_000, 288_000,
      312_000, 274_000, 196_000, 231_000, 267_000, 341_000,
    ],
  ),
  series(
    'cost_per_30m',
    'Estimated spend',
    'usd',
    [1.84, 2.21, 1.5, 2.92, 3.34, 3.71, 3.14, 2.75, 3.89, 4.5, 4.87, 4.28, 3.06, 3.61, 4.17, 5.32],
  ),
  series(
    'active_agents',
    'Active agents',
    'count',
    [3, 4, 4, 5, 6, 6, 5, 5, 7, 7, 6, 6, 5, 5, 4, 4],
  ),
  series(
    'lead_time',
    'Task lead time',
    'ms',
    [
      9_120_000, 9_840_000, 10_260_000, 9_600_000, 11_040_000, 12_180_000, 11_760_000, 10_920_000,
      12_600_000, 13_140_000, 12_060_000, 11_400_000, 10_800_000, 11_280_000, 11_940_000,
      11_640_000,
    ],
  ),
];
