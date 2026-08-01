import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface PanelProps {
  readonly title?: string;
  readonly subtitle?: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
  readonly bodyClassName?: string;
  /** Removes body padding, for panels that host a full-bleed table. */
  readonly flush?: boolean;
}

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
  flush = false,
}: PanelProps) {
  return (
    <section className={cn('panel flex min-h-0 flex-col', className)}>
      {(title || actions) && (
        <header className="panel-header">
          <div className="min-w-0">
            {title && <h2 className="panel-title">{title}</h2>}
            {subtitle && (
              <p className="mt-0.5 truncate text-2xs text-slate-500 dark:text-slate-500">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </header>
      )}
      <div className={cn('min-h-0 flex-1', flush ? '' : 'p-3', bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({
  title,
  hint,
  className,
}: {
  readonly title: string;
  readonly hint?: string;
  readonly className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1 px-4 py-10 text-center',
        className,
      )}
    >
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{title}</p>
      {hint && <p className="max-w-md text-2xs text-slate-500 dark:text-slate-500">{hint}</p>}
    </div>
  );
}

/** Compact definition list used throughout the detail views. */
export function KeyValueGrid({
  items,
  columns = 2,
  className,
}: {
  readonly items: readonly { readonly label: string; readonly value: ReactNode }[];
  readonly columns?: 1 | 2 | 3 | 4;
  readonly className?: string;
}) {
  const columnClass =
    columns === 1
      ? 'grid-cols-1'
      : columns === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : columns === 3
          ? 'grid-cols-1 sm:grid-cols-3'
          : 'grid-cols-2 sm:grid-cols-4';
  return (
    <dl className={cn('grid gap-x-6 gap-y-2.5', columnClass, className)}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-2xs uppercase tracking-wider text-slate-500 dark:text-slate-500">
            {item.label}
          </dt>
          <dd className="mt-0.5 truncate text-xs text-slate-800 dark:text-slate-200">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
