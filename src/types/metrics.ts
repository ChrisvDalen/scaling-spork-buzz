import type { IsoTimestamp } from './common';

/** Token and money accounting for a single actor or window. */
export interface CostUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly totalTokens: number;
  /** Estimated spend in `currency`, derived from provider list prices. */
  readonly estimatedCost: number;
  readonly currency: 'USD' | 'EUR';
  /** Optional per-actor ceiling, used to render budget consumption. */
  readonly budgetLimit?: number;
  readonly windowStartedAt?: IsoTimestamp;
}

/** The counters rendered in the Overview summary strip. */
export interface FleetSummary {
  readonly totalAgents: number;
  readonly activeAgents: number;
  readonly waitingAgents: number;
  readonly blockedAgents: number;
  readonly approvalRequiredAgents: number;
  readonly idleAgents: number;
  readonly activeTasks: number;
  readonly failedTasks: number;
  readonly openPullRequests: number;
  readonly failingPipelines: number;
  readonly pendingApprovals: number;
  readonly tokenUsage: CostUsage;
}

/** One sample in a sparkline series. */
export interface MetricPoint {
  readonly timestamp: IsoTimestamp;
  readonly value: number;
}

export interface MetricSeries {
  readonly key: string;
  readonly label: string;
  readonly unit: 'tokens' | 'usd' | 'count' | 'ms' | 'percent';
  readonly points: readonly MetricPoint[];
}

/** Per-agent cost roll-up for the metrics view. */
export interface AgentCostBreakdown {
  readonly agentId: string;
  readonly agentName: string;
  readonly usage: CostUsage;
  readonly taskCount: number;
  readonly costPerTask: number;
}
