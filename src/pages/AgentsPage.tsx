import { useMemo, useState } from 'react';
import { AgentCard } from '@/components/agents/AgentCard';
import { AgentDetailDrawer } from '@/components/agents/AgentDetailDrawer';
import { AgentTable } from '@/components/agents/AgentTable';
import { SearchInput, SegmentedControl, Select } from '@/components/ui/Controls';
import { EmptyState, Panel } from '@/components/ui/Panel';
import { useNow } from '@/hooks/useNow';
import { AGENT_STATUS_META } from '@/lib/statusMeta';
import { useControlCenter, useRepositoryLookup } from '@/state/ControlCenterContext';
import { AGENT_STATUSES, agentId as toAgentId, type AgentId, type AgentStatus } from '@/types';

type ViewMode = 'table' | 'cards';

export function AgentsPage({ selectedId }: { readonly selectedId?: string }) {
  const { data } = useControlCenter();
  const repositoryLookup = useRepositoryLookup();
  const now = useNow();

  const [mode, setMode] = useState<ViewMode>('table');
  const [status, setStatus] = useState<AgentStatus | 'all'>('all');
  const [repository, setRepository] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AgentId | null>(
    selectedId ? toAgentId(selectedId) : null,
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return data.agents.filter((agent) => {
      if (status !== 'all' && agent.status !== status) return false;
      if (repository !== 'all' && agent.repositoryId !== repository) return false;
      if (needle) {
        const haystack =
          `${agent.name} ${agent.roleLabel} ${agent.specialization} ${agent.currentTaskTitle ?? ''} ${agent.branch ?? ''}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [data.agents, status, repository, search]);

  const counts = useMemo(() => {
    const map = new Map<AgentStatus, number>();
    for (const agent of data.agents) {
      map.set(agent.status, (map.get(agent.status) ?? 0) + 1);
    }
    return map;
  }, [data.agents]);

  return (
    <div className="space-y-3">
      <Panel
        title={`Agents (${filtered.length} of ${data.agents.length})`}
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder="Filter agents" />
            <Select
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value as AgentStatus | 'all')}
            >
              <option value="all">All ({data.agents.length})</option>
              {AGENT_STATUSES.map((candidate) => (
                <option key={candidate} value={candidate}>
                  {AGENT_STATUS_META[candidate].label} ({counts.get(candidate) ?? 0})
                </option>
              ))}
            </Select>
            <Select
              label="Repository"
              value={repository}
              onChange={(event) => setRepository(event.target.value)}
            >
              <option value="all">All</option>
              {data.repositories.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </Select>
            <SegmentedControl
              value={mode}
              onChange={setMode}
              options={[
                { value: 'table', label: 'Table' },
                { value: 'cards', label: 'Cards' },
              ]}
            />
          </>
        }
        flush={mode === 'table'}
      >
        {mode === 'table' ? (
          <AgentTable
            agents={filtered}
            repositories={repositoryLookup}
            selectedId={selected ?? undefined}
            onSelect={setSelected}
            now={now}
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="No agents match the current filter." />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                repositories={repositoryLookup}
                selected={selected === agent.id}
                onSelect={setSelected}
                now={now}
              />
            ))}
          </div>
        )}
      </Panel>

      <AgentDetailDrawer agentId={selected} onClose={() => setSelected(null)} now={now} />
    </div>
  );
}
