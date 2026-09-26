import type { Child } from 'hono/jsx'

const Svg = ({ size = 22, children }: { size?: number; children: Child }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
)

export const LogoIcon = () => (
  <Svg>
    <circle cx="8" cy="8" r="3" />
    <circle cx="16" cy="8" r="3" />
    <circle cx="8" cy="16" r="3" />
    <circle cx="16" cy="16" r="3" />
  </Svg>
)

export const CloseIcon = () => (
  <Svg>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
)

export const HomeIcon = () => (
  <Svg>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </Svg>
)

export const SendIcon = ({ size }: { size?: number }) => (
  <Svg size={size}>
    <path d="M3 3l18 9-18 9 4-9-4-9z" />
    <path d="M7 12h14" />
  </Svg>
)

export const ContactIcon = () => (
  <Svg>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <circle cx="12" cy="10" r="3" />
    <path d="M8 17c1-2 2.5-3 4-3s3 1 4 3" />
  </Svg>
)

export const ReportIcon = () => (
  <Svg>
    <path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </Svg>
)

export const FileIcon = () => (
  <Svg>
    <path d="M14 3H6v18h12V7z" />
    <path d="M14 3v4h4" />
    <path d="M9 13h6M9 17h6" />
  </Svg>
)

export const TemplateIcon = () => (
  <Svg>
    <rect x="3" y="3" width="18" height="7" rx="1" />
    <rect x="3" y="14" width="8" height="7" rx="1" />
    <rect x="15" y="14" width="6" height="7" rx="1" />
  </Svg>
)

export const ShieldIcon = () => (
  <Svg>
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
    <rect x="9" y="11" width="6" height="5" rx="1" />
    <path d="M10 11V9.5a2 2 0 0 1 4 0V11" />
  </Svg>
)

export const UploadIcon = () => (
  <Svg size={16}>
    <path d="M12 16V4M7 9l5-5 5 5" />
    <path d="M5 20h14" />
  </Svg>
)

export const UserPlusIcon = () => (
  <Svg size={16}>
    <circle cx="9" cy="8" r="4" />
    <path d="M2 21c0-4 3-6 7-6s7 2 7 6" />
    <path d="M19 8v6M16 11h6" />
  </Svg>
)

export const BellIcon = () => (
  <Svg size={16}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </Svg>
)

export const PlusIcon = () => (
  <Svg size={18}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

export const ChevronLeftIcon = () => (
  <Svg size={20}>
    <path d="M15 18l-6-6 6-6" />
  </Svg>
)

export const ChevronRightIcon = () => (
  <Svg size={20}>
    <path d="M9 18l6-6-6-6" />
  </Svg>
)
