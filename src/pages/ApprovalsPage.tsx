import { useMemo, useState } from 'react';
import { ApprovalDetail } from '@/components/approvals/ApprovalDetail';
import { ApprovalList } from '@/components/approvals/ApprovalList';
import { SegmentedControl, Select } from '@/components/ui/Controls';
import { EmptyState, Panel } from '@/components/ui/Panel';
import { useNow } from '@/hooks/useNow';
import { POLICY_RULES } from '@/lib/policy';
import { RISK_META } from '@/lib/statusMeta';
import { Chip } from '@/components/ui/StatusBadge';
import { useAgentLookup, useControlCenter } from '@/state/ControlCenterContext';
import { RISK_LEVELS, type ApprovalRequestId, type RiskLevel } from '@/types';

type Scope = 'pending' | 'decided' | 'all';

export function ApprovalsPage() {
  const { data } = useControlCenter();
  const agentLookup = useAgentLookup();
  const now = useNow();

  const [scope, setScope] = useState<Scope>('pending');
  const [risk, setRisk] = useState<RiskLevel | 'all'>('all');
  const [selectedId, setSelectedId] = useState<ApprovalRequestId | null>(null);

  const filtered = useMemo(() => {
    const list = data.approvals.filter((request) => {
      if (scope === 'pending' && request.status !== 'pending') return false;
      if (scope === 'decided' && request.status === 'pending') return false;
      if (risk !== 'all' && request.risk !== risk) return false;
      return true;
    });
    const riskRank: Record<RiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...list].sort((a, b) => {
      const byRisk = riskRank[a.risk] - riskRank[b.risk];
      if (byRisk !== 0) return byRisk;
      return Date.parse(b.requestedAt) - Date.parse(a.requestedAt);
    });
  }, [data.approvals, scope, risk]);

  const selected = useMemo(() => {
    if (selectedId) {
      const match = data.approvals.find((request) => request.id === selectedId);
      if (match) return match;
    }
    return filtered[0];
  }, [data.approvals, filtered, selectedId]);

  const pendingCount = data.approvals.filter((request) => request.status === 'pending').length;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-2xs leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <span className="font-semibold">Human-in-the-loop.</span> Agents cannot merge to a protected
        branch, deploy to production, read secrets, change infrastructure, delete files in bulk,
        message anyone outside the workspace, or spend money on their own. Every such action stops
        here, and stays stopped until a person decides.{' '}
        <span className="font-medium">
          {POLICY_RULES.filter((rule) => !rule.overridable).length} of {POLICY_RULES.length} rules
          cannot be made autonomous by configuration.
        </span>
      </div>

      {/* Fixed viewport-relative height: master and detail each scroll on their
          own, so the decision controls stay reachable without scrolling the page. */}
      <div className="grid min-h-[34rem] gap-3 lg:h-[calc(100vh-14rem)] lg:grid-cols-[22rem_1fr]">
        <Panel
          title={`Requests (${filtered.length})`}
          subtitle={`${pendingCount} pending`}
          actions={
            <>
              <Select
                label="Risk"
                value={risk}
                onChange={(event) => setRisk(event.target.value as RiskLevel | 'all')}
              >
                <option value="all">All</option>
                {RISK_LEVELS.map((candidate) => (
                  <option key={candidate} value={candidate}>
                    {RISK_META[candidate].label}
                  </option>
                ))}
              </Select>
            </>
          }
          flush
          className="min-h-0"
          bodyClassName="scrollbar-thin overflow-y-auto"
        >
          <div className="border-b border-surface-200 px-3 py-2 dark:border-surface-700">
            <SegmentedControl
              value={scope}
              onChange={setScope}
              options={[
                { value: 'pending', label: `Pending (${pendingCount})` },
                { value: 'decided', label: 'Decided' },
                { value: 'all', label: 'All' },
              ]}
            />
          </div>
          <ApprovalList
            requests={filtered}
            agents={agentLookup}
            selectedId={selected?.id}
            onSelect={setSelectedId}
            now={now}
          />
        </Panel>

        <section className="panel flex min-h-0 flex-col">
          {selected ? (
            <ApprovalDetail request={selected} now={now} />
          ) : (
            <EmptyState
              title="No request selected."
              hint="Pick a request on the left to see the reason, impact, and exact change."
            />
          )}
        </section>
      </div>

      <Panel title="Active policy rules" subtitle="What always requires a human decision">
        <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {POLICY_RULES.map((rule) => (
            <li
              key={rule.id}
              className="rounded border border-surface-200 p-2 dark:border-surface-700"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-2xs text-slate-500 dark:text-slate-500">
                  {rule.id}
                </span>
                <Chip tone={RISK_META[rule.defaultRisk].tone}>
                  {RISK_META[rule.defaultRisk].label}
                </Chip>
                {!rule.overridable && <Chip tone="danger">Not overridable</Chip>}
              </div>
              <div className="mt-1 text-xs font-medium text-slate-800 dark:text-slate-200">
                {rule.title}
              </div>
              <p className="mt-0.5 text-2xs leading-relaxed text-slate-600 dark:text-slate-400">
                {rule.description}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
