import { raw } from 'hono/html'
import type { JSX } from 'hono/jsx/jsx-runtime'
import {
  ChevronDownIcon,
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

type NavLink = { label: string; href: string }
type NavItem = NavLink & { icon: () => JSX.Element; children?: NavLink[] }

const NAV: NavItem[] = [
  { label: 'Basecamp', href: '/', icon: HomeIcon },
  {
    label: 'Distribution',
    href: '/distribution/compose',
    icon: () => <SendIcon />,
    children: [
      { label: 'Compose', href: '/distribution/compose' },
      { label: 'Sent', href: '/distribution/sent' },
      { label: 'Drafts', href: '#' },
      { label: 'Outbox', href: '#' },
      { label: 'Lists', href: '/distribution/lists' },
    ],
  },
  {
    label: 'Contacts',
    href: '/contacts',
    icon: ContactIcon,
    children: [
      { label: 'All', href: '/contacts' },
      ...['Crew', 'Cast', 'Agent', 'Studio', 'Union', 'Vendor'].map((label) => ({ label, href: '#' })),
      // Its own URL (redirecting to the Lists page) so only Distribution shows as active there
      { label: 'Distribution Lists', href: '/contacts/lists' },
    ],
  },
  { label: 'Reports', href: '#', icon: ReportIcon },
  { label: 'Documents', href: '#', icon: FileIcon },
  { label: 'Templates', href: '#', icon: TemplateIcon },
  { label: 'Security', href: '#', icon: ShieldIcon },
]

// Colour bands down the right edge of the rail, top to bottom
const STRIPE = ['#2b2b2b', '#2f3cf5', '#e0604a', '#d98be6', '#43a047', '#8fe6ee', '#eed54f']

// Open/closed lives in the #nav-open checkbox, so toggling is pure CSS: no request,
// no re-render, and every class already exists at load (nothing for UnoCSS to generate)
const SIDEBAR_CSS = `
.nav-panel { width: 68px }
#nav-open:checked ~ .nav-panel { width: 16rem; box-shadow: 0 20px 25px -5px rgb(0 0 0 / .1), 0 8px 10px -6px rgb(0 0 0 / .1) }
.nav-backdrop, .nav-sub, .nav-close { display: none }
#nav-open:checked ~ .nav-backdrop, #nav-open:checked ~ .nav-panel .nav-sub, #nav-open:checked ~ .nav-panel .nav-close { display: block }
#nav-open:checked ~ .nav-panel .nav-logo { display: none }
#nav-open:focus-visible ~ .nav-panel .nav-toggle { outline: 2px solid #3fae4a; outline-offset: 2px }
.nav-label { opacity: 0; transition: opacity 150ms }
#nav-open:checked ~ .nav-panel .nav-label { opacity: 1 }
/* Sections with sub-pages: collapsed, the row opens the sidebar; open, it folds its sub-list */
.nav-panel .nav-open-only { display: none }
#nav-open:checked ~ .nav-panel .nav-open-only { display: flex }
#nav-open:checked ~ .nav-panel .nav-closed-only { display: none }
#nav-open:checked ~ .nav-panel .sub-toggle:not(:checked) ~ .nav-sub { display: none }
.sub-toggle:not(:checked) ~ label .nav-chev { transform: rotate(-90deg) }
.sub-toggle:focus-visible ~ .nav-open-only { outline: 2px solid #3fae4a; outline-offset: -2px }
`

const ROW = 'flex items-center gap-4 h-11 px-3 shrink-0 rounded-full whitespace-nowrap'
const rowState = (active: boolean) => (active ? 'bg-[#f6e3d2] font-bold' : 'hover:bg-black/5')

const RowContent = ({ item }: { item: NavItem }) => (
  <>
    <span class="shrink-0">
      <item.icon />
    </span>
    <span class="nav-label">{item.label}</span>
  </>
)

export const Sidebar = ({ path }: { path: string }) => (
  <div id="sidebar">
    <style>{raw(SIDEBAR_CSS)}</style>
    <input type="checkbox" id="nav-open" class="sr-only" aria-label="Menu" autocomplete="off" />
    <label for="nav-open" class="nav-backdrop fixed inset-0 z-10 bg-black/20" aria-hidden="true" />
    <aside class="nav-panel fixed inset-y-0 left-0 z-20 flex bg-[#fdf6f0] transition-[width,box-shadow] duration-200">
      <nav class="flex-1 flex flex-col gap-1 px-2 py-4 overflow-y-auto overflow-x-hidden">
        <label
          for="nav-open"
          title="Menu"
          class="nav-toggle ml-0.5 mb-3 w-11 h-11 shrink-0 rounded-full bg-[#2b2b2b] text-white grid place-items-center cursor-pointer hover:bg-black"
        >
          <span class="nav-logo">
            <LogoIcon />
          </span>
          <span class="nav-close">
            <CloseIcon />
          </span>
        </label>

        {NAV.map((item) => {
          const isActive = item.href === path || !!item.children?.some((child) => child.href === path)
          if (!item.children) {
            // Collapsed, the nav clips each row to its icon and .nav-label fades the text out
            return (
              <a href={item.href} title={item.label} class={`${ROW} ${rowState(isActive)}`}>
                <RowContent item={item} />
              </a>
            )
          }
          const subId = `nav-sub-${item.label.toLowerCase()}`
          return (
            <div class="flex flex-col gap-1">
              <input type="checkbox" id={subId} class="sub-toggle sr-only" checked autocomplete="off" aria-label={`Show ${item.label} pages`} />
              <label for="nav-open" title={item.label} class={`nav-closed-only cursor-pointer ${ROW} ${rowState(isActive)}`}>
                <RowContent item={item} />
              </label>
              <label for={subId} class={`nav-open-only cursor-pointer ${ROW} ${rowState(isActive)}`}>
                <RowContent item={item} />
                <ChevronDownIcon class="nav-chev ml-auto transition-transform" />
              </label>
              <ul class="nav-sub mb-1">
                {item.children.map((child) => (
                  <li>
                    <a
                      href={child.href}
                      class={`block pl-[4.5rem] py-2 rounded-full whitespace-nowrap hover:bg-black/5 ${
                        child.href === path ? 'font-bold' : ''
                      }`}
                    >
                      {child.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
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
