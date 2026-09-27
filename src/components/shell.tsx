import type { Child } from 'hono/jsx'
import { BellIcon, UploadIcon, UserPlusIcon } from './icons.tsx'
import { Sidebar } from './sidebar.tsx'

export const GREEN = '#3fae4a'

const Header = () => (
  <header class="flex items-center justify-between gap-2 px-3 pt-4 sm:px-6">
    <a href="/" class="shrink-0 text-2xl font-black leading-[0.8] tracking-tight sm:text-3xl">
      pru
      <br />
      glu
    </a>
    <div class="flex items-center gap-1.5 sm:gap-3">
      <button
        aria-label="Upload"
        class="flex items-center gap-2 rounded-full px-2.5 py-1.5 sm:px-4 text-xs font-semibold text-white shadow hover:brightness-110"
        style={`background:${GREEN}`}
      >
        <UploadIcon /> <span class="hidden sm:inline">Upload</span>
      </button>
      <button aria-label="Invite" class="w-8 h-8 rounded-full bg-gray-100 grid place-items-center hover:bg-gray-200">
        <UserPlusIcon />
      </button>
      <button aria-label="Notifications" class="w-8 h-8 rounded-full bg-gray-100 grid place-items-center hover:bg-gray-200">
        <BellIcon />
      </button>
      <button aria-label="Help" class="w-8 h-8 rounded-full bg-gray-100 grid place-items-center font-bold text-sm hover:bg-gray-200">
        ?
      </button>
      <div class="w-8 h-8 rounded-full bg-gray-100 grid place-items-center text-xs font-semibold">JK</div>
    </div>
  </header>
)

// Sidebar + header frame shared by every full page; `path` marks the active nav item
export const Shell = ({ path, children }: { path: string; children: Child }) => (
  <>
    <Sidebar path={path} />
    <div class="pl-[68px] min-h-screen flex flex-col">
      <Header />
      {children}
    </div>
  </>
)
