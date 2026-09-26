import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) =>
  c.html('<h1>production packets</h1>')
);

app.get('/api/health', (c) =>
  c.json({ ok: true })
);

export default app;