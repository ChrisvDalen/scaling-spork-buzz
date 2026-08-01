import type {
  AgentId,
  ApprovalRequestId,
  IsoTimestamp,
  RepositoryId,
  RiskLevel,
  TaskId,
} from './common';

/**
 * Actions that an agent may never take unilaterally. Every member of this
 * union corresponds to a rule in `src/lib/policy.ts`; the runtime is expected
 * to raise an ApprovalRequest instead of executing.
 */
export type ApprovalActionType =
  | 'push_to_repository'
  | 'open_pull_request'
  | 'merge_to_main'
  | 'trigger_pipeline'
  | 'deploy_production'
  | 'modify_production_config'
  | 'access_secret'
  | 'delete_files'
  | 'modify_infrastructure'
  | 'modify_issue_tracker'
  | 'send_external_message'
  | 'financial_action';

export const APPROVAL_ACTION_TYPES: readonly ApprovalActionType[] = [
  'push_to_repository',
  'open_pull_request',
  'merge_to_main',
  'trigger_pipeline',
  'deploy_production',
  'modify_production_config',
  'access_secret',
  'delete_files',
  'modify_infrastructure',
  'modify_issue_tracker',
  'send_external_message',
  'financial_action',
] as const;

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested' | 'expired';

/**
 * The concrete change an agent proposes. Exactly one of `diff` or `command`
 * is expected to be present, matching how the preview is rendered.
 */
export interface ProposedChange {
  readonly summary: string;
  /** Unified diff text, when the action modifies files. */
  readonly diff?: string;
  /** Literal command line, when the action executes something. */
  readonly command?: string;
  readonly affectedPaths: readonly string[];
  readonly targetBranch?: string;
  readonly targetEnvironment?: string;
}

/** Decision record, appended when an operator resolves the request. */
export interface ApprovalDecision {
  readonly decidedBy: string;
  readonly decidedAt: IsoTimestamp;
  readonly comment?: string;
}

export interface ApprovalRequest {
  readonly id: ApprovalRequestId;
  readonly actionType: ApprovalActionType;
  readonly title: string;
  readonly agentId: AgentId;
  readonly taskId?: TaskId;
  readonly repositoryId?: RepositoryId;
  /** Why the agent wants to do this. */
  readonly reason: string;
  readonly risk: RiskLevel;
  /** What happens to systems and people if this is approved. */
  readonly impact: string;
  readonly proposedChange: ProposedChange;
  readonly requestedAt: IsoTimestamp;
  readonly expiresAt?: IsoTimestamp;
  readonly status: ApprovalStatus;
  readonly decision?: ApprovalDecision;
  /** Policy rule ids that forced this gate. */
  readonly policyRules: readonly string[];
}

/** The three outcomes an operator can pick in the Approval Center. */
export type ApprovalResolution = 'approve' | 'reject' | 'request_changes';
