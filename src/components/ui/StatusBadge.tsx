import { cn } from '@/lib/cn';
import { TONE_CLASSES, type StatusMeta, type Tone } from '@/lib/statusMeta';

/**
 * Status is always rendered as a coloured dot plus its written label. Colour
 * alone would fail anyone who cannot distinguish it, and an emoji would not
 * survive a monochrome print or a screen reader.
 */
export function StatusBadge({
  meta,
  className,
  showDot = true,
}: {
  readonly meta: StatusMeta;
  readonly className?: string;
  readonly showDot?: boolean;
}) {
  const tone = TONE_CLASSES[meta.tone];
  return (
    <span
      title={meta.description}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border px-1.5 py-0.5 text-2xs font-medium',
        tone.badge,
        className,
      )}
    >
      {showDot && <StatusDot tone={meta.tone} live={meta.live} />}
      {meta.label}
    </span>
  );
}

export function StatusDot({
  tone,
  live = false,
  className,
}: {
  readonly tone: Tone;
  readonly live?: boolean;
  readonly className?: string;
}) {
  const classes = TONE_CLASSES[tone];
  return (
    <span className={cn('relative inline-flex h-1.5 w-1.5 shrink-0', className)}>
      <span
        className={cn(
          'relative inline-flex h-1.5 w-1.5 rounded-full',
          classes.dot,
          live && 'pulse-dot',
        )}
      />
    </span>
  );
}

/** Neutral chip for metadata that is not a status: labels, tools, counts. */
export function Chip({
  children,
  tone,
  className,
  mono = false,
}: {
  readonly children: React.ReactNode;
  readonly tone?: Tone;
  readonly className?: string;
  readonly mono?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-2xs',
        tone
          ? TONE_CLASSES[tone].badge
          : 'border-surface-200 bg-surface-50 text-slate-600 dark:border-surface-700 dark:bg-surface-800 dark:text-slate-400',
        mono && 'font-mono',
        className,
      )}
    >
      {children}
    </span>
  );
}
