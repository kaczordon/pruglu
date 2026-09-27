import type { Child } from 'hono/jsx'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, SendIcon } from './icons.tsx'
import { GREEN, Shell } from './shell.tsx'

const Tab = ({ label, active, ...rest }: { label: string; active: boolean; [k: string]: unknown }) => (
  <button
    class={`px-4 py-2 text-sm border-b-2 sm:px-6 ${active ? 'font-semibold' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
    style={active ? `border-color:${GREEN}` : undefined}
    {...rest}
  >
    {label}
  </button>
)

const Panel = ({ id, children }: { id?: string; children: Child }) => (
  <section id={id} class="rounded-lg border border-gray-200 shadow-sm p-2 flex flex-col lg:min-h-[400px]">
    {children}
  </section>
)

// ---- Kit -------------------------------------------------------------------

const Donut = () => (
  <div
    class="w-14 h-14 rounded-full"
    style="background:conic-gradient(#e7c43a 0 22%,#fff 22% 24%,#d98be6 24% 72%,#fff 72% 74%,#43a047 74% 98%,#fff 98%);-webkit-mask:radial-gradient(circle,transparent 36%,#000 38%);mask:radial-gradient(circle,transparent 36%,#000 38%)"
  />
)

const KIT: { label: Child; art: Child; href: string }[] = [
  { label: <>Send<br />Email</>, art: <span class="text-4xl">📣</span>, href: '/distribution/compose' },
  { label: <>Send<br />Text Message</>, art: <span class="text-4xl">📲</span>, href: '#' },
  { label: <>Track<br />Distribution</>, art: <Donut />, href: '/distribution/sent' },
  { label: <>Manage<br />Lists</>, art: <span class="text-4xl">👥</span>, href: '#' },
]

const KitPanel = () => (
  <Panel>
    <div class="flex">
      <Tab label="Kit" active />
    </div>
    <div class="flex-1 grid place-items-center p-2 sm:py-6">
      <div class="grid w-full grid-cols-2 gap-4 sm:w-auto sm:gap-x-12 sm:gap-y-8">
        {KIT.map((tile) => (
          <a
            href={tile.href}
            class="w-full h-28 sm:w-34 rounded-lg bg-white shadow-md flex flex-col items-center justify-center gap-2 text-center text-sm font-semibold leading-tight transition hover:shadow-lg hover:-translate-y-0.5"
          >
            {tile.art}
            <span>{tile.label}</span>
          </a>
        ))}
      </div>
    </div>
  </Panel>
)

// ---- Files / Forms ---------------------------------------------------------

type Doc = { name: Child; action: 'send' | 'add'; backing?: string }

const FILES: Doc[][] = [
  [
    { name: <>Call<br />Sheet</>, action: 'send', backing: '#d98be6' },
    { name: <>Crew<br />List</>, action: 'add' },
    { name: 'Scripts', action: 'send', backing: '#eed54f' },
    { name: 'Sides', action: 'add' },
  ],
  [
    { name: 'Schedules', action: 'send', backing: '#8fe6ee' },
    { name: <>Contact<br />Sheets</>, action: 'add' },
    { name: 'Maps', action: 'send' },
    { name: <>Deal<br />Memos</>, action: 'add', backing: '#e0604a' },
  ],
  [
    { name: <>Production<br />Reports</>, action: 'send' },
    { name: 'Budgets', action: 'add', backing: '#43a047' },
    { name: 'Releases', action: 'add' },
    { name: 'Photos', action: 'add' },
  ],
]

const FORMS: Doc[][] = [
  [
    { name: <>Start<br />Paperwork</>, action: 'send', backing: '#2f3cf5' },
    { name: 'Timecards', action: 'add' },
    { name: <>Petty<br />Cash</>, action: 'add' },
    { name: <>Purchase<br />Orders</>, action: 'add', backing: '#eed54f' },
  ],
]

export type FilesTab = 'files' | 'forms'

const DocCard = ({ doc }: { doc: Doc }) => (
  <div class="relative w-full max-w-36 h-36">
    {doc.backing && (
      <div class="absolute top-0 left-3 right-5 h-20 -rotate-3" style={`background:${doc.backing}`} />
    )}
    <div class="absolute top-0 inset-x-4 h-20 bg-white border border-gray-400 p-2 flex flex-col gap-1">
      <div class="h-1 w-1/2 mx-auto bg-gray-400" />
      <div class="h-0.5 w-full bg-gray-300" />
      <div class="h-0.5 w-5/6 bg-gray-300" />
      <div class="h-0.5 w-full bg-gray-300" />
      <div class="h-0.5 w-2/3 bg-gray-300" />
    </div>
    <a
      href="#"
      class="absolute bottom-0 inset-x-0 h-[4.5rem] rounded-lg bg-white shadow-md grid place-items-center text-center text-sm font-semibold leading-tight hover:shadow-lg"
    >
      <span>{doc.name}</span>
    </a>
    <button
      aria-label={doc.action === 'send' ? 'Send' : 'Add'}
      class="absolute -bottom-3 -right-2 sm:-right-3 w-8 h-8 rounded-full text-white grid place-items-center shadow hover:brightness-110"
      style={`background:${GREEN}`}
    >
      {doc.action === 'send' ? <SendIcon size={16} /> : <PlusIcon />}
    </button>
  </div>
)

export const FilesPanel = ({ tab, page }: { tab: FilesTab; page: number }) => {
  const pages = tab === 'files' ? FILES : FORMS
  const current = Math.min(Math.max(page, 0), pages.length - 1)
  const load = (t: FilesTab, p: number) => ({
    'hx-get': `/partials/files?tab=${t}&page=${p}`,
    'hx-target': '#files-panel',
    'hx-swap': 'outerHTML',
  })

  return (
    <Panel id="files-panel">
      <div class="flex">
        <Tab label="Files" active={tab === 'files'} {...load('files', 0)} />
        <Tab label="Forms" active={tab === 'forms'} {...load('forms', 0)} />
      </div>
      <div class="flex-1 grid grid-cols-2 gap-x-6 gap-y-8 justify-items-center content-center px-3 py-6">
        {pages[current].map((doc) => (
          <DocCard doc={doc} />
        ))}
      </div>
      {pages.length > 1 && (
        <div class="flex items-center justify-center gap-6 pb-3">
          <button
            aria-label="Previous page"
            class="disabled:text-gray-300"
            style={current > 0 ? `color:${GREEN}` : undefined}
            disabled={current === 0}
            {...load(tab, current - 1)}
          >
            <ChevronLeftIcon />
          </button>
          <div class="flex gap-1.5">
            {pages.map((_, i) => (
              <span class="w-2 h-2 rounded-full bg-gray-300" style={i === current ? `background:${GREEN}` : undefined} />
            ))}
          </div>
          <button
            aria-label="Next page"
            class="disabled:text-gray-300"
            style={current < pages.length - 1 ? `color:${GREEN}` : undefined}
            disabled={current === pages.length - 1}
            {...load(tab, current + 1)}
          >
            <ChevronRightIcon />
          </button>
        </div>
      )}
    </Panel>
  )
}

export const Dashboard = () => (
  <Shell path="/">
    <main class="px-3 pb-8 sm:px-6">
      <h1 class="mt-3 rounded-lg border border-gray-200 shadow-sm py-2 text-center text-xl font-bold sm:text-2xl">
        You've Got E-Mail
      </h1>
      <div class="mt-5 grid gap-5 sm:gap-8 lg:grid-cols-2">
        <KitPanel />
        <FilesPanel tab="files" page={0} />
      </div>
    </main>
  </Shell>
)
