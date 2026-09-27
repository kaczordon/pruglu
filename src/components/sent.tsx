import { raw } from 'hono/html'
import {
  DELIVERY_STATUSES,
  FAILED,
  MESSAGE_BODIES,
  SENT,
  deliveriesFor,
  type Delivery,
  type DeliveryStatus,
  type SentMessage,
} from '../data.ts'
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from './icons.tsx'
import { GREEN, Shell } from './shell.tsx'
import { CollapsibleSide } from './side-panel.tsx'

const PAGE_SIZE = 100

const STATUS: Record<DeliveryStatus, { label: string; color: string }> = {
  sent: { label: 'Sent', color: '#a5dc7a' },
  received: { label: 'Received', color: '#86bf5e' },
  opened: { label: 'Opened', color: '#1db32b' },
  bounced: { label: 'Bounced', color: '#d4d4d4' },
  deferred: { label: 'Deferred', color: '#f48fb1' },
  dropped: { label: 'Dropped', color: '#ea0f5f' },
}

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
const longDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })

export const messageUrl = (message: SentMessage) => `/distribution/sent/${message.id}`

// ---- Sent list -------------------------------------------------------------

export const SentList = ({ q, page, selectedId }: { q: string; page: number; selectedId?: number }) => {
  const needle = q.trim().toLowerCase()
  const matches = needle ? SENT.filter((m) => m.title.toLowerCase().includes(needle)) : SENT
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE))
  const current = Math.min(Math.max(page, 0), pages - 1)
  const shown = matches.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)
  const load = (p: number) => ({
    'hx-get': `/partials/sent/list?q=${encodeURIComponent(q)}&page=${p}`,
    'hx-target': '#sent-list',
    'hx-swap': 'outerHTML',
  })

  return (
    <div id="sent-list" class="flex min-h-0 flex-1 flex-col">
      {/* Links are direct siblings so htmx.takeClass can move the highlight between them */}
      <nav aria-label="Sent messages" class="max-h-80 overflow-y-auto md:max-h-none md:flex-1">
        {shown.map((message) => (
          <a
            href={messageUrl(message)}
            hx-get={`/partials/sent/${message.id}`}
            hx-target="#sent-view"
            hx-swap="outerHTML"
            hx-push-url={messageUrl(message)}
            // htmx's client-side helper moves the highlight. It runs after the request so
            // the history snapshot htmx saves for the Back button keeps the old highlight
            {...{ 'hx-on::after-request': "event.detail.successful && htmx.takeClass(this, 'sent-selected')" }}
            class={`sent-item flex items-baseline gap-3 border-b border-gray-200 px-3 py-4 hover:bg-gray-50 ${
              message.id === selectedId ? 'sent-selected' : ''
            }`}
          >
            <span class="min-w-0 flex-1 truncate text-gray-600">{message.title}</span>
            <time datetime={message.sentAt.toISOString()} class="shrink-0 text-xs text-gray-400">
              {shortDate.format(message.sentAt)}
            </time>
          </a>
        ))}
        {shown.length === 0 && <p class="px-3 py-6 text-center text-sm text-gray-500">No sent messages match “{q}”.</p>}
      </nav>
      {matches.length > 0 && (
        <div class="flex items-center justify-end gap-4 border-t border-gray-200 px-3 py-2 text-sm text-gray-600">
          <span>
            {current * PAGE_SIZE + 1} – {current * PAGE_SIZE + shown.length} of {matches.length}
          </span>
          <button aria-label="Newer" class="disabled:text-gray-300" disabled={current === 0} {...load(current - 1)}>
            <ChevronLeftIcon />
          </button>
          <button aria-label="Older" class="disabled:text-gray-300" disabled={current === pages - 1} {...load(current + 1)}>
            <ChevronRightIcon />
          </button>
        </div>
      )}
    </div>
  )
}

const SentPanel = ({ selectedId }: { selectedId: number }) => (
  <aside class="side-panel flex shrink-0 flex-col border-b border-gray-200 md:h-[calc(100vh-5.5rem)] md:w-[380px] md:border-b-0 md:border-r">
    <div class="border-b-2 border-gray-800 p-3">
      <label class="flex items-center gap-3 rounded-full border border-gray-300 px-4 py-2 text-gray-500 focus-within:border-gray-500">
        <SearchIcon size={18} />
        <input
          type="search"
          name="q"
          placeholder="Search Sent"
          aria-label="Search sent messages"
          autocomplete="off"
          class="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none"
          hx-get="/partials/sent/list"
          hx-trigger="input changed delay:300ms, search"
          hx-target="#sent-list"
          hx-swap="outerHTML"
        />
      </label>
    </div>
    <SentList q="" page={0} selectedId={selectedId} />
  </aside>
)

// ---- Message view ----------------------------------------------------------

export const RecipientRows = ({ deliveries }: { deliveries: Delivery[] }) => (
  <tbody id="recipients-body">
    {deliveries.map(({ person, status }) => (
      <tr class="border-b border-gray-100">
        <td class="py-2.5 pl-3">
          <span
            class="block h-6 w-6 rounded-full"
            style={`background:${STATUS[status].color}`}
            title={STATUS[status].label}
            role="img"
            aria-label={STATUS[status].label}
          />
        </td>
        <td class="px-3 py-2.5 text-sm text-gray-700">{person.name}</td>
        <td class="max-w-0 truncate px-3 py-2.5 text-sm text-gray-500">{person.email}</td>
      </tr>
    ))}
    {deliveries.length === 0 && (
      <tr>
        <td colspan={3} class="py-6 text-center text-sm text-gray-500">
          No recipients match.
        </td>
      </tr>
    )}
  </tbody>
)

export const filterDeliveries = (deliveries: Delivery[], q: string) => {
  const needle = q.trim().toLowerCase()
  return needle
    ? deliveries.filter((d) => d.person.name.toLowerCase().includes(needle) || d.person.email.includes(needle))
    : deliveries
}

const Donut = ({ counts, total }: { counts: Record<DeliveryStatus, number>; total: number }) => {
  let at = 0
  const stops = DELIVERY_STATUSES.map((status) => {
    const from = at
    at += (counts[status] / total) * 100
    return `${STATUS[status].color} ${from}% ${at}%`
  })
  const mask = 'radial-gradient(circle,transparent 48%,#000 49%)'
  return (
    <div
      role="img"
      aria-label={DELIVERY_STATUSES.map((s) => `${STATUS[s].label} ${counts[s]}`).join(', ')}
      class="mx-auto h-44 w-44 rounded-full"
      style={`background:conic-gradient(${stops.join(',')});-webkit-mask:${mask};mask:${mask}`}
    />
  )
}

const DistributionReport = ({ deliveries }: { deliveries: Delivery[] }) => {
  const counts = Object.fromEntries(DELIVERY_STATUSES.map((s) => [s, 0])) as Record<DeliveryStatus, number>
  deliveries.forEach((d) => counts[d.status]++)
  const fail = deliveries.filter((d) => FAILED.has(d.status)).length

  return (
    <div class="border-b border-gray-200 px-6 py-6 xl:border-b-0 xl:border-r">
      <h3 class="text-center text-xl font-semibold text-gray-600">Distribution Report</h3>
      <p class="mt-2 text-center font-bold">
        <span style={`color:${GREEN}`}>Success: {deliveries.length - fail}</span>{' '}
        <span class="text-red-600">Fail: {fail}</span>
      </p>
      <div class="mt-6">
        <Donut counts={counts} total={Math.max(deliveries.length, 1)} />
      </div>
      <ul class="mx-auto mt-6 max-w-56">
        {DELIVERY_STATUSES.map((status) => (
          <li class="flex items-center gap-3 border-b border-gray-300 py-2 text-sm font-semibold">
            <span class="h-7 w-7 shrink-0 rounded-full" style={`background:${STATUS[status].color}`} />
            {STATUS[status].label}: {counts[status]}
          </li>
        ))}
      </ul>
    </div>
  )
}

export const MessageView = ({ message }: { message: SentMessage }) => {
  const deliveries = deliveriesFor(message)
  return (
    <section id="sent-view" class="min-w-0 flex-1 px-4 py-6 md:px-10">
      <h2 class="mb-3 text-sm font-bold">View Message</h2>
      <div class="rounded-lg border border-gray-200 shadow-sm">
        <header class="border-b border-gray-200 px-6 py-4">
          <p class="font-semibold">{message.title}</p>
          <p class="mt-0.5 text-xs text-gray-500">
            Sent {longDate.format(message.sentAt)} UTC · from Production Office · {deliveries.length} recipients
          </p>
          <p class="mt-3 text-sm text-gray-600">{MESSAGE_BODIES[message.kind]}</p>
        </header>
        <div class="grid xl:grid-cols-[300px_1fr]">
          <DistributionReport deliveries={deliveries} />
          <div class="min-w-0 px-3 py-4">
            <div class="mb-3 flex justify-end">
              <label class="flex w-full max-w-72 items-center gap-2 rounded-full border border-gray-300 px-4 py-1.5 text-gray-500 focus-within:border-gray-500">
                <SearchIcon />
                <input
                  type="search"
                  name="q"
                  placeholder="Search recipients"
                  aria-label="Search recipients"
                  autocomplete="off"
                  class="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none"
                  hx-get={`/partials/sent/${message.id}/recipients`}
                  hx-trigger="input changed delay:250ms, search"
                  hx-target="#recipients-body"
                  hx-swap="outerHTML"
                />
              </label>
            </div>
            <div class="max-h-[560px] overflow-y-auto">
              <table class="w-full table-fixed">
                <thead class="sticky top-0 bg-white">
                  <tr class="border-b border-gray-200 text-left text-sm font-semibold">
                    <th class="w-20 py-2 pl-3">Status</th>
                    <th class="px-3 py-2">Name</th>
                    <th class="px-3 py-2">Email</th>
                  </tr>
                </thead>
                <RecipientRows deliveries={deliveries} />
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---- Page --------------------------------------------------------------------

const SENT_CSS = `.sent-selected { background: #e8f5e6; box-shadow: inset 0 0 0 1px ${GREEN} }`

export const SentPage = ({ message }: { message: SentMessage }) => (
  <Shell path="/distribution/sent">
    <style>{raw(SENT_CSS)}</style>
    <main class="mt-3 flex flex-1 flex-col border-t border-gray-200 md:flex-row">
      <CollapsibleSide id="sent-collapsed" label="Sent" panel={<SentPanel selectedId={message.id} />} />
      <MessageView message={message} />
    </main>
  </Shell>
)
