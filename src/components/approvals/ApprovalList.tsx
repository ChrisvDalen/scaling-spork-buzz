import { cn } from '@/lib/cn';
import { formatRelativeTime } from '@/lib/format';
import { APPROVAL_ACTION_LABELS } from '@/lib/policy';
import { APPROVAL_STATUS_META, RISK_META, TONE_CLASSES } from '@/lib/statusMeta';
import { EmptyState } from '@/components/ui/Panel';
import { Chip, StatusBadge } from '@/components/ui/StatusBadge';
import type { Agent, AgentId, ApprovalRequest, ApprovalRequestId } from '@/types';

export function ApprovalList({
  requests,
  agents,
  selectedId,
  onSelect,
  now,
}: {
  readonly requests: readonly ApprovalRequest[];
  readonly agents: ReadonlyMap<AgentId, Agent>;
  readonly selectedId?: ApprovalRequestId;
  readonly onSelect: (id: ApprovalRequestId) => void;
  readonly now: number;
}) {
  if (requests.length === 0) {
    return (
      <EmptyState
        title="Nothing waiting on a human."
        hint="Gated actions appear here the moment an agent requests one."
      />
    );
  }

  return (
    <ul className="divide-y divide-surface-100 dark:divide-surface-800">
      {requests.map((request) => {
        const agent = agents.get(request.agentId);
        const riskMeta = RISK_META[request.risk];
        const selected = selectedId === request.id;
        return (
          <li key={request.id}>
            <button
              type="button"
              onClick={() => onSelect(request.id)}
              className={cn(
                'w-full border-l-2 px-3 py-2 text-left transition-colors',
                TONE_CLASSES[riskMeta.tone].accent,
                selected
                  ? 'bg-blue-50 dark:bg-blue-500/10'
                  : 'hover:bg-surface-50 dark:hover:bg-surface-800',
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-2xs text-slate-500 dark:text-slate-500">
                  {request.id}
                </span>
                <StatusBadge meta={riskMeta} showDot={false} />
                {request.status !== 'pending' && (
                  <StatusBadge meta={APPROVAL_STATUS_META[request.status]} />
                )}
                <span className="tabular ml-auto text-2xs text-slate-400 dark:text-slate-600">
                  {formatRelativeTime(request.requestedAt, now)}
                </span>
              </div>
              <div className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-slate-800 dark:text-slate-200">
                {request.title}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <Chip>{APPROVAL_ACTION_LABELS[request.actionType]}</Chip>
                <Chip mono>{agent?.name ?? request.agentId}</Chip>
                {request.policyRules.map((rule) => (
                  <Chip key={rule} mono>
                    {rule}
                  </Chip>
                ))}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
