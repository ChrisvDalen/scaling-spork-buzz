import { useMemo, useState } from 'react';
import { ActivityTimeline } from '@/components/activity/ActivityTimeline';
import { AgentDetailDrawer } from '@/components/agents/AgentDetailDrawer';
import { Button, SearchInput, Select } from '@/components/ui/Controls';
import { Panel } from '@/components/ui/Panel';
import { useNow } from '@/hooks/useNow';
import { ACTIVITY_EVENT_META, SEVERITY_META } from '@/lib/statusMeta';
import { useAgentLookup, useControlCenter, useRepositoryLookup } from '@/state/ControlCenterContext';
import {
  ACTIVITY_EVENT_TYPES,
  SEVERITY_ORDER,
  TIME_WINDOWS,
  TIME_WINDOW_MS,
  type ActivityEventType,
  type AgentId,
  type Severity,
  type TimeWindow,
} from '@/types';

const WINDOW_LABELS: Record<TimeWindow, string> = {
  '15m': 'Last 15 minutes',
  '1h': 'Last hour',
  '6h': 'Last 6 hours',
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  all: 'All time',
};

export function ActivityPage() {
  const { data } = useControlCenter();
  const agentLookup = useAgentLookup();
  const repositoryLookup = useRepositoryLookup();
  const now = useNow();

  const [agent, setAgent] = useState<string>('all');
  const [task, setTask] = useState<string>('all');
  const [repository, setRepository] = useState<string>('all');
  const [type, setType] = useState<ActivityEventType | 'all'>('all');
  const [severity, setSeverity] = useState<Severity | 'all'>('all');
  const [window, setWindow] = useState<TimeWindow>('24h');
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const minSeverityIndex = severity === 'all' ? -1 : SEVERITY_ORDER.indexOf(severity);
    const cutoff = window === 'all' ? 0 : now - TIME_WINDOW_MS[window];

    return data.events.filter((event) => {
      if (agent !== 'all' && event.agentId !== agent) return false;
      if (task !== 'all' && event.taskId !== task) return false;
      if (repository !== 'all' && event.repositoryId !== repository) return false;
      if (type !== 'all' && event.type !== type) return false;
      if (minSeverityIndex >= 0 && SEVERITY_ORDER.indexOf(event.severity) < minSeverityIndex) {
        return false;
      }
      if (cutoff > 0 && Date.parse(event.timestamp) < cutoff) return false;
      if (needle) {
        const haystack = `${event.message} ${event.detail ?? ''}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [data.events, agent, task, repository, type, severity, window, search, now]);

  const resetFilters = () => {
    setAgent('all');
    setTask('all');
    setRepository('all');
    setType('all');
    setSeverity('all');
    setWindow('24h');
    setSearch('');
  };

  const typeGroups = useMemo(() => {
    const groups = new Map<string, ActivityEventType[]>();
    for (const candidate of ACTIVITY_EVENT_TYPES) {
      const group = ACTIVITY_EVENT_META[candidate].group;
      const existing = groups.get(group);
      if (existing) existing.push(candidate);
      else groups.set(group, [candidate]);
    }
    return groups;
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <Panel title="Filters" bodyClassName="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search message or detail" />
        <Select label="Agent" value={agent} onChange={(event) => setAgent(event.target.value)}>
          <option value="all">All agents</option>
          {data.agents.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.name}
            </option>
          ))}
        </Select>
        <Select label="Task" value={task} onChange={(event) => setTask(event.target.value)}>
          <option value="all">All tasks</option>
          {data.tasks.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.issueKey ?? candidate.id}
            </option>
          ))}
        </Select>
        <Select
          label="Repository"
          value={repository}
          onChange={(event) => setRepository(event.target.value)}
        >
          <option value="all">All repositories</option>
          {data.repositories.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.name}
            </option>
          ))}
        </Select>
        <Select
          label="Event type"
          value={type}
          onChange={(event) => setType(event.target.value as ActivityEventType | 'all')}
        >
          <option value="all">All types</option>
          {[...typeGroups.entries()].map(([group, types]) => (
            <optgroup key={group} label={group}>
              {types.map((candidate) => (
                <option key={candidate} value={candidate}>
                  {ACTIVITY_EVENT_META[candidate].label}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
        <Select
          label="Min severity"
          value={severity}
          onChange={(event) => setSeverity(event.target.value as Severity | 'all')}
        >
          <option value="all">Any</option>
          {SEVERITY_ORDER.map((candidate) => (
            <option key={candidate} value={candidate}>
              {SEVERITY_META[candidate].label}
            </option>
          ))}
        </Select>
        <Select
          label="Window"
          value={window}
          onChange={(event) => setWindow(event.target.value as TimeWindow)}
        >
          {TIME_WINDOWS.map((candidate) => (
            <option key={candidate} value={candidate}>
              {WINDOW_LABELS[candidate]}
            </option>
          ))}
        </Select>
        <Button onClick={resetFilters}>Reset</Button>
      </Panel>

      <Panel
        title={`Timeline (${filtered.length} of ${data.events.length} events)`}
        subtitle={WINDOW_LABELS[window]}
        className="h-[calc(100vh-15rem)] min-h-[24rem]"
        bodyClassName="scrollbar-thin overflow-y-auto"
        flush
      >
        <ActivityTimeline
          events={filtered}
          agents={agentLookup}
          repositories={repositoryLookup}
          now={now}
          onSelectAgent={setSelectedAgent}
        />
      </Panel>

      <AgentDetailDrawer agentId={selectedAgent} onClose={() => setSelectedAgent(null)} now={now} />
    </div>
  );
}
