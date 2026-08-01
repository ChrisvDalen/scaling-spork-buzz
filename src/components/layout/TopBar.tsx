import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Controls';
import { IconMoon, IconSun } from '@/components/ui/Icon';
import { StatusDot } from '@/components/ui/StatusBadge';
import { formatRelativeTime, formatTimestampFull } from '@/lib/format';
import { VIEW_META, type ViewId } from '@/navigation/routes';
import { services } from '@/services';
import { useControlCenter } from '@/state/ControlCenterContext';
import { useTheme } from '@/state/ThemeContext';

/** Ticks once a second so relative timestamps in the header stay honest. */
function useNowTick(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(handle);
  }, []);
  return now;
}

export function TopBar({ view }: { readonly view: ViewId }) {
  const { data } = useControlCenter();
  const { theme, toggleTheme } = useTheme();
  const now = useNowTick();
  const stream = data.health.stream;

  const connected = stream.state === 'connected';

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-surface-200 bg-white px-4 dark:border-surface-700 dark:bg-surface-850">
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
          {VIEW_META[view].label}
        </h1>
        <p className="truncate text-2xs text-slate-500 dark:text-slate-500">
          {VIEW_META[view].description}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div
          className="hidden items-center gap-1.5 text-2xs text-slate-500 md:flex dark:text-slate-400"
          title={`${stream.transport} ${stream.state}, endpoint ${stream.endpoint}`}
        >
          <StatusDot tone={connected ? 'success' : 'danger'} live={connected} />
          <span className="uppercase tracking-wider">{stream.transport}</span>
          <span className="text-slate-400 dark:text-slate-600">|</span>
          <span>last message {formatRelativeTime(stream.lastMessageAt, now)}</span>
        </div>

        <div
          className="hidden text-2xs text-slate-500 lg:block dark:text-slate-500"
          title={formatTimestampFull(data.health.generatedAt)}
        >
          Source: <span className="font-medium uppercase">{services.kind}</span>
        </div>

        <Button
          variant="ghost"
          onClick={toggleTheme}
          icon={theme === 'dark' ? <IconSun /> : <IconMoon />}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </Button>
      </div>
    </header>
  );
}
