import type { Db } from './index'

export type Schedule = {
  id: string
  user_id: string
  child_id: string | null
  type: 'child_school' | 'parent_work' | 'care'
  days_of_week: number[]
  start_time: string
  end_time: string
  created_at: string
}

export type ScheduleException = {
  id: string
  schedule_id: string
  exception_date: string
  start_time: string | null
  end_time: string | null
  is_cancelled: boolean
  created_at: string
}

export const getSchedulesByUser = (sql: Db, userId: string) =>
  sql<Schedule[]>`SELECT * FROM schedules WHERE user_id = ${userId} ORDER BY created_at`

export async function createSchedule(
  sql: Db,
  data: Pick<Schedule, 'user_id' | 'child_id' | 'type' | 'days_of_week' | 'start_time' | 'end_time'>
): Promise<Schedule> {
  const [row] = await sql<Schedule[]>`INSERT INTO schedules ${sql(data)} RETURNING *`
  return row
}

export async function updateSchedule(
  sql: Db,
  id: string,
  userId: string,
  patch: Partial<Pick<Schedule, 'child_id' | 'type' | 'days_of_week' | 'start_time' | 'end_time'>>
): Promise<Schedule | null> {
  const [row] = await sql<Schedule[]>`
    UPDATE schedules SET ${sql(patch)} WHERE id = ${id} AND user_id = ${userId} RETURNING *
  `
  return row ?? null
}

export async function deleteSchedule(sql: Db, id: string, userId: string): Promise<boolean> {
  const result = await sql`DELETE FROM schedules WHERE id = ${id} AND user_id = ${userId}`
  return result.count > 0
}

export type ActiveSchedule = Schedule & { exc_start: string | null; exc_end: string | null }

export async function getActiveSchedulesForDate(
  sql: Db,
  userId: string,
  date: string // YYYY-MM-DD
): Promise<ActiveSchedule[]> {
  const rows = await sql<ActiveSchedule[]>`
    SELECT s.*, se.start_time AS exc_start, se.end_time AS exc_end
    FROM schedules s
    LEFT JOIN schedule_exceptions se
      ON se.schedule_id = s.id AND se.exception_date = ${date}::date
    WHERE s.user_id = ${userId}
      AND s.days_of_week @> ARRAY[(EXTRACT(DOW FROM ${date}::date))::int]
      AND (se.is_cancelled IS NULL OR se.is_cancelled = FALSE)
  `
  return rows.map(r => ({
    ...r,
    start_time: r.exc_start ?? r.start_time,
    end_time: r.exc_end ?? r.end_time,
  }))
}

export async function createException(
  sql: Db,
  data: Pick<ScheduleException, 'schedule_id' | 'exception_date' | 'start_time' | 'end_time' | 'is_cancelled'>
): Promise<ScheduleException> {
  const [row] = await sql<ScheduleException[]>`INSERT INTO schedule_exceptions ${sql(data)} RETURNING *`
  return row
}

export const getExceptionsBySchedule = (sql: Db, scheduleId: string) =>
  sql<ScheduleException[]>`SELECT * FROM schedule_exceptions WHERE schedule_id = ${scheduleId} ORDER BY exception_date`

export async function deleteException(sql: Db, exceptionId: string, userId: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM schedule_exceptions se
    USING schedules s
    WHERE se.id = ${exceptionId} AND se.schedule_id = s.id AND s.user_id = ${userId}
  `
  return result.count > 0
}
