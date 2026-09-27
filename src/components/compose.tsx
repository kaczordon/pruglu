import { raw } from 'hono/html'
import {
  AlignIcon,
  ChevronDownIcon,
  ClearFormatIcon,
  ImageIcon,
  LinkIcon,
  ListBulletIcon,
  ListOrderedIcon,
  PaperclipIcon,
  RedoIcon,
  SearchIcon,
  UndoIcon,
} from './icons.tsx'
import { CREW, DEPARTMENTS, LISTS, type Group } from '../data.ts'
import { GREEN, Shell } from './shell.tsx'
import { CollapsibleSide } from './side-panel.tsx'
import { SCRIPTS } from '../static-assets.ts'

const REPLY_TO = ['Production Office (office@example.com)', 'Jakub Kawalec (jk@example.com)']

const TEMPLATES: Record<string, { name: string; subject: string; body: string }> = {
  'call-sheet': {
    name: 'Call Sheet',
    subject: 'Call Sheet — Day 12',
    body: "<p>Hi {{recipient_name}},</p><p>Please find tomorrow's call sheet attached. Crew call is 7:00 AM at basecamp.</p><p>Thanks,<br>Production</p>",
  },
  'script-revision': {
    name: 'Script Revision',
    subject: 'Script Revisions — Blue Pages',
    body: '<p>Hi {{recipient_name}},</p><p>Blue revision pages are attached. Please swap them into your script before tomorrow.</p><p>Thanks,<br>Production</p>',
  },
  'deal-memo': {
    name: 'Deal Memo',
    subject: 'Your Deal Memo',
    body: '<p>Hi {{recipient_name}},</p><p>Your deal memo is attached for review and signature. Reply with any questions.</p><p>Thanks,<br>Production</p>',
  },
}

// ---- Recipients (the To: field) ----------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Chip = { label: string; title?: string; kind: 'group' | 'person' | 'invalid' }

// One chip per ticked list/department, then people ticked individually, then
// typed addresses. `count` is the number of unique valid emails across all three.
export const resolveRecipients = (typed: string, groupIds: string[], checked: string[]) => {
  const emails = new Set(checked)
  const chips: Chip[] = []
  const shown = new Set<string>()

  for (const group of [...LISTS, ...DEPARTMENTS]) {
    if (groupIds.includes(group.id)) {
      chips.push({ label: `${group.name} (${group.members.length})`, kind: 'group' })
      group.members.forEach((m) => {
        emails.add(m.email)
        shown.add(m.email)
      })
    }
  }
  for (const email of emails) {
    const person = CREW.find((p) => p.email === email)
    if (person && !shown.has(email)) {
      chips.push({ label: person.name, title: email, kind: 'person' })
      shown.add(email)
    }
  }
  for (const address of typed.split(/[\s,;]+/).filter(Boolean)) {
    if (shown.has(address.toLowerCase())) continue
    const valid = EMAIL_RE.test(address)
    // Typed addresses of known contacts show their name, like ticked people do
    const known = CREW.find((p) => p.email === address.toLowerCase())
    chips.push({
      label: known?.name ?? address,
      title: valid ? address : 'Not a valid email address',
      kind: valid ? 'person' : 'invalid',
    })
    if (valid) emails.add(address.toLowerCase())
    shown.add(address.toLowerCase())
  }

  const count = [...emails].filter((e) => EMAIL_RE.test(e)).length
  return { chips, count }
}

const CHIP_STYLES: Record<Chip['kind'], string> = {
  group: 'bg-green-50 text-green-800 border-green-200',
  person: 'bg-gray-100 text-gray-800 border-gray-200',
  invalid: 'bg-red-50 text-red-700 border-red-200 line-through',
}

const MAX_CHIPS = 10

export const ToField = ({ chips }: { chips: Chip[] }) => {
  const hidden = chips.slice(MAX_CHIPS)
  return (
    <div id="to-field" class="flex flex-1 flex-wrap gap-1.5 min-h-7" aria-live="polite">
      {chips.slice(0, MAX_CHIPS).map((chip) => (
        <span title={chip.title} class={`rounded-full border px-2.5 py-0.5 text-xs ${CHIP_STYLES[chip.kind]}`}>
          {chip.label}
        </span>
      ))}
      {hidden.length > 0 && (
        <span
          title={hidden.map((chip) => chip.label).join(', ')}
          class="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs text-gray-500"
        >
          +{hidden.length} more
        </span>
      )}
    </div>
  )
}

// ---- Template loading --------------------------------------------------------

// Fills the editor and swaps the subject out-of-band
export const TemplateContent = ({ id }: { id: string }) => {
  const template = TEMPLATES[id]
  return (
    <>
      {template ? raw(template.body) : ''}
      <SubjectInput value={template?.subject ?? ''} oob />
    </>
  )
}

const SubjectInput = ({ value = '', oob = false }: { value?: string; oob?: boolean }) => (
  <input
    id="subject"
    name="subject"
    value={value}
    aria-label="Subject"
    autocomplete="off"
    class="flex-1 min-w-0 bg-transparent text-sm outline-none"
    {...(oob ? { 'hx-swap-oob': 'true' } : {})}
  />
)

// ---- Lists panel -------------------------------------------------------------

const GroupRow = ({ group }: { group: Group }) => (
  <details data-group class="border-b border-gray-200">
    <summary class="flex items-center gap-3 px-3 py-3.5 cursor-pointer list-none hover:bg-gray-50">
      <input type="checkbox" data-list name="groups" value={group.id} aria-label={`Select all of ${group.name}`} class="w-4 h-4 accent-[#3fae4a]" />
      <span class="flex-1 text-sm uppercase text-gray-500">
        {group.name} (<span data-count>0</span>/{group.members.length})
      </span>
      <ChevronDownIcon class="chev text-gray-500 transition-transform" />
    </summary>
    <ul class="pb-2">
      {group.members.map((person) => (
        <li>
          <label class="flex items-center gap-3 pl-10 pr-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50">
            <input type="checkbox" data-member name="members" value={person.email} class="w-4 h-4 accent-[#3fae4a]" />
            <span>{person.name}</span>
            <span class="ml-auto truncate text-xs text-gray-400">{person.email}</span>
          </label>
        </li>
      ))}
    </ul>
  </details>
)

const ListsPanel = ({ emails }: { emails: string }) => (
  <aside
    class="side-panel shrink-0 flex flex-col border-b border-gray-200 md:w-[380px] md:border-b-0 md:border-r"
    hx-post="/partials/compose/recipients"
    hx-trigger="change, keyup[target.id=='email-input'] delay:500ms"
    hx-include="#compose"
    hx-target="#to-field"
    hx-swap="outerHTML"
  >
    <div class="p-3">
      <input
        id="email-input"
        name="emails"
        value={emails}
        type="text"
        autocomplete="off"
        placeholder="Enter Email Address(es)"
        aria-label="Email addresses"
        class="w-full rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-sm outline-none focus:border-gray-400"
      />
    </div>
    <input type="radio" name="list-tab" id="tab-lists" class="hidden" checked />
    <input type="radio" name="list-tab" id="tab-depts" class="hidden" />
    <div class="tabs flex border-b border-gray-200 text-sm">
      <label for="tab-lists" class="flex-1 cursor-pointer border-b-2 border-transparent py-2 text-center text-gray-500">
        Lists
      </label>
      <label for="tab-depts" class="flex-1 cursor-pointer border-b-2 border-transparent py-2 text-center text-gray-500">
        Departments
      </label>
    </div>
    <div class="pane-lists max-h-80 overflow-y-auto md:max-h-none md:flex-1">
      {LISTS.map((group) => (
        <GroupRow group={group} />
      ))}
    </div>
    <div class="pane-depts max-h-80 overflow-y-auto md:max-h-none md:flex-1">
      {DEPARTMENTS.map((group) => (
        <GroupRow group={group} />
      ))}
    </div>
  </aside>
)

// ---- Message form ------------------------------------------------------------

const TOOL = 'w-7 h-7 grid place-items-center rounded text-gray-700 hover:bg-gray-100'
const TOOL_SELECT = 'w-7 h-7 appearance-none rounded bg-transparent text-center text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'

const Toolbar = () => (
  <div class="flex flex-wrap items-center gap-0.5 border-y border-gray-200 px-3 py-2" role="toolbar" aria-label="Formatting">
    <select data-cmd="fontName" aria-label="Font" class={TOOL_SELECT}>
      <option value="" hidden selected>F</option>
      {['Arial', 'Georgia', 'Courier New', 'Verdana'].map((font) => (
        <option value={font}>{font}</option>
      ))}
    </select>
    <select data-cmd="fontSize" aria-label="Text size" class={TOOL_SELECT}>
      <option value="" hidden selected>S</option>
      <option value="2">Small</option>
      <option value="3">Normal</option>
      <option value="5">Large</option>
      <option value="7">Huge</option>
    </select>
    <button data-cmd="bold" aria-label="Bold" class={`${TOOL} font-bold`}>B</button>
    <button data-cmd="italic" aria-label="Italic" class={`${TOOL} italic font-serif`}>I</button>
    <button data-cmd="underline" aria-label="Underline" class={`${TOOL} underline`}>U</button>
    <button data-cmd="insertOrderedList" aria-label="Numbered list" class={TOOL}><ListOrderedIcon /></button>
    <button data-cmd="insertUnorderedList" aria-label="Bulleted list" class={TOOL}><ListBulletIcon /></button>
    <label class={`${TOOL} relative cursor-pointer`} title="Alignment">
      <AlignIcon />
      <select data-cmd="align" aria-label="Alignment" class="absolute inset-0 opacity-0 cursor-pointer">
        <option value="" hidden selected></option>
        <option value="justifyLeft">Left</option>
        <option value="justifyCenter">Center</option>
        <option value="justifyRight">Right</option>
      </select>
    </label>
    <label class={`${TOOL} relative cursor-pointer`} title="Text colour">
      <span class="font-semibold underline decoration-2">A</span>
      <input type="color" data-cmd="foreColor" aria-label="Text colour" class="absolute inset-0 opacity-0 cursor-pointer" />
    </label>
    <label class={`${TOOL} relative cursor-pointer`} title="Highlight">
      <span class="rounded-sm bg-gray-700 px-0.5 text-xs font-semibold text-white">A</span>
      <input type="color" data-cmd="hiliteColor" value="#fff59d" aria-label="Highlight colour" class="absolute inset-0 opacity-0 cursor-pointer" />
    </label>
    <button data-cmd="createLink" aria-label="Insert link" class={TOOL}><LinkIcon /></button>
    <button data-cmd="insertImage" aria-label="Insert image" class={TOOL}><ImageIcon /></button>
    <button data-cmd="removeFormat" aria-label="Clear formatting" class={TOOL}><ClearFormatIcon /></button>
    <button data-cmd="undo" aria-label="Undo" class={TOOL}><UndoIcon /></button>
    <button data-cmd="redo" aria-label="Redo" class={TOOL}><RedoIcon /></button>
  </div>
)

const Row = ({ label, children }: { label: string; children: any }) => (
  <div class="flex items-center gap-4 border-b border-gray-200 py-4">
    <span class="w-16 shrink-0 text-sm font-semibold sm:w-20">{label}</span>
    {children}
  </div>
)

const MessageForm = ({ chips }: { chips: Chip[] }) => (
  <section class="flex-1 min-w-0 px-4 pb-8 md:px-12">
    <Row label="To:">
      <ToField chips={chips} />
    </Row>
    <Row label="Reply To:">
      <div class="relative min-w-0">
        <select name="replyTo" aria-label="Reply to" class="w-full max-w-full truncate appearance-none rounded-full border border-gray-300 bg-white py-2 pl-4 pr-9 text-sm">
          {REPLY_TO.map((option) => (
            <option>{option}</option>
          ))}
        </select>
        <ChevronDownIcon size={16} class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
      </div>
    </Row>
    <Row label="Subject:">
      <SubjectInput />
    </Row>

    <div class="mt-6 rounded-lg border border-gray-200 shadow-sm">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3">
        <div class="relative">
          <select
            name="template"
            aria-label="Select template"
            class="appearance-none rounded-full border border-gray-300 bg-white py-2 pl-4 pr-9 text-sm text-gray-600"
            hx-get="/partials/compose/template"
            hx-trigger="change"
            hx-target="#editor"
            hx-swap="innerHTML"
          >
            <option value="">Select Template</option>
            {Object.entries(TEMPLATES).map(([id, template]) => (
              <option value={id}>{template.name}</option>
            ))}
          </select>
          <ChevronDownIcon size={16} class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>
        <button class="text-xs text-gray-600 hover:text-gray-900" title="Not available yet" disabled>
          Save As Template
        </button>
        <button data-cmd="insertRecipient" class="ml-auto text-xs text-gray-600 hover:text-gray-900">
          Insert Recipient Name(s)
        </button>
      </div>
      <Toolbar />
      <div
        id="editor"
        contenteditable
        role="textbox"
        aria-multiline="true"
        aria-label="Message"
        data-placeholder="Start your message here..."
        class="min-h-[260px] px-3 py-3 text-sm outline-none [&_p]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_a]:text-blue-600 [&_a]:underline"
      />
      <input type="hidden" id="body-input" name="body" />
      <div class="flex flex-wrap items-center gap-3 border-t border-gray-200 px-3 py-2 text-xs">
        <details class="sms mr-auto">
          <summary class="flex cursor-pointer list-none items-center gap-1 font-semibold" style={`color:${GREEN}`}>
            Text SMS <ChevronDownIcon size={14} class="chev transition-transform" />
          </summary>
          <textarea
            name="sms"
            maxlength={160}
            rows={2}
            placeholder="Optional text message (160 characters)"
            aria-label="Text message"
            class="mt-2 w-72 max-w-full rounded border border-gray-300 p-2 text-sm outline-none focus:border-gray-500"
          />
        </details>
        <label class="flex cursor-pointer items-center gap-1.5 text-gray-600 hover:text-gray-900">
          <input type="file" id="attachments" name="attachments" multiple class="sr-only" />
          <PaperclipIcon /> <span id="attachments-label">Upload Files</span>
        </label>
        <span class="h-4 w-px bg-gray-300" />
        <a href="#" class="flex items-center gap-1.5 text-gray-600 hover:text-gray-900">
          <SearchIcon /> Find Files
        </a>
      </div>
    </div>

    <div class="mt-4 flex items-center justify-end gap-4">
      <div id="compose-status" class="text-sm" aria-live="polite" />
      <button
        class="rounded-full px-6 py-2 text-sm font-semibold text-white shadow hover:brightness-110"
        style={`background:${GREEN}`}
        hx-post="/distribution/send"
        hx-include="#compose"
        hx-encoding="multipart/form-data"
        hx-target="#compose-status"
      >
        Send
      </button>
    </div>
  </section>
)

// Tabs and disclosure chevrons are CSS-only so checked
// recipients and typed text are never lost to a re-render
const COMPOSE_CSS = `
#tab-lists:checked ~ .pane-depts, #tab-depts:checked ~ .pane-lists { display: none }
#tab-lists:checked ~ .tabs [for=tab-lists], #tab-depts:checked ~ .tabs [for=tab-depts] { border-color: ${GREEN}; color: #222; font-weight: 600 }
summary::-webkit-details-marker { display: none }
details[open] > summary .chev { transform: rotate(180deg) }
#editor:empty::before { content: attr(data-placeholder); color: #9ca3af; font-style: italic }
`

// `to` pre-fills recipients, e.g. from Contacts → Email
export const ComposePage = ({ to = [] }: { to?: string[] }) => (
  <Shell path="/distribution/compose">
    <style>{raw(COMPOSE_CSS)}</style>
    <main id="compose" class="mt-3 flex flex-1 flex-col border-t border-gray-200 md:flex-row">
      <CollapsibleSide id="lists-collapsed" label="Lists" panel={<ListsPanel emails={to.join(', ')} />} />
      <MessageForm chips={resolveRecipients(to.join(','), [], []).chips} />
    </main>
    <script src={SCRIPTS.compose.url} defer />
  </Shell>
)
