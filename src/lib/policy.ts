import type { AgentCapabilityKind, ApprovalActionType, RiskLevel } from '@/types';

/**
 * Human-in-the-loop policy.
 *
 * This module is the single source of truth for which agent actions require a
 * human decision. The UI reads it to label capabilities and to explain why an
 * approval exists; a real backend would enforce the same table server-side.
 * Nothing here is advisory in intent: the console never offers a control that
 * lets an agent bypass a rule.
 */

export interface PolicyRule {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  /** Capabilities this rule gates. */
  readonly capabilities: readonly AgentCapabilityKind[];
  /** Approval action types raised when an agent attempts a gated capability. */
  readonly actions: readonly ApprovalActionType[];
  readonly defaultRisk: RiskLevel;
  /** `false` means no configuration may make this autonomous. */
  readonly overridable: boolean;
}

export const POLICY_RULES: readonly PolicyRule[] = [
  {
    id: 'POL-001',
    title: 'No autonomous merge to a protected branch',
    description:
      'Agents may open and update pull requests, but merging into main or any protected branch requires a named human approver.',
    capabilities: ['merge_to_main'],
    actions: ['merge_to_main'],
    defaultRisk: 'high',
    overridable: false,
  },
  {
    id: 'POL-002',
    title: 'No autonomous production deployment',
    description:
      'Deployments to production environments, including rollbacks, are gated. Staging deployments may be autonomous per agent configuration.',
    capabilities: ['deploy_production'],
    actions: ['deploy_production', 'modify_production_config'],
    defaultRisk: 'critical',
    overridable: false,
  },
  {
    id: 'POL-003',
    title: 'No autonomous secret access',
    description:
      'Reading a secret value from the vault or from CI variables requires approval and is recorded against the requesting agent.',
    capabilities: ['read_secrets'],
    actions: ['access_secret'],
    defaultRisk: 'critical',
    overridable: false,
  },
  {
    id: 'POL-004',
    title: 'No autonomous infrastructure mutation',
    description:
      'Terraform apply, cluster changes, and any destroy operation are gated. Plan output may be produced autonomously.',
    capabilities: ['modify_infrastructure'],
    actions: ['modify_infrastructure'],
    defaultRisk: 'critical',
    overridable: false,
  },
  {
    id: 'POL-005',
    title: 'Bulk file deletion is gated',
    description:
      'Deleting more than the configured file threshold in a single operation requires approval, regardless of repository.',
    capabilities: ['delete_files'],
    actions: ['delete_files'],
    defaultRisk: 'high',
    overridable: true,
  },
  {
    id: 'POL-006',
    title: 'No autonomous outbound communication',
    description:
      'Messages to humans or third-party systems outside the workspace (email, chat webhooks, customer-facing comments) are gated.',
    capabilities: ['send_external_message'],
    actions: ['send_external_message'],
    defaultRisk: 'high',
    overridable: false,
  },
  {
    id: 'POL-007',
    title: 'No autonomous financial action',
    description:
      'Any action that provisions billable resources, changes a plan, or spends budget requires approval.',
    capabilities: ['financial_action'],
    actions: ['financial_action'],
    defaultRisk: 'critical',
    overridable: false,
  },
  {
    id: 'POL-008',
    title: 'Push and pull request creation are gated per repository',
    description:
      'Repositories marked as gated require approval before an agent pushes a branch or opens a pull request. Sandbox repositories may allow this autonomously.',
    capabilities: ['open_pull_request', 'create_commit'],
    actions: ['push_to_repository', 'open_pull_request'],
    defaultRisk: 'medium',
    overridable: true,
  },
  {
    id: 'POL-009',
    title: 'Pipeline triggering is gated on shared runners',
    description:
      'Starting a workflow that consumes shared CI capacity or publishes artifacts requires approval.',
    capabilities: ['trigger_pipeline'],
    actions: ['trigger_pipeline'],
    defaultRisk: 'medium',
    overridable: true,
  },
  {
    id: 'POL-010',
    title: 'Issue tracker mutation is gated',
    description:
      'Agents may read Jira freely. Creating, transitioning, or editing issues that are visible to stakeholders requires approval.',
    capabilities: ['modify_issue_tracker'],
    actions: ['modify_issue_tracker'],
    defaultRisk: 'low',
    overridable: true,
  },
];

const RULES_BY_CAPABILITY = new Map<AgentCapabilityKind, PolicyRule[]>();
for (const rule of POLICY_RULES) {
  for (const capability of rule.capabilities) {
    const existing = RULES_BY_CAPABILITY.get(capability);
    if (existing) {
      existing.push(rule);
    } else {
      RULES_BY_CAPABILITY.set(capability, [rule]);
    }
  }
}

const RULES_BY_ACTION = new Map<ApprovalActionType, PolicyRule[]>();
for (const rule of POLICY_RULES) {
  for (const action of rule.actions) {
    const existing = RULES_BY_ACTION.get(action);
    if (existing) {
      existing.push(rule);
    } else {
      RULES_BY_ACTION.set(action, [rule]);
    }
  }
}

export function rulesForCapability(capability: AgentCapabilityKind): readonly PolicyRule[] {
  return RULES_BY_CAPABILITY.get(capability) ?? [];
}

export function rulesForAction(action: ApprovalActionType): readonly PolicyRule[] {
  return RULES_BY_ACTION.get(action) ?? [];
}

export function ruleById(id: string): PolicyRule | undefined {
  return POLICY_RULES.find((rule) => rule.id === id);
}

/** True when a capability can never be exercised without a human decision. */
export function requiresApproval(capability: AgentCapabilityKind): boolean {
  return rulesForCapability(capability).length > 0;
}

export const APPROVAL_ACTION_LABELS: Readonly<Record<ApprovalActionType, string>> = {
  push_to_repository: 'Push to repository',
  open_pull_request: 'Open pull request',
  merge_to_main: 'Merge to protected branch',
  trigger_pipeline: 'Trigger pipeline',
  deploy_production: 'Deploy to production',
  modify_production_config: 'Modify production configuration',
  access_secret: 'Access secret',
  delete_files: 'Delete files',
  modify_infrastructure: 'Modify infrastructure',
  modify_issue_tracker: 'Modify issue tracker',
  send_external_message: 'Send external message',
  financial_action: 'Financial action',
};
