/**
 * Hash-based routing.
 *
 * A hash router keeps the console deep-linkable (an operator can paste
 * `#/agents/agt-java-01` into an incident channel) without pulling in a router
 * dependency or requiring server-side rewrites when this is served as static
 * files. Swapping to the History API later only changes this module.
 */

export const VIEWS = [
  'overview',
  'agents',
  'tasks',
  'approvals',
  'activity',
  'repositories',
  'health',
  'settings',
] as const;

export type ViewId = (typeof VIEWS)[number];

export interface Route {
  readonly view: ViewId;
  /** Optional entity selected within the view, e.g. an agent or repository id. */
  readonly id?: string;
}

const DEFAULT_ROUTE: Route = { view: 'overview' };

function isViewId(value: string): value is ViewId {
  return (VIEWS as readonly string[]).includes(value);
}

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').trim();
  if (path.length === 0) return DEFAULT_ROUTE;
  const [view, id] = path.split('/');
  if (!view || !isViewId(view)) return DEFAULT_ROUTE;
  return id ? { view, id: decodeURIComponent(id) } : { view };
}

export function toHash(route: Route): string {
  return route.id ? `#/${route.view}/${encodeURIComponent(route.id)}` : `#/${route.view}`;
}

export const VIEW_META: Readonly<
  Record<ViewId, { readonly label: string; readonly description: string }>
> = {
  overview: { label: 'Overview', description: 'Fleet status and everything that needs attention' },
  agents: { label: 'Agents', description: 'Every registered agent and what it is doing' },
  tasks: { label: 'Tasks', description: 'Work items across the fleet, by state' },
  approvals: { label: 'Approvals', description: 'Actions held for a human decision' },
  activity: { label: 'Activity', description: 'Central event timeline' },
  repositories: { label: 'Repositories', description: 'Branches, pull requests, and pipelines' },
  health: { label: 'System Health', description: 'Dependencies, limits, queue, and spend' },
  settings: { label: 'Settings', description: 'Console configuration and data source' },
};
