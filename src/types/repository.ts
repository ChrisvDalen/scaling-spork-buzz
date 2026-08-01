import type {
  AgentId,
  IsoTimestamp,
  PipelineRunId,
  PullRequestId,
  RepositoryId,
} from './common';

export type RepositoryKind =
  | 'java_service'
  | 'frontend'
  | 'platform'
  | 'infrastructure'
  | 'agent_config';

export type PullRequestState = 'draft' | 'open' | 'approved' | 'changes_requested' | 'merged' | 'closed';

export type PipelineStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export type TestStatus = 'passing' | 'failing' | 'flaky' | 'not_run';

export interface PullRequest {
  readonly id: PullRequestId;
  readonly number: number;
  readonly title: string;
  readonly repositoryId: RepositoryId;
  readonly authorAgentId?: AgentId;
  readonly authorName: string;
  readonly sourceBranch: string;
  readonly targetBranch: string;
  readonly state: PullRequestState;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  readonly filesChanged: number;
  readonly additions: number;
  readonly deletions: number;
  readonly reviewers: readonly string[];
  readonly checksStatus: PipelineStatus;
  readonly url: string;
}

/** A step within a pipeline run. */
export interface PipelineStage {
  readonly name: string;
  readonly status: PipelineStatus;
  readonly durationMs?: number;
}

export interface PipelineRun {
  readonly id: PipelineRunId;
  readonly repositoryId: RepositoryId;
  readonly workflow: string;
  readonly runNumber: number;
  readonly branch: string;
  readonly commitSha: string;
  readonly status: PipelineStatus;
  readonly triggeredBy: string;
  readonly triggeredByAgentId?: AgentId;
  readonly startedAt: IsoTimestamp;
  readonly finishedAt?: IsoTimestamp;
  readonly durationMs?: number;
  readonly stages: readonly PipelineStage[];
  readonly url: string;
  readonly failureSummary?: string;
}

export interface Commit {
  readonly sha: string;
  readonly message: string;
  readonly author: string;
  readonly authorAgentId?: AgentId;
  readonly committedAt: IsoTimestamp;
  readonly filesChanged: number;
}

export interface BranchSummary {
  readonly name: string;
  readonly ownerAgentId?: AgentId;
  readonly ahead: number;
  readonly behind: number;
  readonly lastCommitAt: IsoTimestamp;
  readonly hasOpenPullRequest: boolean;
}

export interface TestSummary {
  readonly status: TestStatus;
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly skipped: number;
  readonly coveragePercent?: number;
  readonly lastRunAt: IsoTimestamp;
}

export interface Repository {
  readonly id: RepositoryId;
  readonly name: string;
  readonly kind: RepositoryKind;
  readonly description: string;
  readonly defaultBranch: string;
  readonly url: string;
  readonly language: string;
  readonly activeAgentIds: readonly AgentId[];
  readonly branches: readonly BranchSummary[];
  readonly openPullRequestIds: readonly PullRequestId[];
  readonly lastPipelineRunId?: PipelineRunId;
  readonly tests: TestSummary;
  readonly changedFileCount: number;
  readonly recentCommits: readonly Commit[];
  /** Free-text blockers scoped to the repository (protected branch, red main, ...). */
  readonly blockers: readonly string[];
  readonly protectedBranches: readonly string[];
}
