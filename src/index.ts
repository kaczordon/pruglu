import { Hono } from 'hono'
import { logger } from 'hono/logger'
// Import with '.js' — Vercel compiles app.tsx to app.js but doesn't rewrite import paths
import htmxApp from './app.js'

const app = new Hono()

app.use('*', logger())

// Mount the app
app.route('/', htmxApp)

export default app
