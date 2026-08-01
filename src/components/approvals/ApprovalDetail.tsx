import { useState } from 'react';
import { cn } from '@/lib/cn';
import { formatRelativeTime, formatTimestampFull } from '@/lib/format';
import { APPROVAL_STATUS_META, RISK_META, TONE_CLASSES } from '@/lib/statusMeta';
import { APPROVAL_ACTION_LABELS, ruleById } from '@/lib/policy';
import { Button } from '@/components/ui/Controls';
import { CodeBlock, DiffView } from '@/components/ui/CodeBlock';
import { KeyValueGrid } from '@/components/ui/Panel';
import { Chip, StatusBadge } from '@/components/ui/StatusBadge';
import { IconCheck, IconEdit, IconReject } from '@/components/ui/Icon';
import { useControlCenter } from '@/state/ControlCenterContext';
import type { ApprovalRequest } from '@/types';

/**
 * Full context for one gated action.
 *
 * The decision controls sit below the evidence on purpose: an operator should
 * have scrolled past the diff or the command before reaching Approve.
 */
export function ApprovalDetail({
  request,
  now,
}: {
  readonly request: ApprovalRequest;
  readonly now: number;
}) {
  const { data, resolveApproval } = useControlCenter();
  const [comment, setComment] = useState('');

  const agent = data.agents.find((candidate) => candidate.id === request.agentId);
  const repository = request.repositoryId
    ? data.repositories.find((candidate) => candidate.id === request.repositoryId)
    : undefined;
  const task = request.taskId
    ? data.tasks.find((candidate) => candidate.id === request.taskId)
    : undefined;

  const riskMeta = RISK_META[request.risk];
  const decided = request.status !== 'pending';

  const submit = (resolution: 'approve' | 'reject' | 'request_changes') => {
    void resolveApproval(request.id, resolution, comment.trim() || undefined);
    setComment('');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        <section
          className={cn(
            'border-b border-l-2 border-surface-200 px-4 py-3 dark:border-surface-700',
            TONE_CLASSES[riskMeta.tone].accent,
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-2xs text-slate-500 dark:text-slate-500">
              {request.id}
            </span>
            <StatusBadge meta={APPROVAL_STATUS_META[request.status]} />
            <StatusBadge meta={riskMeta} showDot={false} />
            <Chip>{APPROVAL_ACTION_LABELS[request.actionType]}</Chip>
          </div>
          <h2 className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {request.title}
          </h2>
          <div className="mt-2">
            <KeyValueGrid
              columns={4}
              items={[
                { label: 'Requesting agent', value: agent?.name ?? request.agentId },
                { label: 'Repository', value: repository?.name ?? '—' },
                { label: 'Task', value: task?.issueKey ?? task?.id ?? '—' },
                {
                  label: 'Requested',
                  value: (
                    <span title={formatTimestampFull(request.requestedAt)}>
                      {formatRelativeTime(request.requestedAt, now)}
                    </span>
                  ),
                },
              ]}
            />
          </div>
          {request.expiresAt && !decided && (
            <p className="mt-2 text-2xs text-slate-500 dark:text-slate-500">
              Expires {formatRelativeTime(request.expiresAt, now)}. An expired request is not
              executed; the agent stays blocked until it is raised again.
            </p>
          )}
        </section>

        <section className="border-b border-surface-200 px-4 py-3 dark:border-surface-700">
          <h3 className="mb-1 text-2xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Reason given by the agent
          </h3>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            {request.reason}
          </p>
        </section>

        <section className="border-b border-surface-200 px-4 py-3 dark:border-surface-700">
          <h3 className="mb-1 text-2xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Impact if approved
          </h3>
          <p
            className={cn(
              'rounded border p-2 text-xs leading-relaxed',
              request.risk === 'critical' || request.risk === 'high'
                ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
                : 'border-surface-200 bg-surface-50 text-slate-700 dark:border-surface-700 dark:bg-surface-800 dark:text-slate-300',
            )}
          >
            {request.impact}
          </p>
        </section>

        <section className="border-b border-surface-200 px-4 py-3 dark:border-surface-700">
          <h3 className="mb-1 text-2xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Proposed change
          </h3>
          <p className="mb-2 text-xs text-slate-700 dark:text-slate-300">
            {request.proposedChange.summary}
          </p>

          {request.proposedChange.command && (
            <div className="mb-2">
              <div className="mb-1 text-2xs text-slate-500 dark:text-slate-500">Command preview</div>
              <CodeBlock maxHeight="8rem">{request.proposedChange.command}</CodeBlock>
            </div>
          )}

          {request.proposedChange.diff && (
            <div className="mb-2">
              <div className="mb-1 text-2xs text-slate-500 dark:text-slate-500">Diff preview</div>
              <DiffView diff={request.proposedChange.diff} />
            </div>
          )}

          {request.proposedChange.affectedPaths.length > 0 && (
            <div>
              <div className="mb-1 text-2xs text-slate-500 dark:text-slate-500">
                Affected paths ({request.proposedChange.affectedPaths.length})
              </div>
              <ul className="space-y-0.5">
                {request.proposedChange.affectedPaths.map((path) => (
                  <li
                    key={path}
                    className="truncate font-mono text-2xs text-slate-600 dark:text-slate-400"
                  >
                    {path}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(request.proposedChange.targetBranch || request.proposedChange.targetEnvironment) && (
            <div className="mt-2 flex gap-1.5">
              {request.proposedChange.targetBranch && (
                <Chip mono>branch: {request.proposedChange.targetBranch}</Chip>
              )}
              {request.proposedChange.targetEnvironment && (
                <Chip tone="danger">environment: {request.proposedChange.targetEnvironment}</Chip>
              )}
            </div>
          )}
        </section>

        <section className="border-b border-surface-200 px-4 py-3 dark:border-surface-700">
          <h3 className="mb-1.5 text-2xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Policy rules that raised this
          </h3>
          <ul className="space-y-1.5">
            {request.policyRules.map((ruleId) => {
              const rule = ruleById(ruleId);
              return (
                <li
                  key={ruleId}
                  className="rounded border border-surface-200 p-2 dark:border-surface-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xs text-slate-500 dark:text-slate-500">
                      {ruleId}
                    </span>
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {rule?.title ?? 'Unknown rule'}
                    </span>
                    {rule && !rule.overridable && <Chip tone="danger">Not overridable</Chip>}
                  </div>
                  {rule && (
                    <p className="mt-1 text-2xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {rule.description}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {request.decision && (
          <section className="border-b border-surface-200 px-4 py-3 dark:border-surface-700">
            <h3 className="mb-1 text-2xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Decision
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              <span className="font-medium">{request.decision.decidedBy}</span>{' '}
              {APPROVAL_STATUS_META[request.status].label.toLowerCase()} this request{' '}
              {formatRelativeTime(request.decision.decidedAt, now)}.
            </p>
            {request.decision.comment && (
              <p className="mt-1 rounded border border-surface-200 bg-surface-50 p-2 text-2xs italic text-slate-600 dark:border-surface-700 dark:bg-surface-800 dark:text-slate-400">
                {request.decision.comment}
              </p>
            )}
          </section>
        )}
      </div>

      <footer className="shrink-0 border-t border-surface-200 bg-surface-50 px-4 py-3 dark:border-surface-700 dark:bg-surface-800">
        {decided ? (
          <p className="text-2xs text-slate-500 dark:text-slate-500">
            This request is closed. Reopening requires the agent to raise it again.
          </p>
        ) : (
          <div className="space-y-2">
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={2}
              placeholder="Comment recorded with the decision (optional for approve, expected for reject)"
              className="w-full rounded border border-surface-300 bg-white px-2 py-1.5 text-2xs text-slate-700 placeholder:text-slate-400 dark:border-surface-700 dark:bg-surface-850 dark:text-slate-200 dark:placeholder:text-slate-600"
            />
            <div className="flex flex-wrap items-center gap-1.5">
              <Button variant="primary" size="md" icon={<IconCheck />} onClick={() => submit('approve')}>
                Approve
              </Button>
              <Button variant="danger" size="md" icon={<IconReject />} onClick={() => submit('reject')}>
                Reject
              </Button>
              <Button size="md" icon={<IconEdit />} onClick={() => submit('request_changes')}>
                Request changes
              </Button>
              <span className="ml-auto text-2xs text-slate-500 dark:text-slate-500">
                Decision is attributed to the signed-in operator and recorded on the timeline.
              </span>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}
