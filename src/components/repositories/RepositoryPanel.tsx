import { cn } from '@/lib/cn';
import {
  formatDuration,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  shortSha,
} from '@/lib/format';
import {
  PIPELINE_STATUS_META,
  PR_STATE_META,
  TEST_STATUS_META,
  TONE_CLASSES,
} from '@/lib/statusMeta';
import { Panel } from '@/components/ui/Panel';
import { Chip, StatusBadge, StatusDot } from '@/components/ui/StatusBadge';
import { IconExternal } from '@/components/ui/Icon';
import type {
  Agent,
  AgentId,
  PipelineRun,
  PullRequest,
  Repository,
} from '@/types';

const KIND_LABELS: Record<Repository['kind'], string> = {
  java_service: 'Java / Spring Boot',
  frontend: 'Angular frontend',
  platform: 'Platform / CI-CD',
  infrastructure: 'Infrastructure',
  agent_config: 'Agent configuration',
};

export function RepositoryPanel({
  repository,
  pullRequests,
  pipelineRun,
  agents,
  onSelectAgent,
  now,
}: {
  readonly repository: Repository;
  readonly pullRequests: readonly PullRequest[];
  readonly pipelineRun?: PipelineRun;
  readonly agents: ReadonlyMap<AgentId, Agent>;
  readonly onSelectAgent: (id: AgentId) => void;
  readonly now: number;
}) {
  const testMeta = TEST_STATUS_META[repository.tests.status];

  return (
    <Panel
      title={repository.name}
      subtitle={`${KIND_LABELS[repository.kind]} · ${repository.language}`}
      actions={
        <>
          <StatusBadge meta={testMeta} />
          <a
            href={repository.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded border border-surface-300 px-1.5 py-0.5 text-2xs text-blue-700 hover:bg-surface-50 dark:border-surface-700 dark:text-blue-300 dark:hover:bg-surface-800"
          >
            Open
            <IconExternal size={11} />
          </a>
        </>
      }
      bodyClassName="space-y-3"
    >
      <p className="text-2xs leading-relaxed text-slate-600 dark:text-slate-400">
        {repository.description}
      </p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        <Stat label="Active agents" value={formatNumber(repository.activeAgentIds.length)} />
        <Stat label="Active branches" value={formatNumber(repository.branches.length)} />
        <Stat label="Open pull requests" value={formatNumber(repository.openPullRequestIds.length)} />
        <Stat label="Changed files" value={formatNumber(repository.changedFileCount)} />
      </div>

      <div className="flex flex-wrap gap-1">
        {repository.activeAgentIds.map((id) => {
          const agent = agents.get(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectAgent(id)}
              className="inline-flex items-center gap-1 rounded border border-surface-200 px-1.5 py-0.5 font-mono text-2xs text-slate-600 hover:bg-surface-50 dark:border-surface-700 dark:text-slate-400 dark:hover:bg-surface-800"
            >
              {agent?.name ?? id}
            </button>
          );
        })}
      </div>

      <Section title="Test status">
        <div className="flex flex-wrap items-center gap-3 text-2xs text-slate-600 dark:text-slate-400">
          <span className="tabular">
            {formatNumber(repository.tests.passed)} passed
          </span>
          <span
            className={cn(
              'tabular',
              repository.tests.failed > 0 && 'text-red-600 dark:text-red-400',
            )}
          >
            {formatNumber(repository.tests.failed)} failed
          </span>
          <span className="tabular">{formatNumber(repository.tests.skipped)} skipped</span>
          {repository.tests.coveragePercent !== undefined && (
            <span className="tabular">
              coverage {formatPercent(repository.tests.coveragePercent, 1)}
            </span>
          )}
          <span className="ml-auto">
            last run {formatRelativeTime(repository.tests.lastRunAt, now)}
          </span>
        </div>
      </Section>

      {pipelineRun && (
        <Section title="Last pipeline">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge meta={PIPELINE_STATUS_META[pipelineRun.status]} />
            <span className="font-mono text-2xs text-slate-600 dark:text-slate-400">
              {pipelineRun.workflow} #{pipelineRun.runNumber}
            </span>
            <span className="font-mono text-2xs text-slate-500 dark:text-slate-500">
              {shortSha(pipelineRun.commitSha)}
            </span>
            <span className="text-2xs text-slate-500 dark:text-slate-500">
              {pipelineRun.triggeredBy}
            </span>
            <span className="tabular ml-auto text-2xs text-slate-500 dark:text-slate-500">
              {formatRelativeTime(pipelineRun.startedAt, now)}
              {pipelineRun.durationMs ? ` · ${formatDuration(pipelineRun.durationMs)}` : ''}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {pipelineRun.stages.map((stage) => (
              <span
                key={stage.name}
                title={`${stage.name}: ${stage.status}`}
                className={cn(
                  'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-2xs',
                  TONE_CLASSES[PIPELINE_STATUS_META[stage.status].tone].badge,
                )}
              >
                <StatusDot
                  tone={PIPELINE_STATUS_META[stage.status].tone}
                  live={stage.status === 'running'}
                />
                {stage.name}
                {stage.durationMs ? (
                  <span className="tabular opacity-70">{formatDuration(stage.durationMs)}</span>
                ) : null}
              </span>
            ))}
          </div>
          {pipelineRun.failureSummary && (
            <p className="mt-1.5 rounded border border-red-200 bg-red-50 p-1.5 text-2xs text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {pipelineRun.failureSummary}
            </p>
          )}
        </Section>
      )}

      <Section title={`Branches (${repository.branches.length})`}>
        <div className="scrollbar-thin overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Branch</th>
              <th scope="col">Owner</th>
              <th scope="col" className="text-right">
                Ahead / behind
              </th>
              <th scope="col" className="text-right">
                Last commit
              </th>
            </tr>
          </thead>
          <tbody>
            {repository.branches.map((branch) => (
              <tr key={branch.name}>
                <td className="max-w-[18rem] truncate font-mono text-2xs text-slate-700 dark:text-slate-300">
                  {branch.name}
                  {branch.hasOpenPullRequest && (
                    <Chip tone="info" className="ml-1.5">
                      PR
                    </Chip>
                  )}
                </td>
                <td className="font-mono text-2xs text-slate-600 dark:text-slate-400">
                  {branch.ownerAgentId ? (agents.get(branch.ownerAgentId)?.name ?? '—') : '—'}
                </td>
                <td className="tabular text-right text-2xs text-slate-600 dark:text-slate-400">
                  +{branch.ahead} / -{branch.behind}
                </td>
                <td className="tabular text-right text-2xs text-slate-500 dark:text-slate-500">
                  {formatRelativeTime(branch.lastCommitAt, now)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Section>

      {pullRequests.length > 0 && (
        <Section title={`Open pull requests (${pullRequests.length})`}>
          <div className="scrollbar-thin overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">PR</th>
                <th scope="col">Title</th>
                <th scope="col">State</th>
                <th scope="col">Checks</th>
                <th scope="col" className="text-right">
                  Changes
                </th>
                <th scope="col" className="text-right">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {pullRequests.map((pr) => (
                <tr key={pr.id}>
                  <td className="whitespace-nowrap font-mono text-2xs text-slate-500 dark:text-slate-500">
                    #{pr.number}
                  </td>
                  <td className="max-w-[22rem]">
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-2xs text-slate-800 hover:underline dark:text-slate-200"
                    >
                      {pr.title}
                    </a>
                    <span className="font-mono text-2xs text-slate-500 dark:text-slate-500">
                      {pr.authorName}
                    </span>
                  </td>
                  <td>
                    <StatusBadge meta={PR_STATE_META[pr.state]} />
                  </td>
                  <td>
                    <StatusBadge meta={PIPELINE_STATUS_META[pr.checksStatus]} />
                  </td>
                  <td className="tabular whitespace-nowrap text-right text-2xs">
                    <span className="text-emerald-600 dark:text-emerald-400">+{pr.additions}</span>{' '}
                    <span className="text-red-600 dark:text-red-400">-{pr.deletions}</span>
                  </td>
                  <td className="tabular text-right text-2xs text-slate-500 dark:text-slate-500">
                    {formatRelativeTime(pr.updatedAt, now)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Section>
      )}

      <Section title={`Recent commits (${repository.recentCommits.length})`}>
        <ul className="space-y-1">
          {repository.recentCommits.map((commit) => (
            <li key={commit.sha} className="flex items-baseline gap-2 text-2xs">
              <span className="font-mono text-slate-500 dark:text-slate-500">
                {shortSha(commit.sha)}
              </span>
              <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-300">
                {commit.message}
              </span>
              <span className="shrink-0 font-mono text-slate-500 dark:text-slate-500">
                {commit.author}
              </span>
              <span className="tabular shrink-0 text-slate-400 dark:text-slate-600">
                {formatRelativeTime(commit.committedAt, now)}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {repository.blockers.length > 0 && (
        <Section title={`Blockers (${repository.blockers.length})`}>
          <ul className="space-y-1">
            {repository.blockers.map((blocker) => (
              <li
                key={blocker}
                className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-2xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
              >
                {blocker}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="flex flex-wrap gap-1 border-t border-surface-100 pt-2 dark:border-surface-800">
        <span className="text-2xs text-slate-500 dark:text-slate-500">Protected:</span>
        {repository.protectedBranches.map((branch) => (
          <Chip key={branch} mono tone="danger">
            {branch}
          </Chip>
        ))}
      </div>
    </Panel>
  );
}

function Stat({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <div className="text-2xs uppercase tracking-wider text-slate-500 dark:text-slate-500">
        {label}
      </div>
      <div className="tabular text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="border-t border-surface-100 pt-2 dark:border-surface-800">
      <h3 className="mb-1.5 text-2xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      {children}
    </section>
  );
}
