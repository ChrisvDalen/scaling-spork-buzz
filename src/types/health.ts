import type { IsoTimestamp } from './common';
import type { CostUsage } from './metrics';

export type HealthState = 'operational' | 'degraded' | 'outage' | 'unknown';

/** One monitored dependency. */
export interface HealthCheck {
  readonly key: string;
  readonly label: string;
  readonly state: HealthState;
  readonly latencyMs?: number;
  readonly message: string;
  readonly lastCheckedAt: IsoTimestamp;
  readonly endpoint?: string;
}

/** Provider rate limit window. */
export interface RateLimit {
  readonly key: string;
  readonly label: string;
  readonly used: number;
  readonly limit: number;
  readonly resetsAt: IsoTimestamp;
  readonly unit: 'requests' | 'tokens';
}

/** Live stream transport state, so operators can tell stale data from fresh. */
export interface StreamStatus {
  readonly transport: 'websocket' | 'sse' | 'polling' | 'none';
  readonly state: 'connected' | 'connecting' | 'reconnecting' | 'disconnected';
  readonly connectedSince?: IsoTimestamp;
  readonly reconnectAttempts: number;
  readonly lastMessageAt?: IsoTimestamp;
  readonly endpoint: string;
}

export interface JobQueueStatus {
  readonly pending: number;
  readonly running: number;
  readonly retrying: number;
  readonly deadLettered: number;
  readonly oldestPendingAgeMs: number;
  readonly workers: number;
  readonly workerCapacity: number;
}

export interface SystemHealth {
  readonly checks: readonly HealthCheck[];
  readonly rateLimits: readonly RateLimit[];
  readonly stream: StreamStatus;
  readonly queue: JobQueueStatus;
  /** Share of agent runs ending in `failed`, over the reporting window, 0 to 1. */
  readonly errorRate: number;
  /** Mean wall-clock time from task assignment to completion. */
  readonly averageLeadTimeMs: number;
  readonly usage: CostUsage;
  readonly reportingWindow: string;
  readonly generatedAt: IsoTimestamp;
}
