import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createDb } from './db/index'
import auth from './routes/auth'
import schedulesRoute from './routes/schedules'
import childrenRoute from './routes/children'
import gapsRoute from './routes/gaps'
import type { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: [c.env.FRONTEND_URL, 'http://localhost:5173'].filter(Boolean),
    credentials: true,
  })
  return corsMiddleware(c, next)
})

app.route('/auth', auth)
app.route('/schedules', schedulesRoute)
app.route('/children', childrenRoute)
app.route('/', gapsRoute)

app.get('/', (c) => c.json({ message: 'dolbom-matching API' }))

app.get('/health', async (c) => {
  const db = createDb(c.env.DATABASE_URL)
  const result = await db`SELECT 1 AS ok`
  await db.end()
  return c.json({ status: 'ok', db: result[0].ok === 1 })
})

export default app
