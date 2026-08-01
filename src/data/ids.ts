import {
  agentId,
  pipelineRunId,
  pullRequestId,
  repositoryId,
  taskId,
  type AgentId,
  type PipelineRunId,
  type PullRequestId,
  type RepositoryId,
  type TaskId,
} from '@/types';

/**
 * Canonical identifiers for the fixture dataset.
 *
 * Keeping them in one module means every cross-reference (a task pointing at
 * an agent, an approval pointing at a repository) is checked by the compiler
 * rather than by eye.
 */

export const AGENT_IDS = {
  architect: agentId('agt-arch-01'),
  java: agentId('agt-java-01'),
  angular: agentId('agt-ng-01'),
  test: agentId('agt-qa-01'),
  security: agentId('agt-sec-01'),
  devops: agentId('agt-ops-01'),
  review: agentId('agt-rev-01'),
  docs: agentId('agt-doc-01'),
  jira: agentId('agt-jira-01'),
  release: agentId('agt-rel-01'),
} as const satisfies Record<string, AgentId>;

export const REPO_IDS = {
  payments: repositoryId('repo-payments-service'),
  portal: repositoryId('repo-customer-portal'),
  platform: repositoryId('repo-platform-ci'),
  infra: repositoryId('repo-infra-terraform'),
  agentConfig: repositoryId('repo-agent-config'),
} as const satisfies Record<string, RepositoryId>;

export const TASK_IDS = {
  outboxAdr: taskId('TSK-1401'),
  refundIdempotency: taskId('TSK-1402'),
  refundStatusUi: taskId('TSK-1403'),
  contractTests: taskId('TSK-1404'),
  dependencyAudit: taskId('TSK-1405'),
  runnerUpgrade: taskId('TSK-1406'),
  reviewPr482: taskId('TSK-1407'),
  openapiDocs: taskId('TSK-1408'),
  backlogSync: taskId('TSK-1409'),
  releaseCut: taskId('TSK-1410'),
  rateLimitTuning: taskId('TSK-1411'),
  a11yAudit: taskId('TSK-1412'),
  terraformDrift: taskId('TSK-1413'),
  promptRegression: taskId('TSK-1414'),
  legacyRetryRemoval: taskId('TSK-1415'),
} as const satisfies Record<string, TaskId>;

export const PR_IDS = {
  refundIdempotency: pullRequestId('pr-payments-482'),
  outboxAdr: pullRequestId('pr-payments-479'),
  refundStatusUi: pullRequestId('pr-portal-311'),
  a11yFixes: pullRequestId('pr-portal-308'),
  runnerUpgrade: pullRequestId('pr-platform-97'),
  terraformDrift: pullRequestId('pr-infra-64'),
  promptGuardrails: pullRequestId('pr-agentcfg-23'),
} as const satisfies Record<string, PullRequestId>;

export const PIPELINE_IDS = {
  paymentsMain: pipelineRunId('run-payments-2841'),
  paymentsPr482: pipelineRunId('run-payments-2843'),
  portalPr311: pipelineRunId('run-portal-1190'),
  platformMain: pipelineRunId('run-platform-742'),
  infraPlan: pipelineRunId('run-infra-318'),
  agentConfigMain: pipelineRunId('run-agentcfg-155'),
} as const satisfies Record<string, PipelineRunId>;
