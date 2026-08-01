import { useId } from 'react';
import { cn } from '@/lib/cn';
import type { MetricPoint } from '@/types';

/**
 * Minimal area sparkline. Deliberately axis-less and label-less: it exists to
 * show shape next to a number, not to be read for values. The precise figure
 * always sits beside it.
 */
export function Sparkline({
  points,
  className,
  stroke = 'stroke-blue-500',
  fill = 'fill-blue-500/15',
  height = 32,
  width = 120,
}: {
  readonly points: readonly MetricPoint[];
  readonly className?: string;
  readonly stroke?: string;
  readonly fill?: string;
  readonly height?: number;
  readonly width?: number;
}) {
  const gradientId = useId();
  if (points.length < 2) {
    return <div className={cn('h-8', className)} aria-hidden />;
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);

  const coordinates = values.map((value, index) => {
    const x = index * stepX;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const linePath = `M${coordinates.join(' L')}`;
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('h-8 w-full', className)}
      role="img"
      aria-label={`Trend across ${points.length} samples`}
    >
      <defs>
        <clipPath id={gradientId}>
          <rect x="0" y="0" width={width} height={height} />
        </clipPath>
      </defs>
      <path d={areaPath} className={cn('stroke-none', fill)} clipPath={`url(#${gradientId})`} />
      <path d={linePath} className={cn('fill-none', stroke)} strokeWidth={1.25} />
    </svg>
  );
}

/** Horizontal utilisation bar with a threshold marker, used for rate limits. */
export function UsageBar({
  used,
  limit,
  className,
}: {
  readonly used: number;
  readonly limit: number;
  readonly className?: string;
}) {
  const ratio = limit === 0 ? 0 : Math.min(1, used / limit);
  const tone =
    ratio >= 0.9 ? 'bg-red-500' : ratio >= 0.75 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div
      className={cn(
        'relative h-1.5 w-full overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700',
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cn('h-full rounded-full', tone)} style={{ width: `${ratio * 100}%` }} />
      <div className="absolute inset-y-0 left-[90%] w-px bg-slate-400/60 dark:bg-slate-500/60" />
    </div>
  );
}
