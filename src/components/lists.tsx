import { raw } from 'hono/html'
import { CREW, type Contact, type Group } from '../data.ts'
import { ALL_CONTACTS } from '../lists.ts'
import { Dialog, DialogActions, DialogError, FIELD } from './feedback.tsx'
import { ChevronDownIcon, GearIcon, PencilIcon } from './icons.tsx'
import { GREEN, Shell } from './shell.tsx'
import { CollapsibleSide } from './side-panel.tsx'

export type ListTab = 'members' | 'non-members'

const BY_NAME = [...CREW].sort((a, b) => a.name.localeCompare(b.name))

// Every contact, presented as a read-only list at the top of the panel
export const ALL_GROUP: Group = { id: ALL_CONTACTS, name: 'All Contacts', members: BY_NAME }

export const listUrl = (id: string, tab: ListTab = 'members') =>
  `/distribution/lists/${id}${tab === 'non-members' ? '?tab=non-members' : ''}`

const loadView = (id: string, tab: ListTab) => ({
  'hx-get': `/partials/lists/${id}?tab=${tab}`,
  'hx-target': '#list-view',
  'hx-swap': 'outerHTML',
  'hx-push-url': listUrl(id, tab),
})

// ---- Left panel ------------------------------------------------------------------------

export const ListsNav = ({ lists, selectedId, oob = false }: { lists: Group[]; selectedId: string; oob?: boolean }) => (
  <aside
    id="lists-nav"
    class="side-panel flex shrink-0 flex-col border-b border-gray-200 md:h-[calc(100vh-5.5rem)] md:w-[380px] md:border-b-0 md:border-r"
    {...(oob ? { 'hx-swap-oob': 'true' } : {})}
  >
    <input type="radio" name="nav-tab" id="nl-lists" class="hidden" checked />
    <input type="radio" name="nav-tab" id="nl-contacts" class="hidden" />
    <div class="nl-tabs flex border-b border-gray-200 text-sm">
      <label for="nl-lists" class="flex-1 cursor-pointer border-b-2 border-transparent py-3 text-center text-gray-500">
        Lists
      </label>
      <label for="nl-contacts" class="flex-1 cursor-pointer border-b-2 border-transparent py-3 text-center text-gray-500">
        Contacts
      </label>
    </div>
    {/* Links are siblings so htmx.takeClass can move the highlight between them */}
    <nav aria-label="Distribution lists" class="nl-lists max-h-80 overflow-y-auto md:max-h-none md:flex-1">
      {[ALL_GROUP, ...lists].map((list) => (
        <a
          href={listUrl(list.id)}
          {...loadView(list.id, 'members')}
          {...{ 'hx-on::after-request': "event.detail.successful && htmx.takeClass(this, 'list-selected')" }}
          class={`block border-b border-gray-100 px-4 py-5 text-sm uppercase text-gray-600 hover:bg-gray-50 ${
            list.id === selectedId ? 'list-selected' : ''
          }`}
        >
          {list.name} ({list.members.length})
        </a>
      ))}
    </nav>
    <ul class="nl-contacts max-h-80 overflow-y-auto md:max-h-none md:flex-1">
      {BY_NAME.map((contact) => {
        const count = lists.filter((l) => l.members.some((m) => m.id === contact.id)).length
        return (
          <li>
            <a href={`/contacts?q=${encodeURIComponent(contact.name)}`} class="flex items-baseline gap-3 border-b border-gray-100 px-4 py-3 text-sm hover:bg-gray-50">
              <span class="flex-1 text-gray-700">{contact.name}</span>
              <span class="text-xs text-gray-400">
                {count} list{count === 1 ? '' : 's'}
              </span>
            </a>
          </li>
        )
      })}
    </ul>
  </aside>
)

// ---- Right panel -----------------------------------------------------------------------

const MENU_ITEM = 'block w-full px-4 py-2.5 text-left hover:bg-gray-100'
const SOON = 'block w-full px-4 py-2.5 text-left text-gray-400 cursor-not-allowed'

const openDialog = (url: string) => ({ 'hx-get': url, 'hx-target': '#modal-root', 'hx-swap': 'innerHTML' })

const ListOptions = ({ list }: { list: Group }) => {
  const isAll = list.id === ALL_CONTACTS
  return (
    <details data-dropdown class="relative">
      <summary class="flex w-64 cursor-pointer list-none items-center gap-3 rounded-full border border-gray-300 px-4 py-2.5 text-gray-600 hover:border-gray-400">
        <GearIcon />
        <span class="flex-1">List Options</span>
        <ChevronDownIcon class="chev transition-transform" />
      </summary>
      <div role="menu" class="absolute left-0 top-full z-30 mt-1 w-64 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
        <button type="button" role="menuitem" class={MENU_ITEM} {...openDialog('/partials/lists/dialog/add')}>
          Add List
        </button>
        <button type="button" role="menuitem" class={MENU_ITEM} {...openDialog(`/partials/lists/${list.id}/dialog/duplicate`)}>
          Duplicate
        </button>
        {isAll ? (
          <button type="button" role="menuitem" class={SOON} disabled title="Pick a list to merge">
            Merge Lists
          </button>
        ) : (
          <button type="button" role="menuitem" class={MENU_ITEM} {...openDialog(`/partials/lists/${list.id}/dialog/merge`)}>
            Merge Lists
          </button>
        )}
        <a role="menuitem" class={MENU_ITEM} href={`/distribution/lists/${list.id}/export.csv`} download>
          Export
        </a>
        <button type="button" role="menuitem" class={SOON} disabled title="Coming soon">
          Compare Lists
        </button>
      </div>
    </details>
  )
}

const EmptyState = ({ list, tab }: { list: Group; tab: ListTab }) => (
  <div class="flex flex-col items-center gap-6 px-6 py-12 text-center sm:flex-row sm:justify-center sm:text-left">
    {/* An empty clipboard */}
    <svg width="120" height="140" viewBox="0 0 120 140" aria-hidden="true">
      <rect x="10" y="18" width="100" height="116" rx="10" fill="#fdf6f0" stroke="#2b2b2b" stroke-width="4" />
      <rect x="38" y="6" width="44" height="24" rx="6" fill="#eed54f" stroke="#2b2b2b" stroke-width="4" />
      <path d="M32 62h56M32 82h40M32 102h48" stroke="#d4d4d4" stroke-width="6" stroke-linecap="round" />
    </svg>
    <div>
      <p class="text-4xl font-black uppercase tracking-tight" style="font-family:Impact,'Arial Narrow',sans-serif">
        Nothing to see here.
      </p>
      <p class="mt-3 max-w-sm font-mono text-gray-700">
        {tab === 'members'
          ? 'This list has no one on it yet. Add people from Non-Members.'
          : `Everyone is already on ${list.name}.`}
      </p>
      {tab === 'members' && (
        <a
          href={listUrl(list.id, 'non-members')}
          {...loadView(list.id, 'non-members')}
          class="mt-4 inline-block rounded-full px-6 py-2 text-sm font-semibold text-white shadow hover:brightness-110"
          style={`background:${GREEN}`}
        >
          Add people
        </a>
      )}
    </div>
  </div>
)

const MemberRows = ({ contacts, selectable }: { contacts: Contact[]; selectable: boolean }) => (
  <tbody>
    {contacts.map((contact) => (
      <tr class="border-t border-gray-200 hover:bg-gray-50">
        <td class="w-14 py-4 pl-6">
          {selectable && (
            <input
              type="checkbox"
              name="ids"
              value={String(contact.id)}
              aria-label={`Select ${contact.name}`}
              class="contact-check h-4 w-4 accent-[#3fae4a]"
            />
          )}
        </td>
        <td class="py-4 pr-4 text-gray-600">{contact.name}</td>
        <td class="hidden py-4 pr-4 text-sm uppercase text-gray-500 sm:table-cell">{contact.department}</td>
        <td class="hidden py-4 pr-4 text-sm text-gray-500 md:table-cell">{contact.role}</td>
        <td class="w-14 py-4 pr-4">
          <a
            href={`/contacts?q=${encodeURIComponent(contact.name)}`}
            aria-label={`Edit ${contact.name}`}
            class="grid h-9 w-9 place-items-center rounded-full text-gray-800 hover:bg-gray-100"
          >
            <PencilIcon />
          </a>
        </td>
      </tr>
    ))}
  </tbody>
)

export const ListView = ({ list, tab }: { list: Group; tab: ListTab }) => {
  const isAll = list.id === ALL_CONTACTS
  const memberIds = new Set(list.members.map((m) => m.id))
  const shown = tab === 'members' ? [...list.members].sort((a, b) => a.name.localeCompare(b.name)) : BY_NAME.filter((c) => !memberIds.has(c.id))
  const selectable = !isAll && shown.length > 0
  const action = tab === 'members' ? 'remove' : 'add'

  return (
    <section id="list-view" class="min-w-0 flex-1 px-4 py-6 md:px-10">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <ListOptions list={list} />
        {!isAll && (
          <button
            type="button"
            data-bulk
            class="rounded-full px-8 py-2.5 font-semibold text-white shadow hover:brightness-110"
            style={`background:${action === 'remove' ? '#e11d5c' : GREEN}`}
            hx-post={`/distribution/lists/${list.id}/members/${action}`}
            hx-include="#list-view"
            hx-target="#list-view"
            hx-swap="outerHTML"
          >
            {action === 'remove' ? 'Remove Selected' : 'Add Selected'}
          </button>
        )}
      </div>

      <h1 class="sr-only">{list.name}</h1>
      <div class="mt-6 flex text-sm" role="tablist">
        {(['members', 'non-members'] as const).map((t) => (
          <a
            href={listUrl(list.id, t)}
            {...loadView(list.id, t)}
            role="tab"
            aria-selected={t === tab ? 'true' : 'false'}
            class={`border-b-2 px-5 py-3 ${t === tab ? 'font-semibold' : 'border-transparent text-gray-600 hover:text-black'}`}
            style={t === tab ? `border-color:${GREEN}` : undefined}
          >
            {t === 'members' ? 'Members' : 'Non-Members'}
          </a>
        ))}
      </div>

      <div class="mt-4 rounded-lg border border-gray-200 shadow-sm">
        <table class="w-full table-fixed">
          <thead>
            <tr class="text-left text-sm font-semibold">
              <th class="w-14 py-5 pl-6">
                {selectable && <input type="checkbox" data-select-all aria-label="Select all" class="h-4 w-4 accent-[#3fae4a]" />}
              </th>
              <th class="py-5 pr-4">Name</th>
              <th class="hidden py-5 pr-4 sm:table-cell">Department</th>
              <th class="hidden py-5 pr-4 md:table-cell">Position</th>
              <th class="w-14" />
            </tr>
          </thead>
          {shown.length > 0 && <MemberRows contacts={shown} selectable={selectable} />}
        </table>
        {shown.length === 0 && <EmptyState list={list} tab={tab} />}
      </div>
    </section>
  )
}

// ---- Dialogs ---------------------------------------------------------------------------

// Every list dialog posts, then swaps the chosen list into #list-view
const postTo = (url: string) => ({ 'hx-post': url, 'hx-target': '#list-view', 'hx-swap': 'outerHTML' })

const NameField = ({ label, value = '' }: { label: string; value?: string }) => (
  <label class="mt-6 block text-left">
    <span class="text-sm text-gray-500">{label}</span>
    <input name="name" value={value} maxlength={60} autocomplete="off" autofocus class={`mt-1 ${FIELD}`} />
  </label>
)

export const AddListDialog = () => (
  <Dialog title="Add Distribution List">
    <form {...postTo('/distribution/lists')}>
      <NameField label="Name" />
      <DialogError />
      <DialogActions confirm="Confirm" />
    </form>
  </Dialog>
)

export const DuplicateDialog = ({ list }: { list: Group }) => (
  <Dialog title="Duplicate Distribution List" subtitle={`Copies the ${list.members.length} people on ${list.name}`}>
    <form {...postTo(`/distribution/lists/${list.id}/duplicate`)}>
      <NameField label="New Name" value={`${list.name} (copy)`} />
      <DialogError />
      <DialogActions confirm="Confirm" />
    </form>
  </Dialog>
)

export const MergeDialog = ({ list, lists }: { list: Group; lists: Group[] }) => (
  <Dialog title="Merge Lists" subtitle="Combines the people on both lists; the originals are kept">
    <form {...postTo(`/distribution/lists/${list.id}/merge`)} class="merge-form">
      <fieldset class="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2">
        <legend class="sr-only">Merge into</legend>
        <label class="flex items-center gap-2">
          <input type="radio" name="mode" value="into-current" class="accent-[#3fae4a]" />
          Merge Into {list.name}
        </label>
        <label class="flex items-center gap-2">
          <input type="radio" name="mode" value="into-new" checked class="accent-[#3fae4a]" />
          Merge Into New List
        </label>
      </fieldset>
      <div class="merge-new-name">
        <NameField label="New List Name" />
      </div>
      <div class="relative mt-4">
        <select name="other" required aria-label="List to merge with" class={`appearance-none bg-white pr-12 uppercase ${FIELD}`}>
          <option value="" disabled selected hidden>
            Choose a list to merge with
          </option>
          {lists
            .filter((l) => l.id !== list.id)
            .map((l) => (
              <option value={l.id}>
                {l.name} ({l.members.length})
              </option>
            ))}
        </select>
        <ChevronDownIcon class="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-gray-500" />
      </div>
      <DialogError />
      <DialogActions confirm="Merge" />
    </form>
  </Dialog>
)

// ---- Page ------------------------------------------------------------------------------

const LISTS_CSS = `
.list-selected { background: #e8f5e6 }
#nl-lists:checked ~ .nl-contacts, #nl-contacts:checked ~ .nl-lists { display: none }
#nl-lists:checked ~ .nl-tabs [for=nl-lists], #nl-contacts:checked ~ .nl-tabs [for=nl-contacts] { border-color: ${GREEN}; color: #222; font-weight: 600 }
#list-view:not(:has(.contact-check:checked)) [data-bulk] { opacity: .4; pointer-events: none; box-shadow: none }
details[data-dropdown] > summary::-webkit-details-marker { display: none }
details[data-dropdown][open] .chev { transform: rotate(180deg) }
.merge-form:has([value=into-current]:checked) .merge-new-name { display: none }
`

export const ListsPage = ({ lists, list, tab }: { lists: Group[]; list: Group; tab: ListTab }) => (
  <Shell path="/distribution/lists">
    <style>{raw(LISTS_CSS)}</style>
    <main class="mt-3 flex flex-1 flex-col border-t border-gray-200 md:flex-row">
      <CollapsibleSide id="lists-nav-collapsed" label="Lists" panel={<ListsNav lists={lists} selectedId={list.id} />} />
      <ListView list={list} tab={tab} />
    </main>
  </Shell>
)
