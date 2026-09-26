import { Hono } from 'hono'
import { logger } from 'hono/logger'
// 1. Notice the default import syntax without brackets
// 2. Added explicit file extension '.tsx' for Vercel's bundler
import htmxApp from './app.tsx' 

const app = new Hono()

app.use('*', logger())

// Mount the app
app.route('/', htmxApp)

export default app
