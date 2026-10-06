import { Hono } from 'hono'
import { createDb } from '../db/index'
import { getActiveSchedulesForDate } from '../db/schedules'
import { getChildrenByUser } from '../db/children'
import { findCareProviders, findCareProviderById, findAllCareProviders } from '../db/care_providers'
import { requireAuth } from '../middleware/auth'
import type { Env } from '../types'
import type { AuthVariables } from '../middleware/auth'

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

// HH:MM[:SS] → minutes
function toMin(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function toTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

// Subtract care intervals from a gap interval, returns remaining gaps
function subtractCare(
  gap: { start: number; end: number },
  care: { start: number; end: number }[]
): { start: number; end: number }[] {
  let result = [gap]
  for (const c of care) {
    result = result.flatMap(r => {
      if (c.end <= r.start || c.start >= r.end) return [r]
      const parts = []
      if (r.start < c.start) parts.push({ start: r.start, end: c.start })
      if (r.end > c.end) parts.push({ start: c.end, end: r.end })
      return parts
    })
  }
  return result
}

// GET /gaps?date=YYYY-MM-DD  (인증 필요)
app.get('/gaps', requireAuth, async (c) => {
  const date = c.req.query('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return c.json({ error: 'date query param required (YYYY-MM-DD)' }, 400)

  const userId = c.get('userId')
  const sql = createDb(c.env.DATABASE_URL)

  const [schedules, children] = await Promise.all([
    getActiveSchedulesForDate(sql, userId, date),
    getChildrenByUser(sql, userId),
  ])
  await sql.end()

  // ponytail: parentLabel(엄마/아빠 구분)이 DB에 없고 localStorage에만 있어서
  // 맞벌이 교집합 계산 불가 — 프론트 computeGaps()와 동작 다름.
  // 해결: schedules 테이블에 parent_label 컬럼 추가 필요.
  const workSchedules = schedules.filter(s => s.type === 'parent_work')
  const careSchedules = schedules.filter(s => s.type === 'care')

  const result = children.map(child => {
    const schoolSchedule = schedules.find(
      s => s.type === 'child_school' && s.child_id === child.id
    )

    if (!schoolSchedule || workSchedules.length === 0) {
      return { child_id: child.id, child_name: child.name, grade: child.grade, gaps: [] }
    }

    const homeTime = toMin(schoolSchedule.end_time) + child.commute_minutes
    const childCare = careSchedules
      .filter(s => s.child_id === child.id)
      .map(s => ({ start: toMin(s.start_time), end: toMin(s.end_time) }))

    const gaps = workSchedules.flatMap(work => {
      const workEnd = toMin(work.end_time)
      if (homeTime >= workEnd) return []
      return subtractCare({ start: homeTime, end: workEnd }, childCare)
    })

    return {
      child_id: child.id,
      child_name: child.name,
      grade: child.grade,
      gaps: gaps.map(g => ({ start: toTime(g.start), end: toTime(g.end) })),
    }
  })

  return c.json(result)
})

// GET /care-options/:id  (공개 API)
app.get('/care-options/:id', async (c) => {
  const id = c.req.param('id')
  const sql = createDb(c.env.DATABASE_URL)
  const [provider] = await findCareProviderById(sql, id)
  await sql.end()
  if (!provider) return c.json({ error: 'Not found' }, 404)
  return c.json(provider)
})

// GET /care-options?start=HH:MM&end=HH:MM&grade=N  (공개 API — 인증 불필요)
// start/end/grade 없으면 전체 반환 (탐색 모드), 있으면 시간·학년 필터 (공백 매칭)
app.get('/care-options', async (c) => {
  const { start, end, grade } = c.req.query()
  const sql = createDb(c.env.DATABASE_URL)

  if (!start || !end || !grade) {
    const providers = await findAllCareProviders(sql)
    await sql.end()
    return c.json(providers)
  }

  const gradeNum = Number(grade)
  if (!Number.isInteger(gradeNum) || gradeNum < 1 || gradeNum > 6) {
    await sql.end()
    return c.json({ error: 'grade must be an integer between 1 and 6' }, 400)
  }

  const providers = await findCareProviders(sql, start, end, gradeNum)
  await sql.end()
  return c.json(providers)
})

export default app
