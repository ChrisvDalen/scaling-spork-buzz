import { useMemo, useState } from 'react';
import { AgentDetailDrawer } from '@/components/agents/AgentDetailDrawer';
import { RepositoryPanel } from '@/components/repositories/RepositoryPanel';
import { Select } from '@/components/ui/Controls';
import { Panel } from '@/components/ui/Panel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useNow } from '@/hooks/useNow';
import { formatNumber, formatRelativeTime } from '@/lib/format';
import { PIPELINE_STATUS_META, TEST_STATUS_META } from '@/lib/statusMeta';
import { useAgentLookup, useControlCenter } from '@/state/ControlCenterContext';
import type { AgentId } from '@/types';

export function RepositoriesPage({ selectedId }: { readonly selectedId?: string }) {
  const { data } = useControlCenter();
  const agentLookup = useAgentLookup();
  const now = useNow();
  const [filter, setFilter] = useState<string>(selectedId ?? 'all');
  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null);

  const visible = useMemo(
    () =>
      filter === 'all'
        ? data.repositories
        : data.repositories.filter((repository) => repository.id === filter),
    [data.repositories, filter],
  );

  return (
    <div className="space-y-3">
      <Panel
        title="Repository overview"
        subtitle={`${data.repositories.length} repositories under agent control`}
        actions={
          <Select label="Repository" value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">All</option>
            {data.repositories.map((repository) => (
              <option key={repository.id} value={repository.id}>
                {repository.name}
              </option>
            ))}
          </Select>
        }
        flush
      >
        <div className="scrollbar-thin overflow-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Repository</th>
                <th scope="col">Language</th>
                <th scope="col" className="text-right">
                  Agents
                </th>
                <th scope="col" className="text-right">
                  Branches
                </th>
                <th scope="col" className="text-right">
                  Open PRs
                </th>
                <th scope="col">Tests</th>
                <th scope="col">Last pipeline</th>
                <th scope="col" className="text-right">
                  Changed files
                </th>
                <th scope="col" className="text-right">
                  Blockers
                </th>
              </tr>
            </thead>
            <tbody>
              {data.repositories.map((repository) => {
                const run = data.pipelineRuns.find(
                  (candidate) => candidate.id === repository.lastPipelineRunId,
                );
                return (
                  <tr
                    key={repository.id}
                    onClick={() => setFilter(repository.id)}
                    className="cursor-pointer"
                  >
                    <td className="font-medium text-slate-800 dark:text-slate-200">
                      {repository.name}
                    </td>
                    <td className="text-slate-600 dark:text-slate-400">{repository.language}</td>
                    <td className="tabular text-right text-slate-600 dark:text-slate-400">
                      {repository.activeAgentIds.length}
                    </td>
                    <td className="tabular text-right text-slate-600 dark:text-slate-400">
                      {repository.branches.length}
                    </td>
                    <td className="tabular text-right text-slate-600 dark:text-slate-400">
                      {repository.openPullRequestIds.length}
                    </td>
                    <td>
                      <StatusBadge meta={TEST_STATUS_META[repository.tests.status]} />
                    </td>
                    <td>
                      {run ? (
                        <div className="flex items-center gap-1.5">
                          <StatusBadge meta={PIPELINE_STATUS_META[run.status]} />
                          <span className="tabular text-2xs text-slate-500 dark:text-slate-500">
                            {formatRelativeTime(run.startedAt, now)}
                          </span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="tabular text-right text-slate-600 dark:text-slate-400">
                      {formatNumber(repository.changedFileCount)}
                    </td>
                    <td
                      className={
                        repository.blockers.length > 0
                          ? 'tabular text-right font-medium text-amber-700 dark:text-amber-400'
                          : 'tabular text-right text-slate-500 dark:text-slate-500'
                      }
                    >
                      {repository.blockers.length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-3 2xl:grid-cols-2">
        {visible.map((repository) => (
          <RepositoryPanel
            key={repository.id}
            repository={repository}
            pullRequests={data.pullRequests.filter(
              (pr) => pr.repositoryId === repository.id,
            )}
            pipelineRun={data.pipelineRuns.find(
              (run) => run.id === repository.lastPipelineRunId,
            )}
            agents={agentLookup}
            onSelectAgent={setSelectedAgent}
            now={now}
          />
        ))}
      </div>

      <AgentDetailDrawer agentId={selectedAgent} onClose={() => setSelectedAgent(null)} now={now} />
    </div>
  );
}
