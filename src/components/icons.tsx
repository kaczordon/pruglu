import type { Child } from 'hono/jsx'

const Svg = ({ size = 22, class: cls, children }: { size?: number; class?: string; children: Child }) => (
  <svg
    class={cls}
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

export const ChevronLeftIcon = ({ class: cls }: { class?: string } = {}) => (
  <Svg size={20} class={cls}>
    <path d="M15 18l-6-6 6-6" />
  </Svg>
)

export const ChevronRightIcon = () => (
  <Svg size={20}>
    <path d="M9 18l6-6-6-6" />
  </Svg>
)

type IconProps = { size?: number; class?: string }

export const ChevronDownIcon = ({ size = 18, class: cls }: IconProps) => (
  <Svg size={size} class={cls}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
)

export const ListOrderedIcon = ({ size = 16 }: IconProps) => (
  <Svg size={size}>
    <path d="M10 6h11M10 12h11M10 18h11" />
    <path d="M4 6h1v4M4 10h2" />
    <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
  </Svg>
)

export const ListBulletIcon = ({ size = 16 }: IconProps) => (
  <Svg size={size}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="4" cy="6" r="1" />
    <circle cx="4" cy="12" r="1" />
    <circle cx="4" cy="18" r="1" />
  </Svg>
)

export const AlignIcon = ({ size = 16 }: IconProps) => (
  <Svg size={size}>
    <path d="M3 6h18M3 12h12M3 18h16" />
  </Svg>
)

export const LinkIcon = ({ size = 16 }: IconProps) => (
  <Svg size={size}>
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
  </Svg>
)

export const ImageIcon = ({ size = 16 }: IconProps) => (
  <Svg size={size}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-5-5L5 21" />
  </Svg>
)

export const ClearFormatIcon = ({ size = 16 }: IconProps) => (
  <Svg size={size}>
    <path d="M4 7V4h12v3" />
    <path d="M10 4 7 20" />
    <path d="m15 14 6 6M21 14l-6 6" />
  </Svg>
)

export const UndoIcon = ({ size = 16 }: IconProps) => (
  <Svg size={size}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </Svg>
)

export const RedoIcon = ({ size = 16 }: IconProps) => (
  <Svg size={size}>
    <path d="m15 14 5-5-5-5" />
    <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
  </Svg>
)

export const SearchIcon = ({ size = 14 }: IconProps) => (
  <Svg size={size}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
)

export const PaperclipIcon = ({ size = 14 }: IconProps) => (
  <Svg size={size}>
    <path d="m21 12-8.5 8.5a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8" />
  </Svg>
)

export const MoreIcon = ({ size = 20 }: IconProps) => (
  <Svg size={size}>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </Svg>
)

export const InfoIcon = ({ size = 20, class: cls }: IconProps) => (
  <Svg size={size} class={cls}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 11v5M12 7.5v.01" />
  </Svg>
)
