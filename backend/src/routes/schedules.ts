import { Hono } from 'hono'
import { createDb } from '../db/index'
import {
  getSchedulesByUser,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  createException,
  getExceptionsBySchedule,
  deleteException,
} from '../db/schedules'
import { requireAuth } from '../middleware/auth'
import type { Env } from '../types'
import type { AuthVariables } from '../middleware/auth'

const VALID_TYPES = ['child_school', 'parent_work', 'care'] as const
type ScheduleType = (typeof VALID_TYPES)[number]

const schedules = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

schedules.use('*', requireAuth)

schedules.get('/', async (c) => {
  const sql = createDb(c.env.DATABASE_URL)
  const rows = await getSchedulesByUser(sql, c.get('userId'))
  await sql.end()
  return c.json(rows)
})

schedules.post('/', async (c) => {
  const body = await c.req.json<{
    child_id?: string | null
    type: string
    days_of_week: number[]
    start_time: string
    end_time: string
  }>()

  if (!VALID_TYPES.includes(body.type as ScheduleType))
    return c.json({ error: 'type must be one of: child_school, parent_work, care' }, 400)
  if (!Array.isArray(body.days_of_week) || !body.start_time || !body.end_time)
    return c.json({ error: 'days_of_week, start_time, end_time are required' }, 400)

  const sql = createDb(c.env.DATABASE_URL)
  const row = await createSchedule(sql, {
    user_id: c.get('userId'),
    child_id: body.child_id ?? null,
    type: body.type as ScheduleType,
    days_of_week: body.days_of_week,
    start_time: body.start_time,
    end_time: body.end_time,
  })
  await sql.end()
  return c.json(row, 201)
})

schedules.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{
    child_id?: string | null
    type?: string
    days_of_week?: number[]
    start_time?: string
    end_time?: string
  }>()

  if (body.type !== undefined && !VALID_TYPES.includes(body.type as ScheduleType))
    return c.json({ error: 'type must be one of: child_school, parent_work, care' }, 400)

  const patch: Record<string, unknown> = {}
  if (body.type !== undefined) patch.type = body.type
  if ('child_id' in body) patch.child_id = body.child_id ?? null
  if (body.days_of_week !== undefined) patch.days_of_week = body.days_of_week
  if (body.start_time !== undefined) patch.start_time = body.start_time
  if (body.end_time !== undefined) patch.end_time = body.end_time

  if (Object.keys(patch).length === 0)
    return c.json({ error: 'No fields to update' }, 400)

  const sql = createDb(c.env.DATABASE_URL)
  const row = await updateSchedule(sql, id, c.get('userId'), patch as Parameters<typeof updateSchedule>[3])
  await sql.end()
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json(row)
})

schedules.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const sql = createDb(c.env.DATABASE_URL)
  const ok = await deleteSchedule(sql, id, c.get('userId'))
  await sql.end()
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
})

schedules.get('/:id/exceptions', async (c) => {
  const scheduleId = c.req.param('id')
  const sql = createDb(c.env.DATABASE_URL)
  const [owned] = await sql`SELECT id FROM schedules WHERE id = ${scheduleId} AND user_id = ${c.get('userId')}`
  if (!owned) { await sql.end(); return c.json({ error: 'Not found' }, 404) }
  const rows = await getExceptionsBySchedule(sql, scheduleId)
  await sql.end()
  return c.json(rows)
})

schedules.delete('/:id/exceptions/:exceptionId', async (c) => {
  const exceptionId = c.req.param('exceptionId')
  const sql = createDb(c.env.DATABASE_URL)
  const ok = await deleteException(sql, exceptionId, c.get('userId'))
  await sql.end()
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
})

schedules.post('/:id/exceptions', async (c) => {
  const scheduleId = c.req.param('id')
  const body = await c.req.json<{
    exception_date: string
    start_time?: string | null
    end_time?: string | null
    is_cancelled?: boolean
  }>()

  if (!body.exception_date)
    return c.json({ error: 'exception_date is required' }, 400)

  const sql = createDb(c.env.DATABASE_URL)
  const [owned] = await sql`SELECT id FROM schedules WHERE id = ${scheduleId} AND user_id = ${c.get('userId')}`
  if (!owned) { await sql.end(); return c.json({ error: 'Not found' }, 404) }

  const row = await createException(sql, {
    schedule_id: scheduleId,
    exception_date: body.exception_date,
    start_time: body.start_time ?? null,
    end_time: body.end_time ?? null,
    is_cancelled: body.is_cancelled ?? false,
  })
  await sql.end()
  return c.json(row, 201)
})

export default schedules
