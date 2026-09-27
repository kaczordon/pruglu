import { raw } from 'hono/html'
import { CREW, SECURITY_GROUPS, listsFor, type Contact } from '../data.ts'
import { ChevronDownIcon, CloseIcon, InfoIcon, MoreIcon, SearchIcon } from './icons.tsx'
import { GREEN, Shell } from './shell.tsx'

const BY_NAME = [...CREW].sort((a, b) => a.name.localeCompare(b.name))

export const searchContacts = (q: string) => {
  const needle = q.trim().toLowerCase()
  if (!needle) return BY_NAME
  return BY_NAME.filter((c) =>
    [c.name, c.email, c.role, c.department, ...listsFor(c)].some((field) => field.toLowerCase().includes(needle))
  )
}

const composeUrl = (emails: string[]) =>
  `/distribution/compose?${emails.map((e) => `to=${encodeURIComponent(e)}`).join('&')}`

// ---- Row actions menu ----------------------------------------------------------

const MENU_ITEM = 'block w-full px-4 py-2 text-left text-sm hover:bg-gray-100'
const SOON = 'block w-full px-4 py-2 text-left text-sm text-gray-400 cursor-not-allowed'

// Only some actions exist yet; the rest render disabled so the menu matches the design
const RowMenu = ({ contact }: { contact: Contact }) => (
  <details class="row-menu relative">
    <summary
      aria-label={`Actions for ${contact.name}`}
      class="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-full text-gray-600 hover:bg-gray-100"
    >
      <MoreIcon />
    </summary>
    <div role="menu" class="absolute right-0 top-full z-30 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
      <button
        type="button"
        role="menuitem"
        class={MENU_ITEM}
        hx-get={`/partials/contacts/${contact.id}/invite`}
        hx-target="#modal-root"
        hx-swap="innerHTML"
      >
        Send Invite
      </button>
      <button role="menuitem" class={SOON} disabled title="Coming soon">View/Edit</button>
      <a role="menuitem" class={MENU_ITEM} href={composeUrl([contact.email])}>
        Email
      </a>
      {['Text (SMS)', 'Change Category', 'Change Department', 'Add Distribution List', 'Edit Distribution Lists', 'Delete'].map(
        (label) => (
          <button role="menuitem" class={SOON} disabled title="Coming soon">
            {label}
          </button>
        )
      )}
    </div>
  </details>
)

// ---- Table -----------------------------------------------------------------------

export const ContactRows = ({ contacts }: { contacts: Contact[] }) => (
  <tbody id="contacts-body">
    {contacts.map((contact) => (
      <tr class="border-t border-gray-200 hover:bg-gray-50">
        <td class="w-14 py-4 pl-6">
          <input
            type="checkbox"
            name="to"
            value={contact.email}
            aria-label={`Select ${contact.name}`}
            class="contact-check h-4 w-4 accent-[#3fae4a]"
          />
        </td>
        <td class="py-4 pr-4">
          <div class="font-semibold text-gray-700">{contact.name}</div>
          <div class="text-sm text-gray-500">{contact.role}</div>
          <div class="truncate text-sm text-gray-500 sm:hidden">{contact.email}</div>
        </td>
        <td class="hidden py-4 pr-4 text-sm uppercase text-gray-500 md:table-cell">{listsFor(contact).join(', ')}</td>
        <td class="hidden max-w-0 truncate py-4 pr-4 text-sm text-gray-500 sm:table-cell">{contact.email}</td>
        <td class="w-14 py-4 pr-4">
          <RowMenu contact={contact} />
        </td>
      </tr>
    ))}
    {contacts.length === 0 && (
      <tr>
        <td colspan={5} class="py-10 text-center text-sm text-gray-500">
          No contacts match.
        </td>
      </tr>
    )}
  </tbody>
)

// ---- Invite dialog + toast ---------------------------------------------------------

// Loaded into #modal-root; app.js calls showModal() on anything marked data-autoshow
export const InviteDialog = ({ contact }: { contact: Contact }) => (
  <dialog
    data-autoshow
    aria-labelledby="invite-title"
    class="w-[min(560px,calc(100vw-2rem))] rounded-2xl p-8 shadow-xl backdrop:bg-black/40"
  >
    <form method="dialog" class="absolute right-4 top-4">
      <button aria-label="Close" class="grid h-9 w-9 place-items-center rounded-full text-gray-600 hover:bg-gray-100">
        <CloseIcon />
      </button>
    </form>
    <form
      hx-post={`/contacts/${contact.id}/invite`}
      hx-target="#toasts"
      hx-swap="beforeend"
      class="flex flex-col items-center text-center"
    >
      <span class="grid h-14 w-14 place-items-center rounded-full bg-gray-500 text-2xl font-bold text-white">i</span>
      <h2 id="invite-title" class="mt-4 text-2xl font-bold">Select security group for account access</h2>
      <p class="mt-1 text-sm text-gray-500">
        Invite {contact.name} ({contact.email})
      </p>
      <div class="relative mt-6 w-full">
        <select
          name="group"
          required
          aria-label="Security group"
          class="w-full appearance-none rounded-full border border-gray-300 bg-white px-5 py-3 text-left outline-none focus:border-gray-500"
        >
          <option value="" disabled selected hidden>
            Choose a security group
          </option>
          {SECURITY_GROUPS.map((group) => (
            <option value={group}>{group}</option>
          ))}
        </select>
        <ChevronDownIcon class="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-gray-500" />
      </div>
      <p id="invite-error" class="mt-2 min-h-5 text-sm text-red-600" aria-live="polite" />
      <button
        class="mt-2 rounded-full px-8 py-2.5 font-semibold text-white shadow hover:brightness-110"
        style={`background:${GREEN}`}
      >
        Send Invite
      </button>
    </form>
  </dialog>
)

// Appended to #toasts; app.js removes it after a few seconds or on ✕
export const Toast = ({ message }: { message: string }) => (
  <div
    role="status"
    class="toast pointer-events-auto flex w-[min(520px,calc(100vw-2rem))] items-center gap-3 rounded-full px-5 py-3 text-white shadow-lg"
    style={`background:${GREEN}`}
  >
    <InfoIcon class="shrink-0" />
    <span class="flex-1">{message}</span>
    <button data-dismiss-toast aria-label="Dismiss" class="grid h-7 w-7 place-items-center rounded-full hover:bg-white/20">
      <CloseIcon />
    </button>
  </div>
)

// ---- Page ----------------------------------------------------------------------------

const TOOLBAR_BUTTON = 'rounded-full bg-white px-4 py-2 sm:px-6 sm:py-2.5 text-sm font-semibold text-gray-700 shadow-md hover:shadow-lg'
const TOOLBAR_SOON = 'rounded-full bg-white px-4 py-2 sm:px-6 sm:py-2.5 text-sm font-semibold text-gray-400 shadow-md cursor-not-allowed'

// Which toolbar shows depends only on whether any row is ticked, so CSS :has() handles it
const CONTACTS_CSS = `
#contacts .when-selected { display: none }
#contacts:has(.contact-check:checked) .when-selected { display: flex }
#contacts:has(.contact-check:checked) .when-none { display: none }
.row-menu > summary::-webkit-details-marker { display: none }
`

export const ContactsPage = ({ q }: { q: string }) => (
  <Shell path="/contacts">
    <style>{raw(CONTACTS_CSS)}</style>
    {/* A plain GET form: "Email" submits the ticked rows as ?to=… to Compose */}
    <form id="contacts" action="/distribution/compose" method="get" class="mt-3 border-t border-gray-200 px-3 py-6 sm:px-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
        <label class="flex w-full items-center gap-3 rounded-full border border-gray-300 px-4 py-2.5 text-gray-500 focus-within:border-gray-500 lg:max-w-md">
          <SearchIcon size={18} />
          <input
            type="search"
            name="q"
            form="contacts-search"
            value={q}
            placeholder="Search contacts"
            aria-label="Search contacts"
            autocomplete="off"
            class="min-w-0 flex-1 bg-transparent text-gray-800 outline-none"
            hx-get="/partials/contacts"
            hx-trigger="input changed delay:250ms, search"
            hx-target="#contacts-body"
            hx-swap="outerHTML"
          />
        </label>
        <div class="when-none flex flex-wrap gap-3 lg:ml-auto">
          <button type="button" class={TOOLBAR_SOON} disabled title="Coming soon">Manage Lists</button>
          <button type="button" class={TOOLBAR_SOON} disabled title="Coming soon">Set DooDs</button>
        </div>
        <div class="when-selected flex-wrap gap-3 lg:ml-auto">
          <button type="submit" class={TOOLBAR_BUTTON}>Email</button>
          {['Text', 'Add To List', 'Set DooDs', 'Options'].map((label) => (
            <button type="button" class={TOOLBAR_SOON} disabled title="Coming soon">
              {label}
            </button>
          ))}
        </div>
      </div>

      <div class="mt-6 rounded-lg border border-gray-200 shadow-sm">
        <table class="w-full table-fixed">
          <thead>
            <tr class="text-left text-sm font-semibold">
              <th class="w-14 py-6 pl-6">
                <input type="checkbox" data-select-all aria-label="Select all contacts" class="h-4 w-4 accent-[#3fae4a]" />
              </th>
              <th class="py-6 pr-4">Name</th>
              <th class="hidden py-6 pr-4 md:table-cell">Lists</th>
              <th class="hidden py-6 pr-4 sm:table-cell">Email</th>
              <th class="w-14" />
            </tr>
          </thead>
          <ContactRows contacts={searchContacts(q)} />
        </table>
      </div>
    </form>
    {/* Without JS the search still works as a normal GET to /contacts?q= */}
    <form id="contacts-search" action="/contacts" method="get" hidden />
    <div id="modal-root" />
    <div id="toasts" class="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2" aria-live="polite" />
  </Shell>
)
