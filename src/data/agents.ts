import {
  logEntryId,
  toolExecutionId,
  type Agent,
  type AgentDetail,
  type AgentId,
  type AgentLog,
  type ToolExecution,
} from '@/types';
import { capability, TOOL_CATALOG } from './agentProfiles';
import { AGENT_IDS, REPO_IDS, TASK_IDS } from './ids';
import { hoursAgo, minutesAgo, secondsAgo } from './time';

const ORG = 'https://github.com/northwind-payments';
const JIRA = 'https://northwind.atlassian.net/browse';

/** Detail payload without the agent record, which is merged in below. */
type AgentDetailSeed = Omit<AgentDetail, 'agent'>;

let logCounter = 0;
const log = (
  agentIdValue: AgentId,
  minutes: number,
  severity: AgentLog['severity'],
  source: string,
  message: string,
  taskIdValue?: AgentLog['taskId'],
): AgentLog => ({
  id: logEntryId(`log-${(logCounter += 1).toString().padStart(5, '0')}`),
  agentId: agentIdValue,
  taskId: taskIdValue,
  timestamp: minutesAgo(minutes),
  severity,
  message,
  source,
});

let execCounter = 0;
const exec = (
  agentIdValue: AgentId,
  tool: string,
  command: string,
  startedMinutesAgo: number,
  durationMs: number,
  status: ToolExecution['status'],
  exitCode?: number,
  output?: string,
): ToolExecution => ({
  id: toolExecutionId(`tx-${(execCounter += 1).toString().padStart(5, '0')}`),
  agentId: agentIdValue,
  tool,
  command,
  startedAt: minutesAgo(startedMinutesAgo),
  finishedAt:
    status === 'running' ? undefined : minutesAgo(startedMinutesAgo - durationMs / 60_000),
  durationMs: status === 'running' ? undefined : durationMs,
  exitCode,
  status,
  output,
});

// ---------------------------------------------------------------------------
// Agent records
// ---------------------------------------------------------------------------

export const AGENTS: readonly Agent[] = [
  {
    id: AGENT_IDS.architect,
    name: 'arch-01',
    role: 'architect',
    roleLabel: 'Software Architect',
    specialization: 'Event-driven design, ADRs, API contracts, service boundaries',
    status: 'completed',
    currentTaskId: TASK_IDS.outboxAdr,
    currentTaskTitle: 'ADR-0031: transactional outbox for payment events',
    repositoryId: REPO_IDS.payments,
    branch: 'docs/adr-0031-outbox',
    startedAt: hoursAgo(9.4),
    lastActivityAt: hoursAgo(1.2),
    progress: 100,
    model: {
      provider: 'anthropic',
      model: 'claude-opus-5',
      contextWindow: 200_000,
      temperature: 0.2,
    },
    cost: {
      inputTokens: 412_800,
      outputTokens: 58_400,
      totalTokens: 471_200,
      estimatedCost: 9.42,
      currency: 'USD',
      budgetLimit: 25,
      windowStartedAt: hoursAgo(9.4),
    },
    dependsOn: [],
    lastLogLine: 'ADR-0031 published; PR 479 approved by m.dekker and s.aydin.',
    host: 'runner-eu-west-1a-03',
  },
  {
    id: AGENT_IDS.java,
    name: 'java-01',
    role: 'backend_engineer',
    roleLabel: 'Java Engineer',
    specialization: 'Spring Boot 3, JPA, resilience patterns, Java 21',
    status: 'running',
    currentTaskId: TASK_IDS.refundIdempotency,
    currentTaskTitle: 'Idempotent refund submission (PAY-2381)',
    repositoryId: REPO_IDS.payments,
    branch: 'feature/PAY-2381-refund-idempotency',
    startedAt: hoursAgo(3.6),
    lastActivityAt: secondsAgo(38),
    progress: 72,
    model: {
      provider: 'anthropic',
      model: 'claude-opus-5',
      contextWindow: 200_000,
      temperature: 0.1,
    },
    activeTool: 'build.maven',
    cost: {
      inputTokens: 863_400,
      outputTokens: 141_900,
      totalTokens: 1_005_300,
      estimatedCost: 21.18,
      currency: 'USD',
      budgetLimit: 40,
      windowStartedAt: hoursAgo(3.6),
    },
    dependsOn: [AGENT_IDS.architect],
    lastLogLine: 'mvn -pl payments-api verify: integration-tests stage running (4/9 suites).',
    host: 'runner-eu-west-1a-07',
  },
  {
    id: AGENT_IDS.angular,
    name: 'ng-01',
    role: 'frontend_engineer',
    roleLabel: 'Angular Engineer',
    specialization: 'Angular 18 signals, RxJS interop, accessibility, component testing',
    status: 'running',
    currentTaskId: TASK_IDS.refundStatusUi,
    currentTaskTitle: 'Refund status panel (PORT-908)',
    repositoryId: REPO_IDS.portal,
    branch: 'feature/PORT-908-refund-status',
    startedAt: hoursAgo(2.2),
    lastActivityAt: minutesAgo(2),
    progress: 58,
    model: {
      provider: 'anthropic',
      model: 'claude-sonnet-5',
      contextWindow: 200_000,
      temperature: 0.15,
    },
    activeTool: 'build.npm',
    cost: {
      inputTokens: 402_100,
      outputTokens: 96_700,
      totalTokens: 498_800,
      estimatedCost: 6.31,
      currency: 'USD',
      budgetLimit: 25,
      windowStartedAt: hoursAgo(2.2),
    },
    dependsOn: [AGENT_IDS.java],
    lastLogLine: 'Reproducing CI failure locally: 3 specs in refund-status.store.spec.ts.',
    host: 'runner-eu-west-1b-02',
  },
  {
    id: AGENT_IDS.test,
    name: 'qa-01',
    role: 'test_engineer',
    roleLabel: 'Test Engineer',
    specialization: 'JUnit 5, Testcontainers, contract testing, mutation coverage',
    status: 'failed',
    currentTaskId: TASK_IDS.contractTests,
    currentTaskTitle: 'Consumer-driven contract tests for refund API',
    repositoryId: REPO_IDS.payments,
    branch: 'test/PAY-2381-contract-tests',
    startedAt: hoursAgo(2.9),
    lastActivityAt: minutesAgo(12),
    progress: 44,
    model: {
      provider: 'anthropic',
      model: 'claude-sonnet-5',
      contextWindow: 200_000,
      temperature: 0.1,
    },
    cost: {
      inputTokens: 318_500,
      outputTokens: 62_200,
      totalTokens: 380_700,
      estimatedCost: 4.86,
      currency: 'USD',
      budgetLimit: 20,
      windowStartedAt: hoursAgo(2.9),
    },
    dependsOn: [AGENT_IDS.java],
    lastLogLine:
      'Run aborted after 3 consecutive container start failures: Docker socket permission denied.',
    host: 'runner-eu-west-1a-11',
  },
  {
    id: AGENT_IDS.security,
    name: 'sec-01',
    role: 'security_reviewer',
    roleLabel: 'Security Reviewer',
    specialization: 'SAST triage, dependency risk, OWASP ASVS, secret hygiene',
    status: 'blocked',
    currentTaskId: TASK_IDS.dependencyAudit,
    currentTaskTitle: 'Dependency and secret-handling audit for PAY-2381',
    repositoryId: REPO_IDS.payments,
    branch: 'feature/AGT-77-secret-denylist',
    startedAt: hoursAgo(7.4),
    lastActivityAt: minutesAgo(34),
    progress: 61,
    model: {
      provider: 'anthropic',
      model: 'claude-opus-5',
      contextWindow: 200_000,
      temperature: 0,
    },
    cost: {
      inputTokens: 521_900,
      outputTokens: 74_300,
      totalTokens: 596_200,
      estimatedCost: 11.87,
      currency: 'USD',
      budgetLimit: 30,
      windowStartedAt: hoursAgo(7.4),
    },
    dependsOn: [],
    blocker: {
      reason:
        'Scanner needs the read-only registry credential to resolve private transitive dependencies. Secret access is gated by POL-003.',
      since: minutesAgo(34),
      kind: 'missing_credential',
      waitingOn: 'APR-2205',
    },
    lastLogLine: 'Halted at policy gate POL-003; approval APR-2205 raised and pending.',
    host: 'runner-eu-west-1a-05',
  },
  {
    id: AGENT_IDS.devops,
    name: 'ops-01',
    role: 'devops_engineer',
    roleLabel: 'DevOps Engineer',
    specialization: 'GitHub Actions, Terraform, Kubernetes, runner capacity',
    status: 'waiting',
    currentTaskId: TASK_IDS.runnerUpgrade,
    currentTaskTitle: 'Pin runner image and split the Java test matrix (PLAT-1482)',
    repositoryId: REPO_IDS.platform,
    branch: 'ci/PLAT-1482-runner-pin',
    startedAt: hoursAgo(6.6),
    lastActivityAt: minutesAgo(24),
    progress: 85,
    model: {
      provider: 'anthropic',
      model: 'claude-sonnet-5',
      contextWindow: 200_000,
      temperature: 0.1,
    },
    cost: {
      inputTokens: 447_600,
      outputTokens: 81_500,
      totalTokens: 529_100,
      estimatedCost: 6.72,
      currency: 'USD',
      budgetLimit: 25,
      windowStartedAt: hoursAgo(6.6),
    },
    dependsOn: [],
    lastLogLine: 'Waiting on workflow run 742 to finish before requesting review on PR 97.',
    host: 'runner-eu-west-1b-04',
  },
  {
    id: AGENT_IDS.review,
    name: 'rev-01',
    role: 'code_reviewer',
    roleLabel: 'Code Review Agent',
    specialization: 'Diff review, regression risk, convention enforcement, review triage',
    status: 'queued',
    currentTaskId: TASK_IDS.reviewPr482,
    currentTaskTitle: 'Review PR 482: refund idempotency',
    repositoryId: REPO_IDS.payments,
    startedAt: minutesAgo(4),
    lastActivityAt: minutesAgo(4),
    progress: 0,
    model: {
      provider: 'anthropic',
      model: 'claude-opus-5',
      contextWindow: 200_000,
      temperature: 0,
    },
    cost: {
      inputTokens: 96_400,
      outputTokens: 12_800,
      totalTokens: 109_200,
      estimatedCost: 2.14,
      currency: 'USD',
      budgetLimit: 20,
      windowStartedAt: minutesAgo(4),
    },
    dependsOn: [AGENT_IDS.java],
    lastLogLine: 'Queued behind 2 runs; will start when PR 482 checks reach a terminal state.',
    host: 'runner-eu-west-1a-09',
  },
  {
    id: AGENT_IDS.docs,
    name: 'doc-01',
    role: 'documentation',
    roleLabel: 'Documentation Agent',
    specialization: 'OpenAPI reference, runbooks, ADR index, changelog hygiene',
    status: 'idle',
    lastActivityAt: hoursAgo(3.4),
    progress: 0,
    model: {
      provider: 'anthropic',
      model: 'claude-haiku-4-5-20251001',
      contextWindow: 200_000,
      temperature: 0.2,
    },
    cost: {
      inputTokens: 184_200,
      outputTokens: 41_600,
      totalTokens: 225_800,
      estimatedCost: 0.64,
      currency: 'USD',
      budgetLimit: 10,
      windowStartedAt: hoursAgo(8),
    },
    dependsOn: [],
    lastLogLine: 'Completed TSK-1396 (runbook refresh); no work assigned.',
    host: 'runner-eu-west-1b-06',
  },
  {
    id: AGENT_IDS.jira,
    name: 'jira-01',
    role: 'coordination',
    roleLabel: 'Jira Coordination Agent',
    specialization: 'Backlog hygiene, ticket linkage, sprint scope reporting',
    status: 'stopped',
    currentTaskId: TASK_IDS.backlogSync,
    currentTaskTitle: 'Sync agent task board with the PAY sprint backlog',
    startedAt: hoursAgo(5.2),
    lastActivityAt: hoursAgo(1.6),
    progress: 37,
    model: {
      provider: 'anthropic',
      model: 'claude-haiku-4-5-20251001',
      contextWindow: 200_000,
      temperature: 0.1,
    },
    cost: {
      inputTokens: 142_700,
      outputTokens: 28_900,
      totalTokens: 171_600,
      estimatedCost: 0.49,
      currency: 'USD',
      budgetLimit: 10,
      windowStartedAt: hoursAgo(5.2),
    },
    dependsOn: [],
    lastLogLine: 'Stopped by operator m.dekker: duplicate subtask creation on PAY-2381.',
    host: 'runner-eu-west-1b-08',
  },
  {
    id: AGENT_IDS.release,
    name: 'rel-01',
    role: 'release_manager',
    roleLabel: 'Release Agent',
    specialization: 'Semver, release notes, changelog assembly, tag and artifact promotion',
    status: 'approval_required',
    currentTaskId: TASK_IDS.releaseCut,
    currentTaskTitle: 'Cut release 2026.8.1 for payments-service',
    repositoryId: REPO_IDS.payments,
    branch: 'release/2026.8.1',
    startedAt: hoursAgo(1.1),
    lastActivityAt: minutesAgo(17),
    progress: 90,
    model: {
      provider: 'anthropic',
      model: 'claude-sonnet-5',
      contextWindow: 200_000,
      temperature: 0,
    },
    cost: {
      inputTokens: 128_300,
      outputTokens: 34_100,
      totalTokens: 162_400,
      estimatedCost: 2.06,
      currency: 'USD',
      budgetLimit: 15,
      windowStartedAt: hoursAgo(1.1),
    },
    dependsOn: [AGENT_IDS.java, AGENT_IDS.review],
    blocker: {
      reason: 'Merge of release/2026.8.1 into main requires a human approver under POL-001.',
      since: minutesAgo(17),
      kind: 'approval',
      waitingOn: 'APR-2201',
    },
    lastLogLine: 'Release notes assembled; merge blocked pending approval APR-2201.',
    host: 'runner-eu-west-1a-02',
  },
];

// ---------------------------------------------------------------------------
// Agent detail seeds
// ---------------------------------------------------------------------------

const DETAIL_SEEDS: Readonly<Record<AgentId, AgentDetailSeed>> = {
  [AGENT_IDS.architect]: {
    systemPrompt: `You are arch-01, the software architect agent for the Northwind payments platform.

Scope
- You own architectural decision records, service boundaries, and API contracts.
- You produce written artifacts. You do not implement features; you hand specifications to engineering agents.

Method
1. Restate the problem and the forces at play before proposing a decision.
2. Enumerate at least two viable options with their trade-offs. Never present a single option as inevitable.
3. Record the decision in the ADR template at docs/adr/TEMPLATE.md, including consequences and a rollback path.
4. Cross-link the ADR to the originating Jira issue and to any affected OpenAPI contract.

Constraints
- Do not modify source code outside docs/ and api/ directories.
- Do not merge your own pull requests. Merging to main is gated by POL-001 and requires a named human approver.
- If a decision would change a published API contract, flag it explicitly in the ADR summary so the coordination agent can notify consumers.`,
    capabilities: [
      capability('read_repository'),
      capability('write_code'),
      capability('create_branch'),
      capability('create_commit'),
      capability('open_pull_request'),
      capability('review_pull_request'),
      capability('modify_issue_tracker'),
    ],
    allowedTools: [
      TOOL_CATALOG.gitRead,
      TOOL_CATALOG.gitWrite,
      TOOL_CATALOG.githubPr,
      TOOL_CATALOG.fsRead,
      TOOL_CATALOG.fsWrite,
      TOOL_CATALOG.codeSearch,
      TOOL_CATALOG.openapi,
      TOOL_CATALOG.jira,
      TOOL_CATALOG.webSearch,
    ],
    executionHistory: [
      {
        taskId: TASK_IDS.outboxAdr,
        title: 'ADR-0031: transactional outbox for payment events',
        startedAt: hoursAgo(9.4),
        finishedAt: hoursAgo(1.2),
        outcome: 'succeeded',
        summary:
          'Compared outbox, CDC via Debezium, and dual-write with compensation. Selected transactional outbox. PR 479 approved.',
        tokensUsed: 471_200,
      },
      {
        taskId: TASK_IDS.rateLimitTuning,
        title: 'Rate limit strategy for the public refund API',
        startedAt: hoursAgo(28),
        finishedAt: hoursAgo(24),
        outcome: 'succeeded',
        summary:
          'Recommended token bucket per merchant with a shared burst pool. Handed to java-01 as PAY-2402.',
        tokensUsed: 288_400,
      },
    ],
    logs: [
      log(AGENT_IDS.architect, 560, 'info', 'runtime', 'Agent started; profile architect@v4 loaded.'),
      log(
        AGENT_IDS.architect,
        552,
        'info',
        'tool.git',
        'Cloned payments-service at 4b8d0e2 into /workspace/payments-service.',
      ),
      log(
        AGENT_IDS.architect,
        480,
        'info',
        'planner',
        'Identified 3 candidate patterns for reliable event publication.',
        TASK_IDS.outboxAdr,
      ),
      log(
        AGENT_IDS.architect,
        340,
        'notice',
        'planner',
        'Dual-write rejected: no atomic guarantee across Postgres and Kafka without XA.',
        TASK_IDS.outboxAdr,
      ),
      log(
        AGENT_IDS.architect,
        180,
        'info',
        'tool.fs',
        'Wrote docs/adr/0031-transactional-outbox.md (214 lines).',
        TASK_IDS.outboxAdr,
      ),
      log(
        AGENT_IDS.architect,
        96,
        'info',
        'tool.github',
        'Opened PR 479 against main; requested review from m.dekker, s.aydin.',
        TASK_IDS.outboxAdr,
      ),
      log(
        AGENT_IDS.architect,
        72,
        'info',
        'runtime',
        'PR 479 approved by 2 reviewers. Merge deferred to release agent under POL-001.',
        TASK_IDS.outboxAdr,
      ),
      log(AGENT_IDS.architect, 72, 'info', 'runtime', 'Task completed; agent returning to pool.'),
    ],
    changedFiles: [
      {
        path: 'docs/adr/0031-transactional-outbox.md',
        repositoryId: REPO_IDS.payments,
        changeType: 'added',
        linesAdded: 214,
        linesRemoved: 0,
        lastModifiedAt: hoursAgo(3),
      },
      {
        path: 'docs/adr/README.md',
        repositoryId: REPO_IDS.payments,
        changeType: 'modified',
        linesAdded: 4,
        linesRemoved: 0,
        lastModifiedAt: hoursAgo(3),
      },
      {
        path: 'api/payments-events.yaml',
        repositoryId: REPO_IDS.payments,
        changeType: 'modified',
        linesAdded: 31,
        linesRemoved: 2,
        lastModifiedAt: hoursAgo(2.8),
      },
    ],
    toolExecutions: [
      exec(
        AGENT_IDS.architect,
        'git.read',
        'git clone --depth 50 git@github.com:northwind-payments/payments-service.git',
        552,
        18_400,
        'succeeded',
        0,
        'Cloning into payments-service... done.',
      ),
      exec(
        AGENT_IDS.architect,
        'analysis.openapi',
        'openapi diff api/payments-events.yaml --base main',
        170,
        6_200,
        'succeeded',
        0,
        '1 non-breaking addition: PaymentEventEnvelope.sequenceNumber (optional).',
      ),
      exec(
        AGENT_IDS.architect,
        'github.pull_request',
        'gh pr create --base main --head docs/adr-0031-outbox --title "docs(adr): ADR-0031 ..."',
        96,
        3_100,
        'succeeded',
        0,
        'https://github.com/northwind-payments/payments-service/pull/479',
      ),
    ],
    errors: [],
    artifacts: [
      {
        id: 'art-adr-0031',
        name: 'ADR-0031-transactional-outbox.md',
        kind: 'document',
        sizeBytes: 18_942,
        createdAt: hoursAgo(3),
        url: `${ORG}/payments-service/blob/docs/adr-0031-outbox/docs/adr/0031-transactional-outbox.md`,
      },
      {
        id: 'art-outbox-diagram',
        name: 'outbox-sequence.svg',
        kind: 'diagram',
        sizeBytes: 42_118,
        createdAt: hoursAgo(3.2),
        url: `${ORG}/payments-service/blob/docs/adr-0031-outbox/docs/adr/assets/outbox-sequence.svg`,
      },
    ],
    links: [
      { label: 'PR 479', url: `${ORG}/payments-service/pull/479`, system: 'github' },
      { label: 'PAY-2380', url: `${JIRA}/PAY-2380`, system: 'jira' },
    ],
  },

  [AGENT_IDS.java]: {
    systemPrompt: `You are java-01, the backend engineering agent for the Northwind payments platform.

Scope
- You implement server-side features in Java 21 and Spring Boot 3 within payments-service.
- You follow ADRs produced by arch-01. If an ADR is ambiguous, ask for clarification rather than guessing.

Method
1. Read the Jira issue and the linked ADR before writing code.
2. Write the failing test first when the change is behavioural.
3. Keep commits scoped: one logical change per commit, conventional commit prefixes.
4. Run 'mvn -pl <module> verify' locally before pushing. Do not push a branch with a failing build.

Constraints
- Never write to main or any release/* branch. Pushes to feature branches are permitted; opening a pull request is gated by POL-008.
- Never read secrets. If a test needs a credential, request it through the approval flow.
- Do not delete more than 5 files in one operation without approval (POL-005).
- Do not modify infrastructure or CI workflows; hand those to ops-01.`,
    capabilities: [
      capability('read_repository'),
      capability('write_code'),
      capability('run_tests'),
      capability('run_build'),
      capability('create_branch'),
      capability('create_commit'),
      capability('open_pull_request'),
      capability('delete_files'),
    ],
    allowedTools: [
      TOOL_CATALOG.gitRead,
      TOOL_CATALOG.gitWrite,
      TOOL_CATALOG.githubPr,
      TOOL_CATALOG.fsRead,
      TOOL_CATALOG.fsWrite,
      TOOL_CATALOG.shell,
      TOOL_CATALOG.maven,
      TOOL_CATALOG.codeSearch,
      TOOL_CATALOG.actions,
      TOOL_CATALOG.jira,
    ],
    executionHistory: [
      {
        taskId: TASK_IDS.refundIdempotency,
        title: 'Idempotent refund submission (PAY-2381)',
        startedAt: hoursAgo(3.6),
        outcome: 'in_progress',
        summary:
          'Idempotency key persistence and request fingerprinting implemented. Outbox dispatcher wired. Integration suite running.',
        tokensUsed: 1_005_300,
      },
      {
        taskId: TASK_IDS.legacyRetryRemoval,
        title: 'Remove the legacy retry interceptor',
        startedAt: hoursAgo(31),
        finishedAt: hoursAgo(27),
        outcome: 'succeeded',
        summary: 'Deleted 4 classes and their tests. Replaced with Resilience4j retry policy.',
        tokensUsed: 336_900,
      },
    ],
    logs: [
      log(AGENT_IDS.java, 216, 'info', 'runtime', 'Agent started; profile backend@v7 loaded.'),
      log(
        AGENT_IDS.java,
        214,
        'info',
        'tool.git',
        'Created branch feature/PAY-2381-refund-idempotency from main@4b8d0e2.',
        TASK_IDS.refundIdempotency,
      ),
      log(
        AGENT_IDS.java,
        198,
        'info',
        'planner',
        'Read ADR-0031. Outbox table and dispatcher confirmed as the target design.',
        TASK_IDS.refundIdempotency,
      ),
      log(
        AGENT_IDS.java,
        141,
        'info',
        'tool.fs',
        'Added RefundIdempotencyKey entity and Flyway migration V47__refund_idempotency.sql.',
        TASK_IDS.refundIdempotency,
      ),
      log(
        AGENT_IDS.java,
        118,
        'warning',
        'tool.maven',
        'RefundServiceTest.shouldRejectReplayedRequest failed: fingerprint compared before normalisation.',
        TASK_IDS.refundIdempotency,
      ),
      log(
        AGENT_IDS.java,
        112,
        'info',
        'planner',
        'Normalising the request body before hashing; canonical JSON ordering applied.',
        TASK_IDS.refundIdempotency,
      ),
      log(
        AGENT_IDS.java,
        94,
        'info',
        'tool.maven',
        'mvn -pl payments-domain test: 412 tests, 0 failures.',
        TASK_IDS.refundIdempotency,
      ),
      log(
        AGENT_IDS.java,
        52,
        'info',
        'tool.git',
        'Committed 9f3c1ab: feat(refunds): persist idempotency key with request fingerprint.',
        TASK_IDS.refundIdempotency,
      ),
      log(
        AGENT_IDS.java,
        48,
        'notice',
        'policy',
        'Push to feature branch permitted; PR creation raised approval APR-2203 under POL-008.',
        TASK_IDS.refundIdempotency,
      ),
      log(
        AGENT_IDS.java,
        7,
        'info',
        'tool.actions',
        'Workflow run 2843 started on feature/PAY-2381-refund-idempotency.',
        TASK_IDS.refundIdempotency,
      ),
      log(
        AGENT_IDS.java,
        0.6,
        'info',
        'tool.maven',
        'mvn -pl payments-api verify: integration-tests running (4/9 suites).',
        TASK_IDS.refundIdempotency,
      ),
    ],
    changedFiles: [
      {
        path: 'payments-domain/src/main/java/com/northwind/payments/refund/RefundIdempotencyKey.java',
        repositoryId: REPO_IDS.payments,
        changeType: 'added',
        linesAdded: 84,
        linesRemoved: 0,
        lastModifiedAt: minutesAgo(52),
      },
      {
        path: 'payments-domain/src/main/java/com/northwind/payments/refund/RefundService.java',
        repositoryId: REPO_IDS.payments,
        changeType: 'modified',
        linesAdded: 96,
        linesRemoved: 41,
        lastModifiedAt: minutesAgo(49),
      },
      {
        path: 'payments-domain/src/main/java/com/northwind/payments/outbox/OutboxDispatcher.java',
        repositoryId: REPO_IDS.payments,
        changeType: 'added',
        linesAdded: 132,
        linesRemoved: 0,
        lastModifiedAt: minutesAgo(31),
      },
      {
        path: 'payments-api/src/main/resources/db/migration/V47__refund_idempotency.sql',
        repositoryId: REPO_IDS.payments,
        changeType: 'added',
        linesAdded: 27,
        linesRemoved: 0,
        lastModifiedAt: minutesAgo(141),
      },
      {
        path: 'payments-api/src/main/java/com/northwind/payments/api/RefundController.java',
        repositoryId: REPO_IDS.payments,
        changeType: 'modified',
        linesAdded: 38,
        linesRemoved: 12,
        lastModifiedAt: minutesAgo(58),
      },
      {
        path: 'payments-domain/src/test/java/com/northwind/payments/refund/RefundServiceTest.java',
        repositoryId: REPO_IDS.payments,
        changeType: 'modified',
        linesAdded: 109,
        linesRemoved: 18,
        lastModifiedAt: minutesAgo(94),
      },
    ],
    toolExecutions: [
      exec(
        AGENT_IDS.java,
        'build.maven',
        'mvn -pl payments-api -am verify -DskipITs=false',
        7,
        0,
        'running',
        undefined,
        '[INFO] Running com.northwind.payments.api.RefundIdempotencyIT ...',
      ),
      exec(
        AGENT_IDS.java,
        'git.write',
        'git commit -m "feat(refunds): persist idempotency key with request fingerprint"',
        52,
        900,
        'succeeded',
        0,
        '[feature/PAY-2381-refund-idempotency 9f3c1ab] 5 files changed, 247 insertions(+), 53 deletions(-)',
      ),
      exec(
        AGENT_IDS.java,
        'build.maven',
        'mvn -pl payments-domain test',
        94,
        183_000,
        'succeeded',
        0,
        'Tests run: 412, Failures: 0, Errors: 0, Skipped: 1',
      ),
      exec(
        AGENT_IDS.java,
        'build.maven',
        'mvn -pl payments-domain test -Dtest=RefundServiceTest',
        118,
        41_000,
        'failed',
        1,
        'RefundServiceTest.shouldRejectReplayedRequest:142 expected 409 but was 201',
      ),
      exec(
        AGENT_IDS.java,
        'search.code',
        'rg -n "IdempotencyKey" --type java',
        160,
        800,
        'succeeded',
        0,
        '3 matches across 2 files.',
      ),
    ],
    errors: [
      {
        code: 'TEST_FAILURE',
        message: 'RefundServiceTest.shouldRejectReplayedRequest failed before the fingerprint fix.',
        occurredAt: minutesAgo(118),
        severity: 'warning',
        retryable: true,
        detail:
          'org.opentest4j.AssertionFailedError: expected: <409 CONFLICT> but was: <201 CREATED>\n\tat RefundServiceTest.shouldRejectReplayedRequest(RefundServiceTest.java:142)',
      },
    ],
    artifacts: [
      {
        id: 'art-surefire-java01',
        name: 'surefire-reports.tar.gz',
        kind: 'report',
        sizeBytes: 1_284_331,
        createdAt: minutesAgo(94),
        url: `${ORG}/payments-service/actions/runs/2843/artifacts/surefire`,
      },
    ],
    links: [
      { label: 'PR 482', url: `${ORG}/payments-service/pull/482`, system: 'github' },
      { label: 'PAY-2381', url: `${JIRA}/PAY-2381`, system: 'jira' },
      { label: 'Run 2843', url: `${ORG}/payments-service/actions/runs/2843`, system: 'ci' },
    ],
  },

  [AGENT_IDS.angular]: {
    systemPrompt: `You are ng-01, the frontend engineering agent for the Northwind customer portal.

Scope
- You implement Angular 18 features using standalone components and signal-based state.
- You own component tests and accessibility conformance for the code you touch.

Method
1. Read the design ticket and confirm the API contract with the backend agent before building against it.
2. Prefer signals over BehaviorSubject for component state; use RxJS only at the HTTP boundary.
3. Every interactive element must be reachable and operable by keyboard. Verify focus order.
4. Run 'npm run lint && npm run test' before pushing.

Constraints
- Do not modify backend contracts. If the API does not fit the UI, raise a question on the Jira issue instead of adding a workaround.
- Pull request creation is gated by POL-008.
- Do not introduce a new runtime dependency without an approval; bundle budget is enforced in CI.`,
    capabilities: [
      capability('read_repository'),
      capability('write_code'),
      capability('run_tests'),
      capability('run_build'),
      capability('create_branch'),
      capability('create_commit'),
      capability('open_pull_request'),
    ],
    allowedTools: [
      TOOL_CATALOG.gitRead,
      TOOL_CATALOG.gitWrite,
      TOOL_CATALOG.githubPr,
      TOOL_CATALOG.fsRead,
      TOOL_CATALOG.fsWrite,
      TOOL_CATALOG.shell,
      TOOL_CATALOG.npm,
      TOOL_CATALOG.playwright,
      TOOL_CATALOG.codeSearch,
      TOOL_CATALOG.actions,
    ],
    executionHistory: [
      {
        taskId: TASK_IDS.refundStatusUi,
        title: 'Refund status panel (PORT-908)',
        startedAt: hoursAgo(2.2),
        outcome: 'in_progress',
        summary:
          'Signal store and panel component built. CI run 1190 failed on polling teardown; reproducing locally.',
        tokensUsed: 498_800,
      },
      {
        taskId: TASK_IDS.a11yAudit,
        title: 'Keyboard traps in the payment method dialog (PORT-901)',
        startedAt: hoursAgo(30),
        finishedAt: hoursAgo(26),
        outcome: 'succeeded',
        summary: 'Focus restoration and escape handling fixed. PR 308 open with review comments.',
        tokensUsed: 271_400,
      },
    ],
    logs: [
      log(AGENT_IDS.angular, 132, 'info', 'runtime', 'Agent started; profile frontend@v5 loaded.'),
      log(
        AGENT_IDS.angular,
        128,
        'info',
        'tool.git',
        'Created branch feature/PORT-908-refund-status from main@8e0c2a4.',
        TASK_IDS.refundStatusUi,
      ),
      log(
        AGENT_IDS.angular,
        104,
        'info',
        'planner',
        'Contract confirmed with java-01: GET /refunds/{id}/status returns terminal flag.',
        TASK_IDS.refundStatusUi,
      ),
      log(
        AGENT_IDS.angular,
        52,
        'info',
        'tool.fs',
        'Added refund-status.store.ts using signal() and computed().',
        TASK_IDS.refundStatusUi,
      ),
      log(
        AGENT_IDS.angular,
        28,
        'info',
        'tool.actions',
        'Workflow run 1190 started on feature/PORT-908-refund-status.',
        TASK_IDS.refundStatusUi,
      ),
      log(
        AGENT_IDS.angular,
        19,
        'error',
        'tool.actions',
        'Run 1190 failed: 3 specs in refund-status.store.spec.ts (polling did not stop on terminal status).',
        TASK_IDS.refundStatusUi,
      ),
      log(
        AGENT_IDS.angular,
        11,
        'info',
        'tool.git',
        'Committed c72e5f8: feat(refunds): poll refund status until terminal state.',
        TASK_IDS.refundStatusUi,
      ),
      log(
        AGENT_IDS.angular,
        2,
        'info',
        'tool.npm',
        'npm run test -- --include refund-status: reproducing the CI failure locally.',
        TASK_IDS.refundStatusUi,
      ),
    ],
    changedFiles: [
      {
        path: 'src/app/refunds/refund-status.store.ts',
        repositoryId: REPO_IDS.portal,
        changeType: 'added',
        linesAdded: 118,
        linesRemoved: 0,
        lastModifiedAt: minutesAgo(52),
      },
      {
        path: 'src/app/refunds/refund-status-panel.component.ts',
        repositoryId: REPO_IDS.portal,
        changeType: 'added',
        linesAdded: 146,
        linesRemoved: 0,
        lastModifiedAt: minutesAgo(41),
      },
      {
        path: 'src/app/refunds/refund-status.store.spec.ts',
        repositoryId: REPO_IDS.portal,
        changeType: 'modified',
        linesAdded: 67,
        linesRemoved: 9,
        lastModifiedAt: minutesAgo(11),
      },
      {
        path: 'src/app/refunds/refunds.routes.ts',
        repositoryId: REPO_IDS.portal,
        changeType: 'modified',
        linesAdded: 12,
        linesRemoved: 3,
        lastModifiedAt: minutesAgo(58),
      },
    ],
    toolExecutions: [
      exec(
        AGENT_IDS.angular,
        'build.npm',
        'npm run test -- --include=**/refund-status.store.spec.ts',
        2,
        0,
        'running',
        undefined,
        'Chrome Headless 131 executing 3 of 12 specs ...',
      ),
      exec(
        AGENT_IDS.angular,
        'build.npm',
        'npm run lint',
        24,
        38_000,
        'succeeded',
        0,
        'All files pass linting.',
      ),
      exec(
        AGENT_IDS.angular,
        'ci.actions',
        'gh run view 1190 --log-failed',
        18,
        2_400,
        'succeeded',
        0,
        'refund-status.store.spec.ts: 3 failing (expected polling subscription to be closed).',
      ),
    ],
    errors: [
      {
        code: 'CI_FAILURE',
        message: 'Workflow run 1190 failed at the unit-tests stage.',
        occurredAt: minutesAgo(19),
        severity: 'error',
        retryable: true,
        detail:
          'FAILED refund-status.store.spec.ts > stops polling once status is terminal\n  Expected interval subscription to be closed, but 2 timers were still scheduled.',
      },
    ],
    artifacts: [
      {
        id: 'art-portal-coverage',
        name: 'coverage-lcov.info',
        kind: 'coverage',
        sizeBytes: 284_119,
        createdAt: minutesAgo(19),
        url: `${ORG}/customer-portal/actions/runs/1190/artifacts/coverage`,
      },
    ],
    links: [
      { label: 'PR 311', url: `${ORG}/customer-portal/pull/311`, system: 'github' },
      { label: 'PORT-908', url: `${JIRA}/PORT-908`, system: 'jira' },
      { label: 'Run 1190', url: `${ORG}/customer-portal/actions/runs/1190`, system: 'ci' },
    ],
  },

  [AGENT_IDS.test]: {
    systemPrompt: `You are qa-01, the test engineering agent.

Scope
- You write and maintain automated tests: unit, integration, and consumer-driven contract tests.
- You do not change production code to make a test pass. If production code is wrong, report it.

Method
1. Derive test cases from the acceptance criteria on the Jira issue, not from the implementation.
2. Prefer Testcontainers over mocks for anything that touches persistence or messaging.
3. Report flaky tests explicitly; quarantine only with an approval and a linked follow-up issue.

Constraints
- Never modify files under src/main. Test sources and fixtures only.
- Never disable or delete an existing test to make a suite green.
- Container runtime access is sandboxed; if the runtime is unavailable, fail loudly rather than skipping coverage.`,
    capabilities: [
      capability('read_repository'),
      capability('write_code'),
      capability('run_tests'),
      capability('run_build'),
      capability('create_branch'),
      capability('create_commit'),
    ],
    allowedTools: [
      TOOL_CATALOG.gitRead,
      TOOL_CATALOG.gitWrite,
      TOOL_CATALOG.fsRead,
      TOOL_CATALOG.fsWrite,
      TOOL_CATALOG.shell,
      TOOL_CATALOG.maven,
      TOOL_CATALOG.coverage,
      TOOL_CATALOG.codeSearch,
      TOOL_CATALOG.jira,
    ],
    executionHistory: [
      {
        taskId: TASK_IDS.contractTests,
        title: 'Consumer-driven contract tests for refund API',
        startedAt: hoursAgo(2.9),
        finishedAt: minutesAgo(12),
        outcome: 'failed',
        summary:
          'Aborted after 3 consecutive Testcontainers start failures. Docker socket is not reachable on runner-eu-west-1a-11.',
        tokensUsed: 380_700,
      },
    ],
    logs: [
      log(AGENT_IDS.test, 174, 'info', 'runtime', 'Agent started; profile qa@v6 loaded.'),
      log(
        AGENT_IDS.test,
        168,
        'info',
        'planner',
        'Derived 14 contract cases from PAY-2381 acceptance criteria.',
        TASK_IDS.contractTests,
      ),
      log(
        AGENT_IDS.test,
        141,
        'info',
        'tool.fs',
        'Added RefundContractIT with a Postgres and Kafka Testcontainers fixture.',
        TASK_IDS.contractTests,
      ),
      log(
        AGENT_IDS.test,
        58,
        'warning',
        'tool.maven',
        'Testcontainers start failed (attempt 1/3): permission denied on /var/run/docker.sock.',
        TASK_IDS.contractTests,
      ),
      log(
        AGENT_IDS.test,
        41,
        'warning',
        'tool.maven',
        'Testcontainers start failed (attempt 2/3): permission denied on /var/run/docker.sock.',
        TASK_IDS.contractTests,
      ),
      log(
        AGENT_IDS.test,
        14,
        'error',
        'tool.maven',
        'Testcontainers start failed (attempt 3/3). Giving up.',
        TASK_IDS.contractTests,
      ),
      log(
        AGENT_IDS.test,
        12,
        'critical',
        'runtime',
        'Task failed: container runtime unavailable. Escalating to ops-01 and marking the agent failed.',
        TASK_IDS.contractTests,
      ),
    ],
    changedFiles: [
      {
        path: 'payments-api/src/test/java/com/northwind/payments/contract/RefundContractIT.java',
        repositoryId: REPO_IDS.payments,
        changeType: 'added',
        linesAdded: 214,
        linesRemoved: 0,
        lastModifiedAt: minutesAgo(141),
      },
      {
        path: 'payments-api/src/test/resources/contracts/refund-v1.json',
        repositoryId: REPO_IDS.payments,
        changeType: 'added',
        linesAdded: 88,
        linesRemoved: 0,
        lastModifiedAt: minutesAgo(148),
      },
      {
        path: 'payments-api/src/test/java/com/northwind/payments/support/ContainerFixture.java',
        repositoryId: REPO_IDS.payments,
        changeType: 'modified',
        linesAdded: 31,
        linesRemoved: 6,
        lastModifiedAt: minutesAgo(64),
      },
    ],
    toolExecutions: [
      exec(
        AGENT_IDS.test,
        'build.maven',
        'mvn -pl payments-api verify -Dtest=RefundContractIT',
        14,
        62_000,
        'failed',
        1,
        'Caused by: com.github.dockerjava.api.exception.InternalServerErrorException: permission denied while trying to connect to the Docker daemon socket',
      ),
      exec(
        AGENT_IDS.test,
        'shell.exec',
        'docker info',
        16,
        1_100,
        'failed',
        1,
        'Got permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock',
      ),
      exec(
        AGENT_IDS.test,
        'analysis.coverage',
        'jacoco:report && coverage-diff --base main',
        120,
        14_800,
        'succeeded',
        0,
        'Diff coverage on changed lines: 78.2% (threshold 70%).',
      ),
    ],
    errors: [
      {
        code: 'RUNTIME_UNAVAILABLE',
        message: 'Container runtime is not reachable from this runner.',
        occurredAt: minutesAgo(14),
        severity: 'critical',
        retryable: true,
        detail:
          'permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock\nRunner: runner-eu-west-1a-11\nRemediation: reschedule onto a runner in the docker-enabled pool, or grant socket access.',
      },
    ],
    artifacts: [
      {
        id: 'art-contract-report',
        name: 'contract-test-plan.md',
        kind: 'document',
        sizeBytes: 9_812,
        createdAt: minutesAgo(160),
        url: `${ORG}/payments-service/blob/test/PAY-2381-contract-tests/docs/testing/contract-plan.md`,
      },
    ],
    links: [
      { label: 'PAY-2381', url: `${JIRA}/PAY-2381`, system: 'jira' },
      { label: 'PLAT-1490 (runner)', url: `${JIRA}/PLAT-1490`, system: 'jira' },
    ],
  },

  [AGENT_IDS.security]: {
    systemPrompt: `You are sec-01, the security review agent.

Scope
- You review changes for injection, authorisation, secret handling, and dependency risk.
- You maintain the agent policy set in agent-config.

Method
1. Run SAST and dependency scanning on the diff, not the whole repository, unless asked otherwise.
2. Rank findings by exploitability in this system, not by generic CVSS alone. State the reachable path.
3. For every finding, give a concrete remediation and the file and line it applies to.

Constraints
- You may never read a secret value. Requesting a credential goes through POL-003 and produces an approval request; wait for the decision rather than working around it.
- You may not weaken a policy rule. Proposing a change to agent-config requires a pull request and human review.
- You may not open pull requests against production configuration.`,
    capabilities: [
      capability('read_repository'),
      capability('write_code'),
      capability('review_pull_request'),
      capability('create_branch'),
      capability('create_commit'),
      capability('open_pull_request'),
      capability('read_secrets'),
    ],
    allowedTools: [
      TOOL_CATALOG.gitRead,
      TOOL_CATALOG.gitWrite,
      TOOL_CATALOG.githubPr,
      TOOL_CATALOG.githubReview,
      TOOL_CATALOG.fsRead,
      TOOL_CATALOG.fsWrite,
      TOOL_CATALOG.sast,
      TOOL_CATALOG.codeSearch,
      TOOL_CATALOG.webSearch,
    ],
    executionHistory: [
      {
        taskId: TASK_IDS.dependencyAudit,
        title: 'Dependency and secret-handling audit for PAY-2381',
        startedAt: hoursAgo(7.4),
        outcome: 'in_progress',
        summary:
          '2 medium findings raised on the refund diff. Blocked resolving private transitive dependencies without registry credentials.',
        tokensUsed: 596_200,
      },
      {
        taskId: TASK_IDS.promptRegression,
        title: 'Deny read_secrets in the reviewer agent profile (AGT-77)',
        startedAt: hoursAgo(22),
        finishedAt: hoursAgo(18),
        outcome: 'succeeded',
        summary:
          'Added an explicit deny-list entry and a policy simulation test. PR 23 open; main is currently red on the same check.',
        tokensUsed: 402_600,
      },
    ],
    logs: [
      log(AGENT_IDS.security, 444, 'info', 'runtime', 'Agent started; profile security@v9 loaded.'),
      log(
        AGENT_IDS.security,
        438,
        'info',
        'tool.sast',
        'Scanning diff for PR 482 (14 files).',
        TASK_IDS.dependencyAudit,
      ),
      log(
        AGENT_IDS.security,
        402,
        'warning',
        'tool.sast',
        'Finding SEC-2211 (medium): idempotency key is logged at INFO in RefundController:88.',
        TASK_IDS.dependencyAudit,
      ),
      log(
        AGENT_IDS.security,
        388,
        'warning',
        'tool.sast',
        'Finding SEC-2212 (medium): outbox payload retains the full card BIN; mask before persistence.',
        TASK_IDS.dependencyAudit,
      ),
      log(
        AGENT_IDS.security,
        61,
        'info',
        'tool.sast',
        'Dependency resolution incomplete: 3 transitive artifacts live in the private registry.',
        TASK_IDS.dependencyAudit,
      ),
      log(
        AGENT_IDS.security,
        34,
        'notice',
        'policy',
        'Requested read access to NEXUS_READ_TOKEN. Gated by POL-003; approval APR-2205 raised.',
        TASK_IDS.dependencyAudit,
      ),
      log(
        AGENT_IDS.security,
        34,
        'warning',
        'runtime',
        'Agent blocked awaiting approval APR-2205. No workaround attempted.',
        TASK_IDS.dependencyAudit,
      ),
    ],
    changedFiles: [
      {
        path: 'profiles/reviewer.yaml',
        repositoryId: REPO_IDS.agentConfig,
        changeType: 'modified',
        linesAdded: 18,
        linesRemoved: 4,
        lastModifiedAt: hoursAgo(2.6),
      },
      {
        path: 'policy/deny-list.yaml',
        repositoryId: REPO_IDS.agentConfig,
        changeType: 'modified',
        linesAdded: 22,
        linesRemoved: 2,
        lastModifiedAt: hoursAgo(2.6),
      },
      {
        path: 'test/policy-simulation.spec.ts',
        repositoryId: REPO_IDS.agentConfig,
        changeType: 'modified',
        linesAdded: 48,
        linesRemoved: 6,
        lastModifiedAt: hoursAgo(2.7),
      },
      {
        path: 'docs/policy/POL-003.md',
        repositoryId: REPO_IDS.agentConfig,
        changeType: 'added',
        linesAdded: 8,
        linesRemoved: 0,
        lastModifiedAt: hoursAgo(2.8),
      },
    ],
    toolExecutions: [
      exec(
        AGENT_IDS.security,
        'analysis.sast',
        'semgrep --config policy/rules --diff-base main',
        438,
        94_000,
        'succeeded',
        0,
        '2 medium, 0 high, 0 critical findings on the changed lines.',
      ),
      exec(
        AGENT_IDS.security,
        'analysis.sast',
        'osv-scanner --lockfile payments-api/pom.xml',
        61,
        22_000,
        'failed',
        2,
        '3 artifacts could not be resolved: 401 Unauthorized from nexus.internal.northwind.',
      ),
      exec(
        AGENT_IDS.security,
        'github.review',
        'gh pr review 482 --comment --body "SEC-2211, SEC-2212 raised inline."',
        380,
        1_800,
        'succeeded',
        0,
        'Review comment posted.',
      ),
    ],
    errors: [
      {
        code: 'POLICY_GATE',
        message: 'Secret access denied without approval (POL-003).',
        occurredAt: minutesAgo(34),
        severity: 'warning',
        retryable: false,
        detail:
          'Requested: NEXUS_READ_TOKEN (registry read scope)\nRule: POL-003 No autonomous secret access\nOutcome: request queued as APR-2205; the agent is blocked until an operator decides.',
      },
    ],
    artifacts: [
      {
        id: 'art-sast-482',
        name: 'sast-findings-pr482.sarif',
        kind: 'report',
        sizeBytes: 148_204,
        createdAt: hoursAgo(7.1),
        url: `${ORG}/payments-service/security/code-scanning?pr=482`,
      },
      {
        id: 'art-sbom-payments',
        name: 'payments-service-sbom.json',
        kind: 'sbom',
        sizeBytes: 812_440,
        createdAt: hoursAgo(6.4),
        url: `${ORG}/payments-service/actions/runs/2841/artifacts/sbom`,
      },
    ],
    links: [
      { label: 'PR 23', url: `${ORG}/agent-config/pull/23`, system: 'github' },
      { label: 'PR 482 review', url: `${ORG}/payments-service/pull/482#pullrequestreview`, system: 'github' },
      { label: 'AGT-77', url: `${JIRA}/AGT-77`, system: 'jira' },
    ],
  },

  [AGENT_IDS.devops]: {
    systemPrompt: `You are ops-01, the DevOps agent.

Scope
- You own CI workflows, runner configuration, and Terraform for the payments platform.
- You keep pipelines fast and deterministic.

Method
1. Change one variable at a time and measure. Record before and after timings in the pull request body.
2. Always run 'terraform plan' and attach the plan output to the approval request. Never apply directly.
3. Prefer pinning versions over floating tags in anything that runs in CI.

Constraints
- 'terraform apply' and 'terraform destroy' are gated by POL-004 and require an approval containing the exact plan.
- Production deployment is gated by POL-002.
- You may read cluster state in non-production contexts only.
- Triggering shared-runner workflows is gated by POL-009.`,
    capabilities: [
      capability('read_repository'),
      capability('write_code'),
      capability('run_build'),
      capability('create_branch'),
      capability('create_commit'),
      capability('open_pull_request'),
      capability('trigger_pipeline'),
      capability('deploy_staging'),
      capability('deploy_production'),
      capability('modify_infrastructure'),
    ],
    allowedTools: [
      TOOL_CATALOG.gitRead,
      TOOL_CATALOG.gitWrite,
      TOOL_CATALOG.githubPr,
      TOOL_CATALOG.fsRead,
      TOOL_CATALOG.fsWrite,
      TOOL_CATALOG.shell,
      TOOL_CATALOG.actions,
      TOOL_CATALOG.terraform,
      TOOL_CATALOG.kubectl,
      TOOL_CATALOG.codeSearch,
    ],
    executionHistory: [
      {
        taskId: TASK_IDS.runnerUpgrade,
        title: 'Pin runner image and split the Java test matrix (PLAT-1482)',
        startedAt: hoursAgo(6.6),
        outcome: 'in_progress',
        summary:
          'Matrix split reduced wall-clock time from 12m04s to 7m41s on the sample branch. Awaiting run 742 before requesting review.',
        tokensUsed: 529_100,
      },
      {
        taskId: TASK_IDS.terraformDrift,
        title: 'Reconcile drift in payments-prod node pool tags (INFRA-233)',
        startedAt: hoursAgo(4.2),
        outcome: 'in_progress',
        summary: 'Plan produced: 2 changes, 0 additions, 0 destroys. Apply is pending APR-2207.',
        tokensUsed: 194_800,
      },
    ],
    logs: [
      log(AGENT_IDS.devops, 396, 'info', 'runtime', 'Agent started; profile devops@v8 loaded.'),
      log(
        AGENT_IDS.devops,
        382,
        'info',
        'tool.fs',
        'Pinned runner image to ubuntu-24.04 across 4 reusable workflows.',
        TASK_IDS.runnerUpgrade,
      ),
      log(
        AGENT_IDS.devops,
        251,
        'info',
        'tool.actions',
        'Baseline measured: build-and-verify 12m04s wall clock on main.',
        TASK_IDS.runnerUpgrade,
      ),
      log(
        AGENT_IDS.devops,
        114,
        'notice',
        'tool.terraform',
        'terraform plan: 2 to change, 0 to add, 0 to destroy.',
        TASK_IDS.terraformDrift,
      ),
      log(
        AGENT_IDS.devops,
        110,
        'notice',
        'policy',
        'terraform apply blocked by POL-004; approval APR-2207 raised with the plan attached.',
        TASK_IDS.terraformDrift,
      ),
      log(
        AGENT_IDS.devops,
        42,
        'info',
        'tool.actions',
        'Split matrix measured: 7m41s wall clock, 36% faster than baseline.',
        TASK_IDS.runnerUpgrade,
      ),
      log(
        AGENT_IDS.devops,
        24,
        'info',
        'runtime',
        'Waiting on workflow run 742 before requesting review on PR 97.',
        TASK_IDS.runnerUpgrade,
      ),
    ],
    changedFiles: [
      {
        path: '.github/workflows/build-and-verify.yml',
        repositoryId: REPO_IDS.platform,
        changeType: 'modified',
        linesAdded: 64,
        linesRemoved: 51,
        lastModifiedAt: minutesAgo(24),
      },
      {
        path: '.github/workflows/reusable-java.yml',
        repositoryId: REPO_IDS.platform,
        changeType: 'modified',
        linesAdded: 42,
        linesRemoved: 38,
        lastModifiedAt: minutesAgo(28),
      },
      {
        path: 'runners/pool-config.yaml',
        repositoryId: REPO_IDS.platform,
        changeType: 'modified',
        linesAdded: 12,
        linesRemoved: 8,
        lastModifiedAt: hoursAgo(4.2),
      },
      {
        path: 'env/prod/payments/node-pools.tf',
        repositoryId: REPO_IDS.infra,
        changeType: 'modified',
        linesAdded: 14,
        linesRemoved: 4,
        lastModifiedAt: hoursAgo(1.9),
      },
      {
        path: 'env/prod/payments/labels.tf',
        repositoryId: REPO_IDS.infra,
        changeType: 'modified',
        linesAdded: 4,
        linesRemoved: 2,
        lastModifiedAt: hoursAgo(1.9),
      },
    ],
    toolExecutions: [
      exec(
        AGENT_IDS.devops,
        'infra.terraform',
        'terraform plan -out=drift.tfplan -var-file=env/prod/payments.tfvars',
        114,
        180_000,
        'succeeded',
        0,
        'Plan: 0 to add, 2 to change, 0 to destroy.',
      ),
      exec(
        AGENT_IDS.devops,
        'ci.actions',
        'gh workflow run reusable-workflows-verify.yml --ref ci/PLAT-1482-runner-pin',
        42,
        2_600,
        'succeeded',
        0,
        'Queued run 742.',
      ),
      exec(
        AGENT_IDS.devops,
        'infra.kubectl',
        'kubectl --context staging get nodes -l pool=payments -o wide',
        130,
        3_400,
        'succeeded',
        0,
        '6 nodes Ready; 2 tainted for spot eviction.',
      ),
    ],
    errors: [],
    artifacts: [
      {
        id: 'art-tfplan',
        name: 'drift.tfplan.txt',
        kind: 'report',
        sizeBytes: 24_806,
        createdAt: hoursAgo(1.9),
        url: `${ORG}/infra-terraform/actions/runs/318/artifacts/plan`,
      },
      {
        id: 'art-ci-timings',
        name: 'pipeline-timings.csv',
        kind: 'report',
        sizeBytes: 6_244,
        createdAt: minutesAgo(42),
        url: `${ORG}/platform-ci/actions/runs/742/artifacts/timings`,
      },
    ],
    links: [
      { label: 'PR 97', url: `${ORG}/platform-ci/pull/97`, system: 'github' },
      { label: 'PR 64', url: `${ORG}/infra-terraform/pull/64`, system: 'github' },
      { label: 'PLAT-1482', url: `${JIRA}/PLAT-1482`, system: 'jira' },
      { label: 'INFRA-233', url: `${JIRA}/INFRA-233`, system: 'jira' },
    ],
  },

  [AGENT_IDS.review]: {
    systemPrompt: `You are rev-01, the code review agent.

Scope
- You review pull requests authored by other agents and by humans.
- You look for correctness, regression risk, and convention drift. You do not rewrite the change yourself.

Method
1. Read the linked issue and the diff in full before commenting. Never review a truncated diff.
2. Distinguish blocking findings from suggestions. Blocking findings must name a concrete failure scenario.
3. Verify that tests cover the behaviour the diff claims to change.
4. Approve only when every blocking finding is resolved.

Constraints
- You may not merge. Merging is gated by POL-001.
- You may not push commits to another agent's branch. Post a review comment instead.
- Reviews you submit are attributed to this agent and are visible to the whole team.`,
    capabilities: [
      capability('read_repository'),
      capability('review_pull_request'),
      capability('run_tests'),
      capability('merge_to_main'),
    ],
    allowedTools: [
      TOOL_CATALOG.gitRead,
      TOOL_CATALOG.githubReview,
      TOOL_CATALOG.fsRead,
      TOOL_CATALOG.codeSearch,
      TOOL_CATALOG.coverage,
      TOOL_CATALOG.actions,
    ],
    executionHistory: [
      {
        taskId: TASK_IDS.reviewPr482,
        title: 'Review PR 482: refund idempotency',
        startedAt: minutesAgo(4),
        outcome: 'in_progress',
        summary: 'Queued behind 2 runs; waiting for PR 482 checks to reach a terminal state.',
        tokensUsed: 109_200,
      },
      {
        taskId: TASK_IDS.a11yAudit,
        title: 'Review PR 308: dialog focus handling',
        startedAt: hoursAgo(26),
        finishedAt: hoursAgo(24.6),
        outcome: 'succeeded',
        summary:
          'Requested changes: focus restoration relied on a template reference that is null after route change.',
        tokensUsed: 214_700,
      },
    ],
    logs: [
      log(AGENT_IDS.review, 4, 'info', 'runtime', 'Agent started; profile reviewer@v6 loaded.'),
      log(
        AGENT_IDS.review,
        4,
        'info',
        'scheduler',
        'Queued: 2 runs ahead in the reviewer pool.',
        TASK_IDS.reviewPr482,
      ),
      log(
        AGENT_IDS.review,
        3.8,
        'info',
        'planner',
        'Deferring the review until run 2843 reaches a terminal state.',
        TASK_IDS.reviewPr482,
      ),
    ],
    changedFiles: [],
    toolExecutions: [
      exec(
        AGENT_IDS.review,
        'ci.actions',
        'gh run list --branch feature/PAY-2381-refund-idempotency --limit 1',
        3.5,
        1_400,
        'succeeded',
        0,
        'run 2843: in_progress',
      ),
    ],
    errors: [],
    artifacts: [],
    links: [{ label: 'PR 482', url: `${ORG}/payments-service/pull/482`, system: 'github' }],
  },

  [AGENT_IDS.docs]: {
    systemPrompt: `You are doc-01, the documentation agent.

Scope
- You maintain the OpenAPI reference, service runbooks, the ADR index, and changelogs.
- You document what the code does, not what it should do. If they differ, raise the discrepancy.

Method
1. Regenerate the API reference from the committed specification; never hand-edit generated output.
2. Every runbook step must be executable as written, with the exact command and the expected output.
3. Link every changelog entry to its pull request and issue.

Constraints
- Documentation-only changes. Do not modify code, tests, or configuration.
- Pull request creation is gated by POL-008.`,
    capabilities: [
      capability('read_repository'),
      capability('write_code'),
      capability('create_branch'),
      capability('create_commit'),
      capability('open_pull_request'),
    ],
    allowedTools: [
      TOOL_CATALOG.gitRead,
      TOOL_CATALOG.gitWrite,
      TOOL_CATALOG.githubPr,
      TOOL_CATALOG.fsRead,
      TOOL_CATALOG.fsWrite,
      TOOL_CATALOG.openapi,
      TOOL_CATALOG.codeSearch,
    ],
    executionHistory: [
      {
        taskId: TASK_IDS.openapiDocs,
        title: 'Refresh the payments runbook after the outbox change',
        startedAt: hoursAgo(8),
        finishedAt: hoursAgo(3.4),
        outcome: 'succeeded',
        summary:
          'Runbook section 4 rewritten for outbox dispatch; added a dead-letter recovery procedure.',
        tokensUsed: 225_800,
      },
    ],
    logs: [
      log(AGENT_IDS.docs, 480, 'info', 'runtime', 'Agent started; profile docs@v3 loaded.'),
      log(
        AGENT_IDS.docs,
        212,
        'info',
        'tool.fs',
        'Rewrote docs/runbooks/payments.md section 4 (outbox dispatch).',
        TASK_IDS.openapiDocs,
      ),
      log(
        AGENT_IDS.docs,
        204,
        'info',
        'tool.github',
        'Opened PR 476; merged by m.dekker.',
        TASK_IDS.openapiDocs,
      ),
      log(AGENT_IDS.docs, 204, 'info', 'runtime', 'Task completed; agent idle, awaiting assignment.'),
    ],
    changedFiles: [],
    toolExecutions: [
      exec(
        AGENT_IDS.docs,
        'analysis.openapi',
        'openapi bundle api/payments.yaml --output docs/reference/payments.json',
        230,
        4_100,
        'succeeded',
        0,
        'Bundled 41 paths, 0 warnings.',
      ),
    ],
    errors: [],
    artifacts: [
      {
        id: 'art-runbook',
        name: 'payments-runbook.pdf',
        kind: 'document',
        sizeBytes: 1_042_889,
        createdAt: hoursAgo(3.4),
        url: `${ORG}/payments-service/blob/main/docs/runbooks/payments.md`,
      },
    ],
    links: [{ label: 'Runbook', url: `${ORG}/payments-service/blob/main/docs/runbooks/payments.md`, system: 'docs' }],
  },

  [AGENT_IDS.jira]: {
    systemPrompt: `You are jira-01, the coordination agent.

Scope
- You keep the agent task board and the Jira backlog consistent.
- You report scope changes and blocked work to the humans running the fleet.

Method
1. Mirror status transitions in one direction only: agent task board to Jira. Never invent Jira issues from agent chatter.
2. Before creating an issue, search for an existing one by key, title, and branch name.
3. Summarise blockers as facts with a source link. Do not speculate about cause.

Constraints
- Every Jira write is gated by POL-010 and appears in the Approval Center.
- Never transition an issue to Done. Only a human closes work.
- Never comment on customer-visible issues.`,
    capabilities: [
      capability('read_repository'),
      capability('modify_issue_tracker'),
      capability('send_external_message'),
    ],
    allowedTools: [TOOL_CATALOG.jira, TOOL_CATALOG.gitRead, TOOL_CATALOG.codeSearch],
    executionHistory: [
      {
        taskId: TASK_IDS.backlogSync,
        title: 'Sync agent task board with the PAY sprint backlog',
        startedAt: hoursAgo(5.2),
        finishedAt: hoursAgo(1.6),
        outcome: 'cancelled',
        summary:
          'Stopped by operator m.dekker after the agent proposed 3 duplicate subtasks under PAY-2381.',
        tokensUsed: 171_600,
      },
    ],
    logs: [
      log(AGENT_IDS.jira, 312, 'info', 'runtime', 'Agent started; profile coordination@v2 loaded.'),
      log(
        AGENT_IDS.jira,
        280,
        'info',
        'tool.jira',
        'Read 42 issues from the PAY board; matched 11 to active agent tasks.',
        TASK_IDS.backlogSync,
      ),
      log(
        AGENT_IDS.jira,
        140,
        'warning',
        'planner',
        'Proposed 3 subtasks under PAY-2381 that duplicate existing PAY-2383, PAY-2384, PAY-2385.',
        TASK_IDS.backlogSync,
      ),
      log(
        AGENT_IDS.jira,
        102,
        'notice',
        'policy',
        'Subtask creation gated by POL-010; approval APR-2209 raised.',
        TASK_IDS.backlogSync,
      ),
      log(
        AGENT_IDS.jira,
        96,
        'warning',
        'runtime',
        'Stopped by operator m.dekker: "duplicate detection is wrong, fix the matcher first".',
        TASK_IDS.backlogSync,
      ),
    ],
    changedFiles: [],
    toolExecutions: [
      exec(
        AGENT_IDS.jira,
        'tracker.jira',
        'jira issue list --project PAY --sprint "PAY Sprint 41"',
        280,
        5_200,
        'succeeded',
        0,
        '42 issues returned.',
      ),
      exec(
        AGENT_IDS.jira,
        'tracker.jira',
        'jira issue create --parent PAY-2381 --type Sub-task --summary "Add idempotency key index"',
        102,
        400,
        'cancelled',
        undefined,
        'Blocked by POL-010. Approval APR-2209 raised instead.',
      ),
    ],
    errors: [
      {
        code: 'OPERATOR_STOP',
        message: 'Agent stopped by an operator during backlog synchronisation.',
        occurredAt: hoursAgo(1.6),
        severity: 'notice',
        retryable: true,
        detail:
          'Operator: m.dekker\nReason: duplicate subtask proposals under PAY-2381.\nFollow-up: AGT-81 (improve the duplicate matcher before restarting this task).',
      },
    ],
    artifacts: [],
    links: [
      { label: 'PAY board', url: `${JIRA}/PAY`, system: 'jira' },
      { label: 'AGT-81', url: `${JIRA}/AGT-81`, system: 'jira' },
    ],
  },

  [AGENT_IDS.release]: {
    systemPrompt: `You are rel-01, the release agent.

Scope
- You assemble release candidates: version bump, changelog, tag, and artifact promotion.
- You verify that every issue in the release has a merged pull request and a green pipeline.

Method
1. Build the release note from merged pull requests since the previous tag, grouped by conventional commit type.
2. Refuse to cut a release when any included pull request has a failing required check. State which one.
3. Attach the exact commit range and the artifact digests to the approval request.

Constraints
- Merging the release branch into main is gated by POL-001.
- Production promotion is gated by POL-002.
- You never edit source code. If a fix is needed, hand it back to the owning agent.`,
    capabilities: [
      capability('read_repository'),
      capability('create_branch'),
      capability('create_commit'),
      capability('open_pull_request'),
      capability('merge_to_main'),
      capability('trigger_pipeline'),
      capability('deploy_production'),
    ],
    allowedTools: [
      TOOL_CATALOG.gitRead,
      TOOL_CATALOG.gitWrite,
      TOOL_CATALOG.githubPr,
      TOOL_CATALOG.fsRead,
      TOOL_CATALOG.actions,
      TOOL_CATALOG.jira,
    ],
    executionHistory: [
      {
        taskId: TASK_IDS.releaseCut,
        title: 'Cut release 2026.8.1 for payments-service',
        startedAt: hoursAgo(1.1),
        outcome: 'in_progress',
        summary:
          'Release notes assembled from 14 merged pull requests. Merge to main is pending approval APR-2201.',
        tokensUsed: 162_400,
      },
    ],
    logs: [
      log(AGENT_IDS.release, 66, 'info', 'runtime', 'Agent started; profile release@v4 loaded.'),
      log(
        AGENT_IDS.release,
        62,
        'info',
        'tool.git',
        'Created release/2026.8.1 from main@4b8d0e2.',
        TASK_IDS.releaseCut,
      ),
      log(
        AGENT_IDS.release,
        48,
        'info',
        'planner',
        'Collected 14 merged pull requests since tag v2026.8.0.',
        TASK_IDS.releaseCut,
      ),
      log(
        AGENT_IDS.release,
        31,
        'warning',
        'planner',
        'PR 482 is included but its checks are still running; release note marks it provisional.',
        TASK_IDS.releaseCut,
      ),
      log(
        AGENT_IDS.release,
        18,
        'info',
        'tool.fs',
        'Wrote CHANGELOG.md entry for 2026.8.1 (14 entries across 4 sections).',
        TASK_IDS.releaseCut,
      ),
      log(
        AGENT_IDS.release,
        17,
        'notice',
        'policy',
        'Merge to main blocked by POL-001; approval APR-2201 raised with the commit range attached.',
        TASK_IDS.releaseCut,
      ),
    ],
    changedFiles: [
      {
        path: 'CHANGELOG.md',
        repositoryId: REPO_IDS.payments,
        changeType: 'modified',
        linesAdded: 46,
        linesRemoved: 0,
        lastModifiedAt: minutesAgo(18),
      },
      {
        path: 'pom.xml',
        repositoryId: REPO_IDS.payments,
        changeType: 'modified',
        linesAdded: 1,
        linesRemoved: 1,
        lastModifiedAt: minutesAgo(20),
      },
    ],
    toolExecutions: [
      exec(
        AGENT_IDS.release,
        'git.read',
        'git log v2026.8.0..release/2026.8.1 --merges --oneline',
        48,
        1_200,
        'succeeded',
        0,
        '14 merge commits.',
      ),
      exec(
        AGENT_IDS.release,
        'ci.actions',
        'gh run list --branch release/2026.8.1 --limit 5',
        22,
        1_900,
        'succeeded',
        0,
        'run 2842: success (build-and-verify).',
      ),
    ],
    errors: [],
    artifacts: [
      {
        id: 'art-release-notes',
        name: 'release-notes-2026.8.1.md',
        kind: 'document',
        sizeBytes: 14_226,
        createdAt: minutesAgo(18),
        url: `${ORG}/payments-service/blob/release/2026.8.1/CHANGELOG.md`,
      },
    ],
    links: [
      { label: 'release/2026.8.1', url: `${ORG}/payments-service/tree/release/2026.8.1`, system: 'github' },
      { label: 'Run 2842', url: `${ORG}/payments-service/actions/runs/2842`, system: 'ci' },
    ],
  },
};

export const AGENT_DETAILS: Readonly<Record<AgentId, AgentDetail>> = Object.fromEntries(
  AGENTS.map((agent) => {
    const seed = DETAIL_SEEDS[agent.id];
    if (!seed) {
      throw new Error(`Missing detail seed for agent ${agent.id}`);
    }
    return [agent.id, { agent, ...seed } satisfies AgentDetail];
  }),
) as Record<AgentId, AgentDetail>;

/** Flattened log stream across the whole fleet, newest first. */
export const ALL_LOGS: readonly AgentLog[] = Object.values(AGENT_DETAILS)
  .flatMap((detail) => detail.logs)
  .slice()
  .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
