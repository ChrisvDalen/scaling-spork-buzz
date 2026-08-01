import { cn } from '@/lib/cn';
import { useControlCenter } from '@/state/ControlCenterContext';
import { IconClose } from './Icon';

/**
 * Command feedback strip.
 *
 * Every operator command produces one of these, including refusals, so an
 * action that was declined by policy is never silently swallowed.
 */
export function Toasts() {
  const { toasts, dismissToast } = useControlCenter();
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-96 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            'pointer-events-auto flex items-start gap-2 rounded border px-3 py-2 text-xs shadow-panel',
            toast.tone === 'success'
              ? 'border-emerald-300 bg-white text-slate-800 dark:border-emerald-500/40 dark:bg-surface-800 dark:text-slate-200'
              : 'border-red-300 bg-white text-slate-800 dark:border-red-500/40 dark:bg-surface-800 dark:text-slate-200',
          )}
        >
          <span
            className={cn(
              'mt-1 h-1.5 w-1.5 shrink-0 rounded-full',
              toast.tone === 'success' ? 'bg-emerald-500' : 'bg-red-500',
            )}
          />
          <p className="flex-1 leading-relaxed">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss"
            className="mt-0.5 shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <IconClose />
          </button>
        </div>
      ))}
    </div>
  );
}
