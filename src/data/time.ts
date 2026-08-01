import type { IsoTimestamp } from '@/types';

/**
 * All mock timestamps are expressed relative to the moment the module is
 * loaded, so a freshly opened console always shows plausible "4m ago" values
 * instead of a frozen date from whenever the fixtures were written.
 *
 * The base is captured once and never advances on its own: this console does
 * not fabricate events. Refreshing the page re-anchors the dataset.
 */
export const CLOCK_BASE = Date.now();

const iso = (ms: number): IsoTimestamp => new Date(ms).toISOString();

export const secondsAgo = (seconds: number): IsoTimestamp => iso(CLOCK_BASE - seconds * 1000);
export const minutesAgo = (minutes: number): IsoTimestamp => iso(CLOCK_BASE - minutes * 60_000);
export const hoursAgo = (hours: number): IsoTimestamp => iso(CLOCK_BASE - hours * 3_600_000);
export const daysAgo = (days: number): IsoTimestamp => iso(CLOCK_BASE - days * 86_400_000);

export const minutesFromNow = (minutes: number): IsoTimestamp => iso(CLOCK_BASE + minutes * 60_000);
export const hoursFromNow = (hours: number): IsoTimestamp => iso(CLOCK_BASE + hours * 3_600_000);
export const daysFromNow = (days: number): IsoTimestamp => iso(CLOCK_BASE + days * 86_400_000);

export const nowIso = (): IsoTimestamp => iso(CLOCK_BASE);
