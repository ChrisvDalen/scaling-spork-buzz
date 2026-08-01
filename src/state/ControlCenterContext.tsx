import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { computeSummary } from '@/services/mock';
import { getState, subscribe, type ControlCenterState } from '@/services/mock/store';
import { services } from '@/services';
import type {
  AgentCommand,
  AgentId,
  ApprovalRequestId,
  ApprovalResolution,
  FleetSummary,
  TaskId,
} from '@/types';

/**
 * Application state.
 *
 * Reads come from the service layer's external store via `useSyncExternalStore`,
 * so a push update from a future WebSocket implementation re-renders the tree
 * without any component holding a stale copy. Writes go through the service
 * interfaces, never by mutating state here.
 */

export interface Toast {
  readonly id: number;
  readonly tone: 'success' | 'error';
  readonly message: string;
}

interface ControlCenterContextValue {
  readonly data: ControlCenterState;
  readonly summary: FleetSummary;
  readonly toasts: readonly Toast[];
  readonly dismissToast: (id: number) => void;
  readonly sendAgentCommand: (agentId: AgentId, command: AgentCommand) => Promise<void>;
  readonly resolveApproval: (
    id: ApprovalRequestId,
    resolution: ApprovalResolution,
    comment?: string,
  ) => Promise<void>;
  readonly retryTask: (id: TaskId) => Promise<void>;
  readonly reassignTask: (id: TaskId, agentId: AgentId | null) => Promise<void>;
}

const ControlCenterContext = createContext<ControlCenterContextValue | null>(null);

let toastCounter = 0;

export function ControlCenterProvider({ children }: { children: ReactNode }) {
  const data = useSyncExternalStore(subscribe, getState, getState);
  const [toasts, setToasts] = useState<readonly Toast[]>([]);

  const pushToast = useCallback((tone: Toast['tone'], message: string) => {
    toastCounter += 1;
    const toast: Toast = { id: toastCounter, tone, message };
    setToasts((current) => [...current, toast]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((candidate) => candidate.id !== toast.id));
    }, 6000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const sendAgentCommand = useCallback(
    async (agentId: AgentId, command: AgentCommand) => {
      const result = await services.agents.sendCommand(agentId, command);
      pushToast(result.ok ? 'success' : 'error', result.message);
    },
    [pushToast],
  );

  const resolveApproval = useCallback(
    async (id: ApprovalRequestId, resolution: ApprovalResolution, comment?: string) => {
      const result = await services.approvals.resolve(id, resolution, comment);
      pushToast(result.ok ? 'success' : 'error', result.message);
    },
    [pushToast],
  );

  const retryTask = useCallback(
    async (id: TaskId) => {
      const result = await services.tasks.retry(id);
      pushToast(result.ok ? 'success' : 'error', result.message);
    },
    [pushToast],
  );

  const reassignTask = useCallback(
    async (id: TaskId, agentId: AgentId | null) => {
      const result = await services.tasks.reassign(id, agentId);
      pushToast(result.ok ? 'success' : 'error', result.message);
    },
    [pushToast],
  );

  const summary = useMemo(
    () =>
      computeSummary(data.agents, data.tasks, data.pullRequests, data.pipelineRuns, data.approvals),
    [data.agents, data.tasks, data.pullRequests, data.pipelineRuns, data.approvals],
  );

  const value = useMemo<ControlCenterContextValue>(
    () => ({
      data,
      summary,
      toasts,
      dismissToast,
      sendAgentCommand,
      resolveApproval,
      retryTask,
      reassignTask,
    }),
    [
      data,
      summary,
      toasts,
      dismissToast,
      sendAgentCommand,
      resolveApproval,
      retryTask,
      reassignTask,
    ],
  );

  return <ControlCenterContext.Provider value={value}>{children}</ControlCenterContext.Provider>;
}

export function useControlCenter(): ControlCenterContextValue {
  const context = useContext(ControlCenterContext);
  if (!context) {
    throw new Error('useControlCenter must be used inside a ControlCenterProvider.');
  }
  return context;
}

/** Convenience selectors, so components do not re-implement the same lookups. */
export function useAgentLookup() {
  const { data } = useControlCenter();
  return useMemo(() => new Map(data.agents.map((agent) => [agent.id, agent])), [data.agents]);
}

export function useRepositoryLookup() {
  const { data } = useControlCenter();
  return useMemo(
    () => new Map(data.repositories.map((repository) => [repository.id, repository])),
    [data.repositories],
  );
}

export function useTaskLookup() {
  const { data } = useControlCenter();
  return useMemo(() => new Map(data.tasks.map((task) => [task.id, task])), [data.tasks]);
}
