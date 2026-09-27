import { raw } from 'hono/html'
import { CREW, SECURITY_GROUPS, listsFor, type Contact, type Group } from '../data.ts'
import { Dialog, DialogActions, DialogError } from './feedback.tsx'
import { ChevronDownIcon, MoreIcon, SearchIcon } from './icons.tsx'
import { Shell } from './shell.tsx'

const BY_NAME = [...CREW].sort((a, b) => a.name.localeCompare(b.name))

export const searchContacts = (q: string, lists: Group[]) => {
  const needle = q.trim().toLowerCase()
  if (!needle) return BY_NAME
  return BY_NAME.filter((c) =>
    [c.name, c.email, c.role, c.department, ...listsFor(c, lists)].some((field) => field.toLowerCase().includes(needle))
  )
}

const composeUrl = (emails: string[]) =>
  `/distribution/compose?${emails.map((e) => `to=${encodeURIComponent(e)}`).join('&')}`

// ---- Row actions menu ----------------------------------------------------------

const MENU_ITEM = 'block w-full px-4 py-2 text-left text-sm hover:bg-gray-100'
const SOON = 'block w-full px-4 py-2 text-left text-sm text-gray-400 cursor-not-allowed'

// Only some actions exist yet; the rest render disabled so the menu matches the design
const RowMenu = ({ contact }: { contact: Contact }) => (
  <details data-dropdown class="row-menu relative">
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

export const ContactRows = ({ contacts, lists }: { contacts: Contact[]; lists: Group[] }) => (
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
        <td class="hidden py-4 pr-4 text-sm uppercase text-gray-500 md:table-cell">{listsFor(contact, lists).join(', ')}</td>
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

// ---- Invite dialog -------------------------------------------------------------------

export const InviteDialog = ({ contact }: { contact: Contact }) => (
  <Dialog
    title="Select security group for account access"
    subtitle={
      <>
        Invite {contact.name} ({contact.email})
      </>
    }
  >
    <form hx-post={`/contacts/${contact.id}/invite`} hx-target="#toasts" hx-swap="beforeend" class="mt-6">
      <div class="relative">
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
      <DialogError />
      <DialogActions confirm="Send Invite" />
    </form>
  </Dialog>
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

export const ContactsPage = ({ q, lists }: { q: string; lists: Group[] }) => (
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
          <ContactRows contacts={searchContacts(q, lists)} lists={lists} />
        </table>
      </div>
    </form>
    {/* Without JS the search still works as a normal GET to /contacts?q= */}
    <form id="contacts-search" action="/contacts" method="get" hidden />
  </Shell>
)
