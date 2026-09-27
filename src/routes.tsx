import { Hono, type Context } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { Layout } from './components/layout.tsx'
import { Dashboard, FilesPanel, type FilesTab } from './components/dashboard.tsx'
import { ComposePage, TemplateContent, ToField, resolveRecipients } from './components/compose.tsx'
import { MessageView, RecipientRows, SentList, SentPage, filterDeliveries } from './components/sent.tsx'
import { SECURITY_GROUPS, SENT, deliveriesFor, findContact, findSent } from './data.ts'
import { ContactRows, ContactsPage, InviteDialog, searchContacts } from './components/contacts.tsx'
import { Toast } from './components/feedback.tsx'
import { SCRIPTS } from './static-assets.ts'
import { getGroups, toGroup } from './store.ts'
import { ALL_CONTACTS, addMembers, createList, duplicateList, mergeLists, removeMembers, type Result } from './lists.ts'
import {
  ALL_GROUP,
  AddListDialog,
  DuplicateDialog,
  ListView,
  ListsNav,
  ListsPage,
  MergeDialog,
  listUrl,
  type ListTab,
} from './components/lists.tsx'
import { ToastOob } from './components/feedback.tsx'

const app = new Hono()

// Production Middleware
app.use(
    '*',
    secureHeaders({
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        // Allow scripts from self, unpkg.com (HTMX), and jsdelivr.net (UnoCSS)
        scriptSrc: ["'self'", 'https://unpkg.com', 'https://cdn.jsdelivr.net', "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        // Images pasted into the compose editor can come from any https URL
        imgSrc: ["'self'", 'https:', 'data:'],
      },
    })
  )

// 1. Initial Page Load
app.get('/', (c) => {
  return c.html(
    <Layout title="Basecamp">
      <Dashboard />
    </Layout>
  )
})

app.get('/dashboard', (c) => c.redirect('/'))

app.get('/distribution', (c) => c.redirect('/distribution/compose'))

app.get('/distribution/compose', async (c) => {
  return c.html(
    <Layout title="Compose">
      <ComposePage to={c.req.queries('to') ?? []} lists={await getGroups()} />
    </Layout>
  )
})

app.get('/contacts', async (c) => {
  return c.html(
    <Layout title="Contacts">
      <ContactsPage q={c.req.query('q') ?? ''} lists={await getGroups()} />
    </Layout>
  )
})

// ---- Distribution lists ----------------------------------------------------------------

const findList = async (id: string) =>
  id === ALL_CONTACTS ? ALL_GROUP : (await getGroups()).find((l) => l.id === id)

// htmx sets document.title from a <title> in a partial response, so the tab follows the list
const listTitle = (list: { name: string }) => `${list.name} · Lists`
const ListTitle = ({ list }: { list: { name: string } }) => <title>{listTitle(list)}</title>

const tabOf = (c: Context): ListTab => (c.req.query('tab') === 'non-members' ? 'non-members' : 'members')

app.get('/distribution/lists', (c) => c.redirect(listUrl(ALL_CONTACTS)))
app.get('/contacts/lists', (c) => c.redirect(listUrl(ALL_CONTACTS)))

app.get('/distribution/lists/:id{[a-z0-9-]+}', async (c) => {
  const lists = await getGroups()
  const list = await findList(c.req.param('id'))
  if (!list) return c.redirect(listUrl(ALL_CONTACTS))
  return c.html(
    <Layout title={listTitle(list)}>
      <ListsPage lists={lists} list={list} tab={tabOf(c)} />
    </Layout>
  )
})

app.get('/distribution/sent', (c) => {
  return c.html(
    <Layout title="Sent">
      <SentPage message={SENT[0]} />
    </Layout>
  )
})

app.get('/distribution/sent/:id{[0-9]+}', (c) => {
  const message = findSent(Number(c.req.param('id')))
  if (!message) return c.redirect('/distribution/sent')
  return c.html(
    <Layout title={message.title}>
      <SentPage message={message} />
    </Layout>
  )
})

const script = (source: string) => (c: Context) =>
  c.body(source, 200, {
    'Content-Type': 'text/javascript; charset=utf-8',
    // URLs carry a content fingerprint (?v=…), so a cached copy is never stale
    'Cache-Control': 'public, max-age=31536000, immutable',
  })

app.get('/static/app.js', script(SCRIPTS.app.source))
app.get('/static/compose.js', script(SCRIPTS.compose.source))

// 2. HTMX Partial Swap Endpoints
app.get('/partials/files', (c) => {
  const tab: FilesTab = c.req.query('tab') === 'forms' ? 'forms' : 'files'
  const page = Number.parseInt(c.req.query('page') ?? '0', 10) || 0
  return c.html(<FilesPanel tab={tab} page={page} />)
})

// Form fields arrive as string | File | (string | File)[]; keep just the strings
const strings = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [value]).filter((v): v is string => typeof v === 'string')

app.post('/partials/compose/recipients', async (c) => {
  const form = await c.req.parseBody({ all: true })
  const { chips } = resolveRecipients(await getGroups(), strings(form.emails).join(','), strings(form.groups), strings(form.members))
  return c.html(<ToField chips={chips} />)
})

app.get('/partials/compose/template', (c) => {
  return c.html(<TemplateContent id={c.req.query('template') ?? ''} />)
})

app.post('/distribution/send', async (c) => {
  const form = await c.req.parseBody({ all: true })
  const { count } = resolveRecipients(await getGroups(), strings(form.emails).join(','), strings(form.groups), strings(form.members))
  const subject = strings(form.subject)[0]?.trim() ?? ''
  const files = (Array.isArray(form.attachments) ? form.attachments : [form.attachments]).filter(
    (f) => f instanceof File && f.size > 0
  ).length

  if (count === 0) return c.html(<span class="text-red-600">Add at least one recipient.</span>)
  if (!subject) return c.html(<span class="text-red-600">Add a subject.</span>)
  // Delivery isn't wired up yet — confirm what would be sent
  return c.html(
    <span class="text-gray-600">
      Ready to send “{subject}” to {count} recipient{count === 1 ? '' : 's'}
      {files ? ` with ${files} attachment${files === 1 ? '' : 's'}` : ''}. Sending isn't connected yet.
    </span>
  )
})

// Registered before /partials/sent/:id so "list" isn't read as an id
app.get('/partials/sent/list', (c) => {
  // htmx sends the page URL, which holds the message being viewed after hx-push-url
  const viewing = c.req.header('HX-Current-URL')?.match(/\/distribution\/sent\/(\d+)/)?.[1]
  const page = Number.parseInt(c.req.query('page') ?? '0', 10) || 0
  return c.html(<SentList q={c.req.query('q') ?? ''} page={page} selectedId={viewing ? Number(viewing) : SENT[0].id} />)
})

app.get('/partials/sent/:id{[0-9]+}', (c) => {
  const message = findSent(Number(c.req.param('id')))
  if (!message) return c.notFound()
  return c.html(<MessageView message={message} />)
})

app.get('/partials/sent/:id{[0-9]+}/recipients', (c) => {
  const message = findSent(Number(c.req.param('id')))
  if (!message) return c.notFound()
  return c.html(<RecipientRows deliveries={filterDeliveries(deliveriesFor(message), c.req.query('q') ?? '')} />)
})

app.get('/partials/contacts', async (c) => {
  const lists = await getGroups()
  return c.html(<ContactRows contacts={searchContacts(c.req.query('q') ?? '', lists)} lists={lists} />)
})

app.get('/partials/contacts/:id{[0-9]+}/invite', (c) => {
  const contact = findContact(Number(c.req.param('id')))
  if (!contact) return c.notFound()
  return c.html(<InviteDialog contact={contact} />)
})

app.post('/contacts/:id{[0-9]+}/invite', async (c) => {
  const contact = findContact(Number(c.req.param('id')))
  if (!contact) return c.notFound()
  const { group } = await c.req.parseBody()
  if (!SECURITY_GROUPS.includes(group as (typeof SECURITY_GROUPS)[number])) {
    // Keep the dialog open and show the problem inside it instead of adding a toast
    c.header('HX-Retarget', '#dialog-error')
    c.header('HX-Reswap', 'innerHTML')
    return c.html('Choose a security group.')
  }
  // Delivery isn't wired up yet; the server-sent event tells app.js to close the dialog
  c.header('HX-Trigger', 'close-dialog')
  return c.html(<Toast message={`Invite sent to ${contact.email} (${group})`} />)
})

app.get('/partials/lists/dialog/add', (c) => c.html(<AddListDialog />))

app.get('/partials/lists/:id{[a-z0-9-]+}', async (c) => {
  const list = await findList(c.req.param('id'))
  if (!list) return c.notFound()
  return c.html(
    <>
      <ListTitle list={list} />
      <ListView list={list} tab={tabOf(c)} />
    </>
  )
})

app.get('/partials/lists/:id{[a-z0-9-]+}/dialog/duplicate', async (c) => {
  const list = await findList(c.req.param('id'))
  if (!list) return c.notFound()
  return c.html(<DuplicateDialog list={list} />)
})

app.get('/partials/lists/:id{[a-z0-9-]+}/dialog/merge', async (c) => {
  const list = await findList(c.req.param('id'))
  if (!list || list.id === ALL_CONTACTS) return c.notFound()
  return c.html(<MergeDialog list={list} lists={await getGroups()} />)
})

// Shared reply for every list change. Dialog errors go into #dialog-error; on success
// the chosen list replaces #list-view, the left panel refreshes its counts
// out-of-band, a toast appears, the URL follows along and any open dialog closes.
const listChanged = async (c: Context, result: Result, tab: ListTab, message: (name: string) => string) => {
  if (!result.ok) {
    c.header('HX-Retarget', '#dialog-error')
    c.header('HX-Reswap', 'innerHTML')
    return c.html(result.error)
  }
  c.header('HX-Push-Url', listUrl(result.list.id, tab))
  c.header('HX-Trigger', 'close-dialog')
  const group = toGroup(result.list)
  return c.html(
    <>
      <ListTitle list={group} />
      <ListView list={group} tab={tab} />
      <ListsNav lists={await getGroups()} selectedId={group.id} oob />
      <ToastOob message={message(group.name)} />
    </>
  )
}

const people = (n: number) => (n === 1 ? '1 person' : `${n} people`)

app.post('/distribution/lists', async (c) => {
  const { name } = await c.req.parseBody()
  return listChanged(c, await createList(name), 'members', (n) => `Distribution List ${n} added`)
})

app.post('/distribution/lists/:id{[a-z0-9-]+}/duplicate', async (c) => {
  const { name } = await c.req.parseBody()
  return listChanged(c, await duplicateList(c.req.param('id'), name), 'members', (n) => `Duplicated as ${n}`)
})

app.post('/distribution/lists/:id{[a-z0-9-]+}/merge', async (c) => {
  const { other, mode, name } = await c.req.parseBody()
  return listChanged(c, await mergeLists(c.req.param('id'), other, mode, name), 'members', (n) => `Lists merged into ${n}`)
})

// Add/remove selected people. Checkbox values arrive as ids=3&ids=17…
const selectedIds = async (c: Context) =>
  strings((await c.req.parseBody({ all: true })).ids).map(Number).filter(Number.isInteger)

const bulkChange = (action: 'add' | 'remove') => async (c: Context) => {
  const id = c.req.param('id')!
  const ids = await selectedIds(c)
  const tab: ListTab = action === 'add' ? 'non-members' : 'members'
  if (ids.length === 0) {
    // Nothing to do: leave the view alone and just explain
    c.header('HX-Reswap', 'none')
    return c.html(<ToastOob message="Select at least one person first." tone="info" />)
  }
  const result = await (action === 'add' ? addMembers(id, ids) : removeMembers(id, ids))
  if (!result.ok) {
    c.header('HX-Reswap', 'none')
    return c.html(<ToastOob message={result.error} tone="error" />)
  }
  const changed = result.changed ?? 0
  return listChanged(c, result, tab, (n) =>
    action === 'add' ? `${people(changed)} added to ${n}` : `${people(changed)} removed from ${n}`
  )
}

app.post('/distribution/lists/:id{[a-z0-9-]+}/members/add', bulkChange('add'))
app.post('/distribution/lists/:id{[a-z0-9-]+}/members/remove', bulkChange('remove'))

// CSV of a list's members. Cells starting with = + - @ are prefixed so spreadsheet
// apps don't run them as formulas.
const csvCell = (value: string) => {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}

app.get('/distribution/lists/:id{[a-z0-9-]+}/export.csv', async (c) => {
  const list = await findList(c.req.param('id'))
  if (!list) return c.notFound()
  const rows = [['Name', 'Email', 'Department', 'Position'], ...list.members.map((m) => [m.name, m.email, m.department, m.role])]
  const filename = `${list.name.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'list'}.csv`
  return c.body(rows.map((r) => r.map(csvCell).join(',')).join('\r\n'), 200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
  })
})

export default app
