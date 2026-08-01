import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'default' | 'primary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default:
    'border-surface-300 bg-white text-slate-700 hover:bg-surface-50 disabled:hover:bg-white dark:border-surface-700 dark:bg-surface-800 dark:text-slate-200 dark:hover:bg-surface-750 dark:disabled:hover:bg-surface-800',
  primary:
    'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600 dark:border-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500',
  danger:
    'border-red-600 bg-red-600 text-white hover:bg-red-700 disabled:hover:bg-red-600 dark:border-red-700 dark:bg-red-700 dark:hover:bg-red-600',
  ghost:
    'border-transparent bg-transparent text-slate-600 hover:bg-surface-100 dark:text-slate-400 dark:hover:bg-surface-800',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-6 gap-1 px-2 text-2xs',
  md: 'h-7 gap-1.5 px-2.5 text-xs',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly icon?: ReactNode;
}

export function Button({
  variant = 'default',
  size = 'sm',
  icon,
  children,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded border font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-45',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly label?: string;
}

export function Select({ label, className, children, id, ...props }: SelectProps) {
  return (
    <label className="inline-flex items-center gap-1.5">
      {label && (
        <span className="text-2xs uppercase tracking-wider text-slate-500 dark:text-slate-500">
          {label}
        </span>
      )}
      <select
        id={id}
        className={cn(
          'h-6 rounded border border-surface-300 bg-white px-1.5 text-2xs text-slate-700',
          'dark:border-surface-700 dark:bg-surface-800 dark:text-slate-200',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  className,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly className?: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={cn(
        'h-6 w-48 rounded border border-surface-300 bg-white px-2 text-2xs text-slate-700 placeholder:text-slate-400',
        'dark:border-surface-700 dark:bg-surface-800 dark:text-slate-200 dark:placeholder:text-slate-500',
        className,
      )}
    />
  );
}

/** Segmented control for mutually exclusive view modes. */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  readonly value: T;
  readonly options: readonly { readonly value: T; readonly label: string }[];
  readonly onChange: (value: T) => void;
  readonly className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex rounded border border-surface-300 p-0.5 dark:border-surface-700',
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          role="tab"
          type="button"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded px-2 py-0.5 text-2xs font-medium transition-colors',
            value === option.value
              ? 'bg-surface-200 text-slate-800 dark:bg-surface-700 dark:text-slate-100'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({
  value,
  tone = 'bg-blue-500',
  className,
  showLabel = false,
}: {
  readonly value: number;
  readonly tone?: string;
  readonly className?: string;
  readonly showLabel?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${clamped}%` }} />
      </div>
      {showLabel && (
        <span className="tabular w-8 shrink-0 text-right text-2xs text-slate-500 dark:text-slate-400">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
