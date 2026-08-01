import { rulesForCapability } from '@/lib/policy';
import type { AgentCapability, AgentCapabilityKind, AgentTool } from '@/types';

const CAPABILITY_LABELS: Readonly<Record<AgentCapabilityKind, string>> = {
  read_repository: 'Read repository',
  write_code: 'Write code',
  run_tests: 'Run tests',
  run_build: 'Run build',
  create_branch: 'Create branch',
  create_commit: 'Create commit',
  open_pull_request: 'Open pull request',
  review_pull_request: 'Review pull request',
  merge_to_main: 'Merge to protected branch',
  trigger_pipeline: 'Trigger pipeline',
  deploy_staging: 'Deploy to staging',
  deploy_production: 'Deploy to production',
  modify_infrastructure: 'Modify infrastructure',
  read_secrets: 'Read secrets',
  delete_files: 'Delete files',
  modify_issue_tracker: 'Modify issue tracker',
  send_external_message: 'Send external message',
  financial_action: 'Financial action',
};

/**
 * Builds a capability grant. Whether the grant is autonomous is never decided
 * by the caller: if any policy rule covers the capability, the gate wins.
 */
export function capability(kind: AgentCapabilityKind): AgentCapability {
  const rules = rulesForCapability(kind);
  if (rules.length === 0) {
    return { kind, label: CAPABILITY_LABELS[kind], autonomous: true };
  }
  return {
    kind,
    label: CAPABILITY_LABELS[kind],
    autonomous: false,
    gatedBy: rules.map((rule) => rule.id).join(', '),
  };
}

export const TOOL_CATALOG = {
  gitRead: {
    name: 'git.read',
    description: 'Clone, fetch, diff, and inspect history on an allow-listed repository.',
    category: 'vcs',
  },
  gitWrite: {
    name: 'git.write',
    description: 'Stage, commit, and push to a non-protected branch.',
    category: 'vcs',
  },
  githubPr: {
    name: 'github.pull_request',
    description: 'Open, update, and comment on pull requests. Merging is gated by POL-001.',
    category: 'vcs',
  },
  githubReview: {
    name: 'github.review',
    description: 'Submit pull request reviews and line comments.',
    category: 'vcs',
  },
  fsRead: {
    name: 'fs.read',
    description: 'Read files inside the assigned workspace.',
    category: 'filesystem',
  },
  fsWrite: {
    name: 'fs.write',
    description: 'Create and modify files inside the assigned workspace.',
    category: 'filesystem',
  },
  shell: {
    name: 'shell.exec',
    description: 'Run allow-listed commands in the sandboxed workspace container.',
    category: 'shell',
  },
  maven: {
    name: 'build.maven',
    description: 'Run Maven goals: compile, test, verify, dependency analysis.',
    category: 'shell',
  },
  npm: {
    name: 'build.npm',
    description: 'Run npm scripts: install, lint, test, build.',
    category: 'shell',
  },
  playwright: {
    name: 'test.playwright',
    description: 'Drive the headless browser suite and collect traces.',
    category: 'shell',
  },
  actions: {
    name: 'ci.actions',
    description: 'Read workflow runs and job logs. Triggering runs is gated by POL-009.',
    category: 'ci',
  },
  terraform: {
    name: 'infra.terraform',
    description: 'Run fmt, validate, and plan. Apply and destroy are gated by POL-004.',
    category: 'ci',
  },
  kubectl: {
    name: 'infra.kubectl',
    description: 'Read-only cluster inspection against non-production contexts.',
    category: 'ci',
  },
  jira: {
    name: 'tracker.jira',
    description: 'Read issues and boards. Writes are gated by POL-010.',
    category: 'tracker',
  },
  codeSearch: {
    name: 'search.code',
    description: 'Structural and regex search across allow-listed repositories.',
    category: 'search',
  },
  webSearch: {
    name: 'search.web',
    description: 'Fetch public documentation and specifications.',
    category: 'search',
  },
  sast: {
    name: 'analysis.sast',
    description: 'Static analysis and dependency vulnerability scanning.',
    category: 'analysis',
  },
  coverage: {
    name: 'analysis.coverage',
    description: 'Parse coverage reports and diff coverage against the base branch.',
    category: 'analysis',
  },
  openapi: {
    name: 'analysis.openapi',
    description: 'Validate and diff OpenAPI specifications.',
    category: 'analysis',
  },
} as const satisfies Record<string, AgentTool>;
