import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { Layout } from './components/layout.js'
import { Dashboard, FilesPanel, type FilesTab } from './components/dashboard.js'
import { Sidebar } from './components/sidebar.js'

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

// 2. HTMX Partial Swap Endpoints
app.get('/partials/sidebar', (c) => {
  return c.html(<Sidebar open={c.req.query('open') === 'true'} />)
})

app.get('/partials/files', (c) => {
  const tab: FilesTab = c.req.query('tab') === 'forms' ? 'forms' : 'files'
  const page = Number.parseInt(c.req.query('page') ?? '0', 10) || 0
  return c.html(<FilesPanel tab={tab} page={page} />)
})

export default app
