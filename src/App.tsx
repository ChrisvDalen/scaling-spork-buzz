import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Toasts } from '@/components/ui/Toasts';
import { useRoute } from '@/navigation/useRoute';
import type { ViewId } from '@/navigation/routes';
import { ActivityPage } from '@/pages/ActivityPage';
import { AgentsPage } from '@/pages/AgentsPage';
import { ApprovalsPage } from '@/pages/ApprovalsPage';
import { OverviewPage } from '@/pages/OverviewPage';
import { RepositoriesPage } from '@/pages/RepositoriesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { SystemHealthPage } from '@/pages/SystemHealthPage';
import { TasksPage } from '@/pages/TasksPage';
import { ControlCenterProvider } from '@/state/ControlCenterContext';
import { ThemeProvider } from '@/state/ThemeContext';

function Shell() {
  const { route, navigate } = useRoute();
  const goTo = (view: ViewId) => navigate({ view });

  return (
    <div className="flex h-full min-h-0">
      <Sidebar current={route.view} onNavigate={goTo} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar view={route.view} />
        <main className="scrollbar-thin flex min-h-0 flex-1 flex-col overflow-y-auto bg-surface-50 p-3 dark:bg-surface-900">
          {route.view === 'overview' && <OverviewPage onNavigate={goTo} />}
          {route.view === 'agents' && (
            <AgentsPage key={route.id ?? 'agents'} selectedId={route.id} />
          )}
          {route.view === 'tasks' && <TasksPage selectedId={route.id} />}
          {route.view === 'approvals' && <ApprovalsPage />}
          {route.view === 'activity' && <ActivityPage />}
          {route.view === 'repositories' && <RepositoriesPage selectedId={route.id} />}
          {route.view === 'health' && <SystemHealthPage />}
          {route.view === 'settings' && <SettingsPage />}
        </main>
      </div>
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ControlCenterProvider>
        <Shell />
      </ControlCenterProvider>
    </ThemeProvider>
  );
}
