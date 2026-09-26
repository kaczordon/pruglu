import { Hono } from 'hono'
import { logger } from 'hono/logger'
// '.tsx' import is rewritten to '.js' when tsc builds dist/ (rewriteRelativeImportExtensions)
import htmxApp from './routes.tsx'

const app = new Hono()

app.use('*', logger())

// Mount the app
app.route('/', htmxApp)

export default app
