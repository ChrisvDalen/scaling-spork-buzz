import { cn } from '@/lib/cn';

/** Monospace block for command previews and log output. */
export function CodeBlock({
  children,
  className,
  maxHeight = '16rem',
}: {
  readonly children: string;
  readonly className?: string;
  readonly maxHeight?: string;
}) {
  return (
    <pre
      className={cn(
        'scrollbar-thin overflow-auto rounded border border-surface-200 bg-surface-50 p-2 font-mono text-2xs leading-relaxed text-slate-700',
        'dark:border-surface-700 dark:bg-surface-900 dark:text-slate-300',
        className,
      )}
      style={{ maxHeight }}
    >
      {children}
    </pre>
  );
}

/**
 * Unified-diff renderer.
 *
 * Line prefixes drive the colouring, and each changed line also carries its
 * `+`/`-` marker, so the diff is still unambiguous without colour.
 */
export function DiffView({
  diff,
  className,
  maxHeight = '20rem',
}: {
  readonly diff: string;
  readonly className?: string;
  readonly maxHeight?: string;
}) {
  const lines = diff.split('\n');
  return (
    <div
      className={cn(
        'scrollbar-thin overflow-auto rounded border border-surface-200 bg-surface-50 font-mono text-2xs leading-relaxed',
        'dark:border-surface-700 dark:bg-surface-900',
        className,
      )}
      style={{ maxHeight }}
    >
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line, index) => {
            const kind = classifyDiffLine(line);
            return (
              <tr key={index} className={DIFF_ROW_CLASSES[kind]}>
                <td className="w-10 select-none border-r border-surface-200 px-1.5 py-px text-right text-slate-400 dark:border-surface-700 dark:text-slate-600">
                  {index + 1}
                </td>
                <td className="whitespace-pre px-2 py-px">{line || ' '}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type DiffLineKind = 'added' | 'removed' | 'changed' | 'meta' | 'hunk' | 'context';

const DIFF_ROW_CLASSES: Record<DiffLineKind, string> = {
  added: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
  removed: 'bg-red-500/10 text-red-800 dark:text-red-300',
  changed: 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
  meta: 'text-slate-500 dark:text-slate-500',
  hunk: 'bg-blue-500/10 text-blue-800 dark:text-blue-300',
  context: 'text-slate-700 dark:text-slate-300',
};

function classifyDiffLine(line: string): DiffLineKind {
  if (line.startsWith('diff ') || line.startsWith('index ') || line.startsWith('--- ') || line.startsWith('+++ ')) {
    return 'meta';
  }
  if (line.startsWith('@@')) return 'hunk';
  if (line.startsWith('+')) return 'added';
  if (line.startsWith('-')) return 'removed';
  // Terraform-style plans mark in-place updates with a leading tilde.
  if (line.trimStart().startsWith('~')) return 'changed';
  return 'context';
}
