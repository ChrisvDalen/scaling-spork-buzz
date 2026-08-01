import { Button, SegmentedControl } from '@/components/ui/Controls';
import { KeyValueGrid, Panel } from '@/components/ui/Panel';
import { Chip } from '@/components/ui/StatusBadge';
import { POLICY_RULES } from '@/lib/policy';
import { services } from '@/services';
import { resetState } from '@/services/mock/store';
import { useControlCenter } from '@/state/ControlCenterContext';
import { useTheme } from '@/state/ThemeContext';

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { data } = useControlCenter();

  return (
    <div className="space-y-3">
      <Panel title="Appearance">
        <div className="flex items-center gap-3">
          <span className="text-2xs uppercase tracking-wider text-slate-500 dark:text-slate-500">
            Theme
          </span>
          <SegmentedControl
            value={theme}
            onChange={(next) => {
              if (next !== theme) toggleTheme();
            }}
            options={[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
            ]}
          />
          <span className="text-2xs text-slate-500 dark:text-slate-500">
            Stored per browser. The initial value follows the operating system preference.
          </span>
        </div>
      </Panel>

      <Panel title="Data source" subtitle="Which implementation the console is talking to">
        <KeyValueGrid
          columns={3}
          items={[
            { label: 'Service implementation', value: <Chip mono>{services.kind}</Chip> },
            { label: 'Transport', value: <Chip mono>{data.health.stream.transport}</Chip> },
            { label: 'Stream state', value: <Chip mono>{data.health.stream.state}</Chip> },
            { label: 'Agents loaded', value: String(data.agents.length) },
            { label: 'Tasks loaded', value: String(data.tasks.length) },
            { label: 'Events loaded', value: String(data.events.length) },
          ]}
        />
        <p className="mt-3 text-2xs leading-relaxed text-slate-600 dark:text-slate-400">
          Every screen reads through the service interfaces in{' '}
          <code className="font-mono">src/services/types.ts</code>. Pointing the console at a real
          control plane means providing an implementation of those interfaces and changing the one
          export in <code className="font-mono">src/services/index.ts</code>. No component imports
          fixture data directly.
        </p>
        <div className="mt-3">
          <Button onClick={() => resetState()}>Reset local state to fixtures</Button>
          <span className="ml-2 text-2xs text-slate-500 dark:text-slate-500">
            Discards operator actions taken in this session and reloads the shipped dataset.
          </span>
        </div>
      </Panel>

      <Panel
        title="Safety policy"
        subtitle={`${POLICY_RULES.length} rules, ${POLICY_RULES.filter((rule) => !rule.overridable).length} of which cannot be made autonomous`}
        flush
      >
        <div className="scrollbar-thin overflow-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Rule</th>
                <th scope="col">Title</th>
                <th scope="col">Gated capabilities</th>
                <th scope="col">Default risk</th>
                <th scope="col">Overridable</th>
              </tr>
            </thead>
            <tbody>
              {POLICY_RULES.map((rule) => (
                <tr key={rule.id}>
                  <td className="font-mono text-2xs text-slate-500 dark:text-slate-500">{rule.id}</td>
                  <td className="max-w-[24rem]">
                    <div className="text-xs text-slate-800 dark:text-slate-200">{rule.title}</div>
                    <div className="text-2xs text-slate-500 dark:text-slate-500">
                      {rule.description}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {rule.capabilities.map((capability) => (
                        <Chip key={capability} mono>
                          {capability}
                        </Chip>
                      ))}
                    </div>
                  </td>
                  <td className="text-slate-600 dark:text-slate-400">{rule.defaultRisk}</td>
                  <td>
                    {rule.overridable ? (
                      <Chip>Per repository</Chip>
                    ) : (
                      <Chip tone="danger">Never</Chip>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="About this build">
        <ul className="space-y-1 text-2xs leading-relaxed text-slate-600 dark:text-slate-400">
          <li>
            Agent Control Center is an operations console. It observes and controls agents; it does
            not run them.
          </li>
          <li>
            All data in this build comes from local fixtures. Nothing is fetched, nothing is sent,
            and no timer fabricates agent activity: the only recurring timer moves the clock so
            relative timestamps stay accurate.
          </li>
          <li>
            Operator commands and approval decisions mutate in-memory state so the interaction can
            be evaluated end to end. They are lost on reload.
          </li>
        </ul>
      </Panel>
    </div>
  );
}
