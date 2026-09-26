import type { JSX } from 'hono/jsx/jsx-runtime'
import {
  CloseIcon,
  ContactIcon,
  FileIcon,
  HomeIcon,
  LogoIcon,
  ReportIcon,
  SendIcon,
  ShieldIcon,
  TemplateIcon,
} from './icons.tsx'

type NavItem = { label: string; href: string; icon: () => JSX.Element; children?: string[] }

const NAV: NavItem[] = [
  { label: 'Basecamp', href: '/', icon: HomeIcon },
  {
    label: 'Distribution',
    href: '#',
    icon: () => <SendIcon />,
    children: ['Compose', 'Sent', 'Drafts', 'Outbox', 'Lists'],
  },
  { label: 'Contacts', href: '#', icon: ContactIcon },
  { label: 'Reports', href: '#', icon: ReportIcon },
  { label: 'Documents', href: '#', icon: FileIcon },
  { label: 'Templates', href: '#', icon: TemplateIcon },
  { label: 'Security', href: '#', icon: ShieldIcon },
]

// Colour bands down the right edge of the rail, top to bottom
const STRIPE = ['#2b2b2b', '#2f3cf5', '#e0604a', '#d98be6', '#43a047', '#8fe6ee', '#eed54f']

// Every toggle asks the server for the other state and swaps the whole #sidebar
const toggle = (open: boolean) => ({
  'hx-get': `/partials/sidebar?open=${open}`,
  'hx-target': '#sidebar',
  'hx-swap': 'outerHTML',
})

export const Sidebar = ({ open, active = 'Basecamp' }: { open: boolean; active?: string }) => (
  <div id="sidebar">
    {open && (
      <div
        class="fixed inset-0 z-10 bg-black/20"
        {...toggle(false)}
        hx-trigger="click, keyup[key=='Escape'] from:body"
      />
    )}
    <aside
      id="sidebar-panel"
      class={`fixed inset-y-0 left-0 z-20 flex bg-[#fdf6f0] transition-[width] duration-200 ${
        open ? 'w-64 shadow-xl' : 'w-[68px]'
      }`}
    >
      <nav class="flex-1 flex flex-col gap-1 px-2 py-4 overflow-y-auto overflow-x-hidden">
        <button
          class="ml-0.5 mb-3 w-11 h-11 shrink-0 rounded-full bg-[#2b2b2b] text-white grid place-items-center hover:bg-black"
          aria-label={open ? 'Collapse menu' : 'Expand menu'}
          aria-expanded={open ? 'true' : 'false'}
          {...toggle(!open)}
        >
          {open ? <CloseIcon /> : <LogoIcon />}
        </button>

        {NAV.map((item) => {
          const isActive = item.label === active
          return (
            <>
              <a
                href={item.href}
                title={open ? undefined : item.label}
                class={`flex items-center gap-4 h-11 shrink-0 rounded-full whitespace-nowrap ${
                  open ? 'px-3' : 'ml-0.5 w-11 justify-center'
                } ${isActive ? 'bg-[#f6e3d2] font-bold' : 'hover:bg-black/5'}`}
              >
                <item.icon />
                {open && <span>{item.label}</span>}
              </a>
              {open && item.children && (
                <ul class="mb-1">
                  {item.children.map((child) => (
                    <li>
                      <a
                        href="#"
                        class="block pl-[4.5rem] py-2 rounded-full whitespace-nowrap hover:bg-black/5"
                      >
                        {child}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )
        })}
      </nav>
      <div class="w-1.5 flex flex-col">
        {STRIPE.map((color) => (
          <div class="flex-1" style={`background:${color}`} />
        ))}
      </div>
    </aside>
  </div>
)
