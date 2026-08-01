import { mockServices } from './mock';
import type { ServiceRegistry } from './types';

/**
 * Service wiring.
 *
 * The whole application resolves its data access through `services`. Today it
 * points at the in-memory mock; pointing it at a real control plane is a
 * change here and nowhere else, because every screen depends on the interfaces
 * in `./types`, not on the implementation.
 *
 * A REST + WebSocket implementation would look like:
 *
 *   const backend = createRestServices({ baseUrl: import.meta.env.VITE_API_BASE_URL });
 *   const stream  = createWebSocketRealtime({ url: import.meta.env.VITE_WS_URL });
 *   export const services: ServiceRegistry = { ...backend, realtime: stream, kind: 'websocket' };
 */

export const services: ServiceRegistry = mockServices;

export type {
  ActivityService,
  AgentService,
  ApprovalService,
  CommandResult,
  MetricsService,
  RealtimeService,
  RepositoryService,
  ServiceRegistry,
  TaskService,
  Unsubscribe,
} from './types';
