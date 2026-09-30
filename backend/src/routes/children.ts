import { Hono } from 'hono'
import { createDb } from '../db/index'
import { getChildrenByUser, createChild, updateChild, deleteChild } from '../db/children'
import { requireAuth } from '../middleware/auth'
import type { Env } from '../types'
import type { AuthVariables } from '../middleware/auth'

const children = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

children.use('*', requireAuth)

children.get('/', async (c) => {
  const sql = createDb(c.env.DATABASE_URL)
  const rows = await getChildrenByUser(sql, c.get('userId'))
  await sql.end()
  return c.json(rows)
})

children.post('/', async (c) => {
  const body = await c.req.json<{
    name: string
    grade: number
    commute_minutes?: number
  }>()

  if (!body.name || body.grade == null)
    return c.json({ error: 'name, grade are required' }, 400)
  if (body.grade < 1 || body.grade > 6)
    return c.json({ error: 'grade must be between 1 and 6' }, 400)

  const sql = createDb(c.env.DATABASE_URL)
  const row = await createChild(sql, {
    user_id: c.get('userId'),
    name: body.name,
    grade: body.grade,
    commute_minutes: body.commute_minutes ?? 20,
  })
  await sql.end()
  return c.json(row, 201)
})

children.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{
    name?: string
    grade?: number
    commute_minutes?: number
  }>()

  if (body.grade !== undefined && (body.grade < 1 || body.grade > 6))
    return c.json({ error: 'grade must be between 1 and 6' }, 400)

  const patch: Record<string, unknown> = {}
  if (body.name !== undefined) patch.name = body.name
  if (body.grade !== undefined) patch.grade = body.grade
  if (body.commute_minutes !== undefined) patch.commute_minutes = body.commute_minutes

  if (Object.keys(patch).length === 0)
    return c.json({ error: 'No fields to update' }, 400)

  const sql = createDb(c.env.DATABASE_URL)
  const row = await updateChild(sql, id, c.get('userId'), patch as Parameters<typeof updateChild>[3])
  await sql.end()
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json(row)
})

children.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const sql = createDb(c.env.DATABASE_URL)
  const ok = await deleteChild(sql, id, c.get('userId'))
  await sql.end()
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
})

export default children
