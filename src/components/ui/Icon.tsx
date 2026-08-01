import type { SVGProps } from 'react';

/**
 * Inline icon set.
 *
 * Icons are structural affordances here, never status carriers: status is
 * always communicated by a label plus a colour token, so the interface stays
 * readable in monochrome and to a screen reader.
 */

type IconProps = SVGProps<SVGSVGElement> & { readonly size?: number };

function base({ size = 14, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  };
}

export const IconGauge = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M2.5 12a5.5 5.5 0 1 1 11 0" />
    <path d="M8 12 10.5 7" />
  </svg>
);

export const IconAgents = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="2" y="4" width="12" height="8" rx="1.5" />
    <path d="M5.5 7.5h.01M10.5 7.5h.01M6 10h4" />
    <path d="M8 2v2" />
  </svg>
);

export const IconTasks = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h7" />
  </svg>
);

export const IconApprovals = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M8 1.8 13.5 4v4.2c0 3-2.3 5-5.5 6-3.2-1-5.5-3-5.5-6V4z" />
    <path d="m5.8 7.8 1.6 1.6 3-3.2" />
  </svg>
);

export const IconActivity = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M1.5 8h3l2-4.5L9.5 12l2-4h3" />
  </svg>
);

export const IconRepository = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M3.5 2.5h9v11h-9a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" />
    <path d="M3.5 11h9" />
  </svg>
);

export const IconHealth = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M1.5 8h3l1.5-3 2 6 1.5-3h5" />
  </svg>
);

export const IconSettings = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="8" cy="8" r="2.2" />
    <path d="M8 1.5v1.6M8 12.9v1.6M14.5 8h-1.6M3.1 8H1.5M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1M12.6 12.6l-1.1-1.1M4.5 4.5 3.4 3.4" />
  </svg>
);

export const IconChevronRight = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m6 3.5 5 4.5-5 4.5" />
  </svg>
);

export const IconChevronDown = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m3.5 6 4.5 5 4.5-5" />
  </svg>
);

export const IconClose = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </svg>
);

export const IconExternal = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M9.5 2.5h4v4" />
    <path d="M13.5 2.5 7 9" />
    <path d="M12 9.5v3.5a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V4.5A.5.5 0 0 1 3 4h3.5" />
  </svg>
);

export const IconPause = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M6 3.5v9M10 3.5v9" />
  </svg>
);

export const IconPlay = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M5 3.2 12 8l-7 4.8z" />
  </svg>
);

export const IconStop = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="4" y="4" width="8" height="8" rx="1" />
  </svg>
);

export const IconRetry = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M13.5 8a5.5 5.5 0 1 1-1.9-4.1" />
    <path d="M13.5 2v3.2h-3.2" />
  </svg>
);

export const IconReassign = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M2.5 5.5h9L9 3" />
    <path d="M13.5 10.5h-9L7 13" />
  </svg>
);

export const IconCheck = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m3 8.5 3.2 3.2L13 4.8" />
  </svg>
);

export const IconReject = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="8" cy="8" r="5.8" />
    <path d="m5.5 5.5 5 5" />
  </svg>
);

export const IconEdit = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M11 2.5 13.5 5 6 12.5 2.5 13.5 3.5 10z" />
  </svg>
);

export const IconLogs = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="2" y="2.5" width="12" height="11" rx="1" />
    <path d="M4.5 6h3M4.5 8.5h7M4.5 11h5" />
  </svg>
);

export const IconSearch = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="7" cy="7" r="4.3" />
    <path d="m10.3 10.3 3.2 3.2" />
  </svg>
);

export const IconSun = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="8" cy="8" r="3" />
    <path d="M8 1.5v1.3M8 13.2v1.3M14.5 8h-1.3M2.8 8H1.5M12.6 3.4l-.9.9M4.3 11.7l-.9.9M12.6 12.6l-.9-.9M4.3 4.3l-.9-.9" />
  </svg>
);

export const IconMoon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M13 9.6A5.6 5.6 0 0 1 6.4 3 5.6 5.6 0 1 0 13 9.6Z" />
  </svg>
);

export const IconAlert = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M8 2.2 14.5 13.2h-13z" />
    <path d="M8 6.5v3M8 11.4h.01" />
  </svg>
);

export const IconFilter = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M2 3.5h12L9.4 8.6v4.1l-2.8 1.3V8.6z" />
  </svg>
);
