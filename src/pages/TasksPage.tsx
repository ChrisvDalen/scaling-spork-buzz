import { useMemo, useState } from 'react';
import { AgentDetailDrawer } from '@/components/agents/AgentDetailDrawer';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { TaskDetailDrawer } from '@/components/tasks/TaskDetailDrawer';
import { TaskTable } from '@/components/tasks/TaskTable';
import { SearchInput, SegmentedControl, Select } from '@/components/ui/Controls';
import { Panel } from '@/components/ui/Panel';
import { useNow } from '@/hooks/useNow';
import { PRIORITY_META } from '@/lib/statusMeta';
import {
  useAgentLookup,
  useControlCenter,
  useRepositoryLookup,
} from '@/state/ControlCenterContext';
import {
  PRIORITIES,
  agentId as toAgentId,
  taskId as toTaskId,
  type AgentId,
  type Priority,
  type TaskId,
} from '@/types';

type ViewMode = 'board' | 'table';

export function TasksPage({ selectedId }: { readonly selectedId?: string }) {
  const { data } = useControlCenter();
  const agentLookup = useAgentLookup();
  const repositoryLookup = useRepositoryLookup();
  const now = useNow();

  const [mode, setMode] = useState<ViewMode>('board');
  const [priority, setPriority] = useState<Priority | 'all'>('all');
  const [repository, setRepository] = useState<string>('all');
  const [agent, setAgent] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState<TaskId | null>(
    selectedId ? toTaskId(selectedId) : null,
  );
  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return data.tasks.filter((task) => {
      if (priority !== 'all' && task.priority !== priority) return false;
      if (repository !== 'all' && task.repositoryId !== repository) return false;
      if (agent !== 'all' && task.assignedAgentId !== agent) return false;
      if (needle) {
        const haystack =
          `${task.title} ${task.description} ${task.issueKey ?? ''} ${task.labels.join(' ')}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [data.tasks, priority, repository, agent, search]);

  const sortedForTable = useMemo(
    () => [...filtered].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    [filtered],
  );

  return (
    <div className="flex flex-col gap-3">
      <Panel
        title={`Tasks (${filtered.length} of ${data.tasks.length})`}
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder="Filter tasks" />
            <Select
              label="Priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value as Priority | 'all')}
            >
              <option value="all">All</option>
              {PRIORITIES.map((candidate) => (
                <option key={candidate} value={candidate}>
                  {PRIORITY_META[candidate].label}
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
            <Select label="Agent" value={agent} onChange={(event) => setAgent(event.target.value)}>
              <option value="all">All</option>
              {data.agents.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </Select>
            <SegmentedControl
              value={mode}
              onChange={setMode}
              options={[
                { value: 'board', label: 'Board' },
                { value: 'table', label: 'Table' },
              ]}
            />
          </>
        }
        flush={mode === 'table'}
        className={mode === 'board' ? 'h-[calc(100vh-11rem)] min-h-[28rem]' : undefined}
        bodyClassName={mode === 'board' ? 'p-2' : undefined}
      >
        {mode === 'board' ? (
          <TaskBoard
            tasks={filtered}
            agents={agentLookup}
            selectedId={selectedTask ?? undefined}
            onSelect={setSelectedTask}
            now={now}
          />
        ) : (
          <TaskTable
            tasks={sortedForTable}
            agents={agentLookup}
            repositories={repositoryLookup}
            selectedId={selectedTask ?? undefined}
            onSelect={setSelectedTask}
            now={now}
          />
        )}
      </Panel>

      <TaskDetailDrawer
        taskId={selectedTask}
        onClose={() => setSelectedTask(null)}
        onOpenAgent={(id) => {
          setSelectedTask(null);
          setSelectedAgent(toAgentId(id));
        }}
        now={now}
      />
      <AgentDetailDrawer agentId={selectedAgent} onClose={() => setSelectedAgent(null)} now={now} />
    </div>
  );
}
