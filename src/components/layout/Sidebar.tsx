import { cn } from '@/lib/cn';
import { VIEWS, VIEW_META, type ViewId } from '@/navigation/routes';
import { useControlCenter } from '@/state/ControlCenterContext';
import {
  IconActivity,
  IconAgents,
  IconApprovals,
  IconGauge,
  IconHealth,
  IconRepository,
  IconSettings,
  IconTasks,
} from '@/components/ui/Icon';

const VIEW_ICONS: Record<ViewId, (props: { size?: number }) => JSX.Element> = {
  overview: IconGauge,
  agents: IconAgents,
  tasks: IconTasks,
  approvals: IconApprovals,
  activity: IconActivity,
  repositories: IconRepository,
  health: IconHealth,
  settings: IconSettings,
};

export function Sidebar({
  current,
  onNavigate,
}: {
  readonly current: ViewId;
  readonly onNavigate: (view: ViewId) => void;
}) {
  const { data, summary } = useControlCenter();

  const badges: Partial<Record<ViewId, { count: number; tone: 'amber' | 'red' | 'neutral' }>> = {
    agents:
      summary.blockedAgents + summary.approvalRequiredAgents > 0
        ? { count: summary.blockedAgents + summary.approvalRequiredAgents, tone: 'amber' }
        : undefined,
    approvals:
      summary.pendingApprovals > 0 ? { count: summary.pendingApprovals, tone: 'amber' } : undefined,
    tasks: summary.failedTasks > 0 ? { count: summary.failedTasks, tone: 'red' } : undefined,
    health:
      data.health.checks.filter((check) => check.state !== 'operational').length > 0
        ? {
            count: data.health.checks.filter((check) => check.state !== 'operational').length,
            tone: 'red',
          }
        : undefined,
  };

  return (
    <nav
      aria-label="Primary"
      className="flex w-14 shrink-0 flex-col border-r border-surface-200 bg-white lg:w-52 dark:border-surface-700 dark:bg-surface-850"
    >
      <div className="flex h-12 items-center gap-2 border-b border-surface-200 px-3 dark:border-surface-700">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-800 text-2xs font-bold text-white dark:bg-slate-200 dark:text-slate-900">
          AC
        </div>
        <div className="hidden min-w-0 lg:block">
          <div className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
            Agent Control Center
          </div>
          <div className="truncate text-2xs text-slate-500 dark:text-slate-500">
            northwind-payments
          </div>
        </div>
      </div>

      <ul className="flex-1 space-y-0.5 p-2">
        {VIEWS.map((view) => {
          const Icon = VIEW_ICONS[view];
          const active = current === view;
          const badge = badges[view];
          return (
            <li key={view}>
              <button
                type="button"
                onClick={() => onNavigate(view)}
                aria-current={active ? 'page' : undefined}
                title={VIEW_META[view].description}
                className={cn(
                  'flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'bg-surface-100 text-slate-900 dark:bg-surface-750 dark:text-slate-100'
                    : 'text-slate-600 hover:bg-surface-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-surface-800 dark:hover:text-slate-200',
                )}
              >
                <span
                  className={cn(
                    'shrink-0',
                    active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500',
                  )}
                >
                  <Icon size={15} />
                </span>
                <span className="hidden flex-1 truncate text-left lg:block">
                  {VIEW_META[view].label}
                </span>
                {badge && (
                  <span
                    className={cn(
                      'tabular hidden shrink-0 rounded px-1 py-px text-2xs font-semibold lg:inline-block',
                      badge.tone === 'red'
                        ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
                    )}
                  >
                    {badge.count}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="hidden border-t border-surface-200 px-3 py-2 lg:block dark:border-surface-700">
        <div className="text-2xs text-slate-500 dark:text-slate-500">
          Human-in-the-loop enforced.
          <br />
          10 policy rules active.
        </div>
      </div>
    </nav>
  );
}
