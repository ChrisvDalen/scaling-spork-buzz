import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button } from './Controls';
import { IconClose } from './Icon';

/**
 * Right-hand detail panel.
 *
 * It overlays on narrow viewports and docks beside the content on wide ones,
 * which keeps the table visible while an operator reads a detail record.
 */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'w-full max-w-3xl',
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: ReactNode;
  readonly subtitle?: ReactNode;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly width?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close detail panel"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px] dark:bg-black/50"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'relative flex h-full flex-col border-l border-surface-200 bg-white shadow-drawer',
          'dark:border-surface-700 dark:bg-surface-850',
          width,
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-surface-200 px-4 py-2.5 dark:border-surface-700">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</div>
            {subtitle && (
              <div className="mt-0.5 text-2xs text-slate-500 dark:text-slate-400">{subtitle}</div>
            )}
          </div>
          <Button variant="ghost" onClick={onClose} icon={<IconClose />} aria-label="Close">
            Close
          </Button>
        </header>
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <footer className="border-t border-surface-200 bg-surface-50 px-4 py-2.5 dark:border-surface-700 dark:bg-surface-800">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

/** Section heading inside a drawer. */
export function DrawerSection({
  title,
  actions,
  children,
  className,
}: {
  readonly title: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <section className={cn('border-b border-surface-200 px-4 py-3 dark:border-surface-700', className)}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-2xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </h3>
        {actions}
      </div>
      {children}
    </section>
  );
}
