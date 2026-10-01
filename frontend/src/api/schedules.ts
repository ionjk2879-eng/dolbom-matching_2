import { apiFetch } from './client'
import type { Schedule, ScheduleType } from '../data/types'

export type NewSchedule = {
  child_id: string | null
  type: ScheduleType
  days_of_week: number[]
  start_time: string
  end_time: string
}

export async function fetchSchedules(): Promise<Schedule[]> {
  const res = await apiFetch('/schedules')
  if (!res.ok) throw new Error('일정을 불러오지 못했어요')
  return res.json()
}

export async function createSchedule(data: NewSchedule): Promise<Schedule> {
  const res = await apiFetch('/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('일정을 등록하지 못했어요')
  return res.json()
}

export async function updateSchedule(id: string, data: NewSchedule): Promise<Schedule> {
  const res = await apiFetch(`/schedules/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('일정을 수정하지 못했어요')
  return res.json()
}

export async function deleteSchedule(id: string): Promise<void> {
  const res = await apiFetch(`/schedules/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('일정을 삭제하지 못했어요')
}

export type ApiScheduleException = {
  id: string
  schedule_id: string
  exception_date: string
  start_time: string | null
  end_time: string | null
  is_cancelled: boolean
}

export type NewScheduleException = Pick<ApiScheduleException, 'exception_date' | 'start_time' | 'end_time' | 'is_cancelled'>

export async function fetchExceptions(scheduleId: string): Promise<ApiScheduleException[]> {
  const res = await apiFetch(`/schedules/${scheduleId}/exceptions`)
  if (!res.ok) throw new Error('예외 일정을 불러오지 못했어요')
  return res.json()
}

export async function createException(scheduleId: string, data: NewScheduleException): Promise<ApiScheduleException> {
  const res = await apiFetch(`/schedules/${scheduleId}/exceptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('예외 일정을 등록하지 못했어요')
  return res.json()
}

export async function deleteException(scheduleId: string, exceptionId: string): Promise<void> {
  const res = await apiFetch(`/schedules/${scheduleId}/exceptions/${exceptionId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('예외 일정을 삭제하지 못했어요')
}
