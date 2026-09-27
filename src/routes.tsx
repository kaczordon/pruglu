import { Hono, type Context } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { Layout } from './components/layout.tsx'
import { Dashboard, FilesPanel, type FilesTab } from './components/dashboard.tsx'
import { ComposePage, TemplateContent, ToField, resolveRecipients } from './components/compose.tsx'
import { MessageView, RecipientRows, SentList, SentPage, filterDeliveries } from './components/sent.tsx'
import { SECURITY_GROUPS, SENT, deliveriesFor, findContact, findSent } from './data.ts'
import { ContactRows, ContactsPage, InviteDialog, Toast, searchContacts } from './components/contacts.tsx'
import { SCRIPTS } from './static-assets.ts'

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

app.get('/distribution/compose', (c) => {
  return c.html(
    <Layout title="Compose">
      <ComposePage to={c.req.queries('to') ?? []} />
    </Layout>
  )
})

app.get('/contacts', (c) => {
  return c.html(
    <Layout title="Contacts">
      <ContactsPage q={c.req.query('q') ?? ''} />
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
  const { chips } = resolveRecipients(strings(form.emails).join(','), strings(form.groups), strings(form.members))
  return c.html(<ToField chips={chips} />)
})

app.get('/partials/compose/template', (c) => {
  return c.html(<TemplateContent id={c.req.query('template') ?? ''} />)
})

app.post('/distribution/send', async (c) => {
  const form = await c.req.parseBody({ all: true })
  const { count } = resolveRecipients(strings(form.emails).join(','), strings(form.groups), strings(form.members))
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

app.get('/partials/contacts', (c) => {
  return c.html(<ContactRows contacts={searchContacts(c.req.query('q') ?? '')} />)
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
    c.header('HX-Retarget', '#invite-error')
    c.header('HX-Reswap', 'innerHTML')
    return c.html('Choose a security group.')
  }
  // Delivery isn't wired up yet; the server-sent event tells app.js to close the dialog
  c.header('HX-Trigger', 'close-dialog')
  return c.html(<Toast message={`Invite sent to ${contact.email} (${group})`} />)
})

export default app
