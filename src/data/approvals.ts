import { approvalRequestId, type ApprovalRequest } from '@/types';
import { AGENT_IDS, REPO_IDS, TASK_IDS } from './ids';
import { hoursAgo, hoursFromNow, minutesAgo } from './time';

export const APPROVAL_REQUESTS: readonly ApprovalRequest[] = [
  {
    id: approvalRequestId('APR-2201'),
    actionType: 'merge_to_main',
    title: 'Merge release/2026.8.1 into main (payments-service)',
    agentId: AGENT_IDS.release,
    taskId: TASK_IDS.releaseCut,
    repositoryId: REPO_IDS.payments,
    reason:
      'Release 2026.8.1 collects 14 merged pull requests since v2026.8.0. The release branch build (run 2842) is green. Merging into main is the last step before tagging.',
    risk: 'high',
    impact:
      'main becomes the 2026.8.1 candidate for every downstream consumer. PR 482 is included but its checks are still running, so the changelog marks that entry provisional. Reverting after the tag requires a new patch release.',
    proposedChange: {
      summary: 'Fast-forward merge of release/2026.8.1 into main, 14 merge commits, no conflicts.',
      command: 'git merge --ff-only release/2026.8.1 && git tag -a v2026.8.1 -m "Release 2026.8.1"',
      affectedPaths: ['CHANGELOG.md', 'pom.xml', 'payments-domain/**', 'payments-api/**'],
      targetBranch: 'main',
    },
    requestedAt: minutesAgo(17),
    expiresAt: hoursFromNow(7),
    status: 'pending',
    policyRules: ['POL-001'],
  },
  {
    id: approvalRequestId('APR-2205'),
    actionType: 'access_secret',
    title: 'Read NEXUS_READ_TOKEN to resolve private dependencies',
    agentId: AGENT_IDS.security,
    taskId: TASK_IDS.dependencyAudit,
    repositoryId: REPO_IDS.payments,
    reason:
      'Three transitive artifacts (northwind-crypto, northwind-ledger-client, northwind-audit-sdk) live in the private registry. Without a read token the dependency scan covers 84% of the tree, which is not enough to sign off on PAY-2381.',
    risk: 'critical',
    impact:
      'Grants the agent read scope on the internal artifact registry for the duration of one scan. The token is never written to the workspace and the grant is recorded against sec-01 in the audit log. No write scope is requested.',
    proposedChange: {
      summary: 'Inject NEXUS_READ_TOKEN as a masked environment variable for a single scanner run.',
      command: 'osv-scanner --lockfile payments-api/pom.xml --registry nexus.internal.northwind',
      affectedPaths: [],
    },
    requestedAt: minutesAgo(34),
    expiresAt: hoursFromNow(2),
    status: 'pending',
    policyRules: ['POL-003'],
  },
  {
    id: approvalRequestId('APR-2207'),
    actionType: 'modify_infrastructure',
    title: 'terraform apply: reconcile payments-prod node pool tags',
    agentId: AGENT_IDS.devops,
    taskId: TASK_IDS.terraformDrift,
    repositoryId: REPO_IDS.infra,
    reason:
      'The live cluster carries labels that were set manually during the incident on 28 July. Terraform state disagrees, so every subsequent plan is noisy and the next unrelated apply would silently revert them.',
    risk: 'critical',
    impact:
      'Two node pool resources are updated in place in the production project. No nodes are recreated and no workload is evicted: the change is limited to labels and tags. A destroy would appear in the plan if that were not the case.',
    proposedChange: {
      summary: 'Apply the reviewed plan: 0 to add, 2 to change, 0 to destroy.',
      command: 'terraform apply drift.tfplan',
      diff: `  # google_container_node_pool.payments_primary will be updated in-place
  ~ resource "google_container_node_pool" "payments_primary" {
        id     = "projects/northwind-prod/locations/europe-west1/clusters/payments/nodePools/primary"
        name   = "primary"
      ~ node_config {
          ~ labels = {
              - "incident-2026-07-28" = "true" -> null
              ~ "workload"            = "payments-legacy" -> "payments"
            }
        }
    }

  # google_container_node_pool.payments_spot will be updated in-place
  ~ resource "google_container_node_pool" "payments_spot" {
        name = "spot"
      ~ node_config {
          ~ labels = {
              ~ "workload" = "payments-legacy" -> "payments"
            }
        }
    }

Plan: 0 to add, 2 to change, 0 to destroy.`,
      affectedPaths: ['env/prod/payments/node-pools.tf', 'env/prod/payments/labels.tf'],
      targetEnvironment: 'production',
    },
    requestedAt: hoursAgo(1.8),
    expiresAt: hoursFromNow(4),
    status: 'pending',
    policyRules: ['POL-004'],
  },
  {
    id: approvalRequestId('APR-2203'),
    actionType: 'open_pull_request',
    title: 'Open PR from feature/PAY-2381-refund-idempotency into main',
    agentId: AGENT_IDS.java,
    taskId: TASK_IDS.refundIdempotency,
    repositoryId: REPO_IDS.payments,
    reason:
      'The idempotency work is ready for review. payments-service is a gated repository, so opening the pull request needs a decision.',
    risk: 'medium',
    impact:
      'Creates PR 482 and notifies the reviewers. No code reaches main. Two open security findings (SEC-2211, SEC-2212) are referenced in the description and remain unresolved.',
    proposedChange: {
      summary: 'Open a pull request with 14 changed files, +486 / -92.',
      diff: `diff --git a/payments-api/src/main/java/com/northwind/payments/api/RefundController.java b/payments-api/src/main/java/com/northwind/payments/api/RefundController.java
@@ -71,14 +71,32 @@ public class RefundController {
   @PostMapping("/refunds")
-  public ResponseEntity<RefundResponse> submit(@RequestBody RefundRequest request) {
-    var refund = refundService.submit(request);
-    return ResponseEntity.status(CREATED).body(RefundResponse.from(refund));
+  public ResponseEntity<RefundResponse> submit(
+      @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
+      @RequestBody RefundRequest request) {
+    if (idempotencyKey == null || idempotencyKey.isBlank()) {
+      throw new MissingIdempotencyKeyException();
+    }
+    var outcome = refundService.submit(idempotencyKey, request);
+    return switch (outcome) {
+      case RefundOutcome.Created created ->
+          ResponseEntity.status(CREATED).body(RefundResponse.from(created.refund()));
+      case RefundOutcome.Replayed replayed ->
+          ResponseEntity.status(OK).body(RefundResponse.from(replayed.refund()));
+    };
   }`,
      affectedPaths: [
        'payments-api/src/main/java/com/northwind/payments/api/RefundController.java',
        'payments-domain/src/main/java/com/northwind/payments/refund/RefundService.java',
        'payments-domain/src/main/java/com/northwind/payments/refund/RefundIdempotencyKey.java',
        'payments-domain/src/main/java/com/northwind/payments/outbox/OutboxDispatcher.java',
        'payments-api/src/main/resources/db/migration/V47__refund_idempotency.sql',
      ],
      targetBranch: 'main',
    },
    requestedAt: minutesAgo(48),
    expiresAt: hoursFromNow(12),
    status: 'pending',
    policyRules: ['POL-008'],
  },
  {
    id: approvalRequestId('APR-2209'),
    actionType: 'modify_issue_tracker',
    title: 'Create 3 subtasks under PAY-2381',
    agentId: AGENT_IDS.jira,
    taskId: TASK_IDS.backlogSync,
    reason:
      'The agent task board tracks three units of work that have no Jira representation, which makes the sprint report incomplete.',
    risk: 'low',
    impact:
      'Creates three visible subtasks on the PAY board. An operator has already flagged that these duplicate PAY-2383, PAY-2384, and PAY-2385, so approving would add noise to the sprint.',
    proposedChange: {
      summary: 'Create Sub-task issues: idempotency index, outbox dispatcher, replay path tests.',
      command:
        'jira issue create --parent PAY-2381 --type Sub-task --summary "Add idempotency key index" (and 2 more)',
      affectedPaths: [],
    },
    requestedAt: hoursAgo(1.7),
    expiresAt: hoursFromNow(1),
    status: 'pending',
    policyRules: ['POL-010'],
  },
  {
    id: approvalRequestId('APR-2211'),
    actionType: 'trigger_pipeline',
    title: 'Trigger the shared-runner integration workflow for PR 97',
    agentId: AGENT_IDS.devops,
    taskId: TASK_IDS.runnerUpgrade,
    repositoryId: REPO_IDS.platform,
    reason:
      'Verifying the split test matrix needs one full run on the shared runner pool to compare wall-clock time against the baseline.',
    risk: 'medium',
    impact:
      'Consumes roughly 25 runner minutes from a pool that is currently at 92% utilisation with a queue depth of 14. Other teams queue behind this run.',
    proposedChange: {
      summary: 'One run of reusable-workflows-verify on ci/PLAT-1482-runner-pin.',
      command: 'gh workflow run reusable-workflows-verify.yml --ref ci/PLAT-1482-runner-pin',
      affectedPaths: [],
    },
    requestedAt: minutesAgo(26),
    expiresAt: hoursFromNow(3),
    status: 'pending',
    policyRules: ['POL-009'],
  },
  {
    id: approvalRequestId('APR-2188'),
    actionType: 'delete_files',
    title: 'Delete 10 files: legacy retry interceptor and its tests',
    agentId: AGENT_IDS.java,
    taskId: TASK_IDS.legacyRetryRemoval,
    repositoryId: REPO_IDS.payments,
    reason:
      'The Resilience4j policy replaces the hand-rolled interceptor. Leaving both in place means two retry paths with different backoff behaviour.',
    risk: 'high',
    impact: 'Removes 4 production classes and 6 test classes. No remaining references after the change.',
    proposedChange: {
      summary: 'Delete 10 files under payments-domain/retry and its test package.',
      command: 'git rm -r payments-domain/src/main/java/com/northwind/payments/retry (10 files)',
      affectedPaths: [
        'payments-domain/src/main/java/com/northwind/payments/retry/RetryInterceptor.java',
        'payments-domain/src/main/java/com/northwind/payments/retry/BackoffCalculator.java',
        'payments-domain/src/test/java/com/northwind/payments/retry/RetryInterceptorTest.java',
      ],
    },
    requestedAt: hoursAgo(30),
    status: 'approved',
    decision: {
      decidedBy: 'j.brouwer',
      decidedAt: hoursAgo(29.5),
      comment: 'Verified there are no remaining references. Go ahead.',
    },
    policyRules: ['POL-005'],
  },
  {
    id: approvalRequestId('APR-2194'),
    actionType: 'deploy_production',
    title: 'Deploy payments-service 2026.8.0 to production',
    agentId: AGENT_IDS.release,
    repositoryId: REPO_IDS.payments,
    reason: 'Release 2026.8.0 passed staging verification and the canary window is open.',
    risk: 'critical',
    impact: 'Rolls 2026.8.0 to all production pods behind a 10% canary for 20 minutes.',
    proposedChange: {
      summary: 'Promote artifact sha256:3f9a...c1d2 to the production environment.',
      command: 'deployctl promote payments-service --version 2026.8.0 --env prod --canary 10',
      affectedPaths: [],
      targetEnvironment: 'production',
    },
    requestedAt: hoursAgo(26),
    status: 'approved',
    decision: {
      decidedBy: 'm.dekker',
      decidedAt: hoursAgo(25.4),
      comment: 'Canary window confirmed with the on-call engineer.',
    },
    policyRules: ['POL-002'],
  },
  {
    id: approvalRequestId('APR-2198'),
    actionType: 'send_external_message',
    title: 'Post a release summary to the #payments-stakeholders channel',
    agentId: AGENT_IDS.jira,
    reason: 'Stakeholders asked for a written summary after each release.',
    risk: 'high',
    impact:
      'Message reaches 84 people outside the engineering team, including two customer-facing roles. The draft names a customer by account id.',
    proposedChange: {
      summary: 'Post a 6-paragraph summary of release 2026.8.0 to a stakeholder channel.',
      command: 'chat.postMessage --channel "#payments-stakeholders"',
      affectedPaths: [],
    },
    requestedAt: hoursAgo(24),
    status: 'rejected',
    decision: {
      decidedBy: 'l.vermeer',
      decidedAt: hoursAgo(23.6),
      comment:
        'Rejected: the draft includes a customer account id. Release comms go out from the product team, not from an agent.',
    },
    policyRules: ['POL-006'],
  },
  {
    id: approvalRequestId('APR-2199'),
    actionType: 'modify_production_config',
    title: 'Raise the refund API rate limit for merchant 8841',
    agentId: AGENT_IDS.devops,
    repositoryId: REPO_IDS.infra,
    reason: 'Merchant 8841 hit the refund rate limit 41 times in the last hour during a batch reconciliation.',
    risk: 'critical',
    impact:
      'Changes a production limit for a single tenant. The change is global in effect because the burst pool is shared.',
    proposedChange: {
      summary: 'Raise per-merchant refund rate limit from 20/s to 60/s for merchant 8841.',
      diff: `  ~ resource "northwind_rate_limit" "refunds_merchant_8841" {
      ~ requests_per_second = 20 -> 60
        burst_pool          = "shared-refunds"
    }`,
      affectedPaths: ['env/prod/payments/rate-limits.tf'],
      targetEnvironment: 'production',
    },
    requestedAt: hoursAgo(20),
    status: 'changes_requested',
    decision: {
      decidedBy: 'j.brouwer',
      decidedAt: hoursAgo(19.7),
      comment:
        'Not against a shared burst pool. Come back with a dedicated pool for this merchant, or a time-boxed limit that expires after the reconciliation window.',
    },
    policyRules: ['POL-002'],
  },
];
