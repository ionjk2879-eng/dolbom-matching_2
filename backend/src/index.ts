import { Hono } from 'hono'
import { createDb } from './db/index'

type Bindings = {
  DATABASE_URL: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => c.json({ message: 'dolbom-matching API' }))

app.get('/health', async (c) => {
  const db = createDb(c.env.DATABASE_URL)
  const result = await db`SELECT 1 AS ok`
  await db.end()
  return c.json({ status: 'ok', db: result[0].ok === 1 })
})

export default app
