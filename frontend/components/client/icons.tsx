/**
 * Client gallery ke saare icons ek jagah — stroke width, cap aur size
 * ek jaisa rakhne ke liye. Alag-alag components me SVG copy-paste karne
 * se hi UI "assembled" lagne lagta hai.
 */

type IconProps = { size?: number; className?: string; strokeWidth?: number };

const base = (size: number, strokeWidth: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className,
  'aria-hidden': true,
});

export const DownloadIcon = ({ size = 16, className, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const FolderIcon = ({ size = 16, className, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

export const ArchiveIcon = ({ size = 16, className, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
    <path d="M10 12h4" />
  </svg>
);

export const HeartIcon = ({
  size = 16,
  className,
  strokeWidth = 1.8,
  filled = false,
}: IconProps & { filled?: boolean }) => (
  <svg {...base(size, strokeWidth, className)} fill={filled ? 'currentColor' : 'none'}>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

export const CheckIcon = ({ size = 16, className, strokeWidth = 2.4 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const CloseIcon = ({ size = 16, className, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const LockIcon = ({ size = 16, className, strokeWidth = 1.5 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const EyeIcon = ({ size = 16, className, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon = ({ size = 16, className, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M17.9 17.9A10.9 10.9 0 0 1 12 19c-7 0-11-7-11-7a19.4 19.4 0 0 1 5.1-5.9M9.9 4.2A10.9 10.9 0 0 1 12 4c7 0 11 7 11 7a19.5 19.5 0 0 1-2.2 3.2" />
    <path d="M9.9 9.9a3 3 0 1 0 4.2 4.2" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export const ChevronDownIcon = ({ size = 16, className, strokeWidth = 2 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const CameraIcon = ({ size = 16, className, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export const SelectIcon = ({ size = 16, className, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <polyline points="8.5 12 11 14.5 15.5 9.5" />
  </svg>
);

export const SparkIcon = ({ size = 16, className, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
