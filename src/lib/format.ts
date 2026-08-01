import type { IsoTimestamp } from '@/types';

/**
 * Formatting helpers. All of them tolerate undefined input and return a
 * consistent placeholder, so table cells never render "undefined".
 */

export const EMPTY = '—'; // em dash

const numberFormat = new Intl.NumberFormat('en-US');
const compactFormat = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatNumber(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return EMPTY;
  return numberFormat.format(value);
}

export function formatCompact(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return EMPTY;
  if (Math.abs(value) < 1000) return numberFormat.format(value);
  return compactFormat.format(value);
}

export function formatCurrency(value: number | undefined, currency: 'USD' | 'EUR' = 'USD'): string {
  if (value === undefined || Number.isNaN(value)) return EMPTY;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: value < 100 ? 2 : 0,
    maximumFractionDigits: value < 100 ? 2 : 0,
  }).format(value);
}

export function formatPercent(value: number | undefined, fractionDigits = 0): string {
  if (value === undefined || Number.isNaN(value)) return EMPTY;
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || Number.isNaN(bytes)) return EMPTY;
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size < 10 && unitIndex > 0 ? size.toFixed(1) : Math.round(size)} ${units[unitIndex]}`;
}

/** `2m 14s`, `1h 03m`, `340ms`. */
export function formatDuration(ms: number | undefined): string {
  if (ms === undefined || Number.isNaN(ms)) return EMPTY;
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  return `${seconds}s`;
}

/** `12s ago`, `4m ago`, `2h ago`, `3d ago`. Future instants render as `in 5m`. */
export function formatRelativeTime(
  timestamp: IsoTimestamp | undefined,
  now: number = Date.now(),
): string {
  if (!timestamp) return EMPTY;
  const then = Date.parse(timestamp);
  if (Number.isNaN(then)) return EMPTY;
  const deltaMs = now - then;
  const future = deltaMs < 0;
  const abs = Math.abs(deltaMs);

  const seconds = Math.round(abs / 1000);
  const minutes = Math.round(abs / 60_000);
  const hours = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);

  let magnitude: string;
  if (seconds < 60) magnitude = `${seconds}s`;
  else if (minutes < 60) magnitude = `${minutes}m`;
  else if (hours < 24) magnitude = `${hours}h`;
  else magnitude = `${days}d`;

  return future ? `in ${magnitude}` : `${magnitude} ago`;
}

/** `01 Aug 09:32` - compact absolute time for dense tables. */
export function formatTimestamp(timestamp: IsoTimestamp | undefined): string {
  if (!timestamp) return EMPTY;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return EMPTY;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/** `01 Aug 2026, 09:32:11` - full precision for detail panels and tooltips. */
export function formatTimestampFull(timestamp: IsoTimestamp | undefined): string {
  if (!timestamp) return EMPTY;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return EMPTY;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

/** `09:32:11.482` - log gutter timestamps. */
export function formatLogTime(timestamp: IsoTimestamp): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return EMPTY;
  const pad = (n: number, width = 2) => String(n).padStart(width, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(
    date.getMilliseconds(),
    3,
  )}`;
}

/** Elapsed time since a start instant, for "running for" columns. */
export function formatElapsed(
  startedAt: IsoTimestamp | undefined,
  endedAt?: IsoTimestamp,
  now: number = Date.now(),
): string {
  if (!startedAt) return EMPTY;
  const start = Date.parse(startedAt);
  if (Number.isNaN(start)) return EMPTY;
  const end = endedAt ? Date.parse(endedAt) : now;
  return formatDuration(end - start);
}

/** Splits `feature/PLAT-1482-retry-policy` into a short display form. */
export function shortenBranch(branch: string | undefined, maxLength = 28): string {
  if (!branch) return EMPTY;
  if (branch.length <= maxLength) return branch;
  return `${branch.slice(0, maxLength - 1)}…`;
}

export function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

/** Title-cases a snake_case enum member for display. */
export function humanize(value: string): string {
  return value
    .split('_')
    .map((word) => (word.length === 0 ? word : word[0]!.toUpperCase() + word.slice(1)))
    .join(' ');
}
