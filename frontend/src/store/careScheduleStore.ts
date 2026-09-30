import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Child, RecurringSchedule, ScheduleException } from '../data/types'
import { fetchChildren, createChild, deleteChild, type ApiChild } from '../api/children'
import {
  fetchSchedules,
  createSchedule,
  updateSchedule as apiUpdateSchedule,
  deleteSchedule,
  type NewSchedule,
} from '../api/schedules'

function toChild(row: ApiChild): Child {
  return { id: row.id, name: row.name, grade: row.grade, commuteMinutes: row.commute_minutes }
}

function toRecurring(row: {
  id: string
  child_id: string | null
  type: RecurringSchedule['type']
  days_of_week: number[]
  start_time: string
  end_time: string
}): RecurringSchedule {
  return {
    id: row.id,
    childId: row.child_id,
    type: row.type,
    daysOfWeek: row.days_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
  }
}

type CareScheduleState = {
  children: Child[]
  schedules: RecurringSchedule[]
  exceptions: ScheduleException[]
  loaded: boolean
  loadAll: () => Promise<void>
  addChild: (c: Omit<Child, 'id'>) => Promise<void>
  removeChild: (id: string) => Promise<void>
  addSchedule: (s: Omit<RecurringSchedule, 'id'>) => Promise<void>
  updateSchedule: (id: string, s: Omit<RecurringSchedule, 'id'>) => Promise<void>
  removeSchedule: (id: string) => Promise<void>
  addException: (e: Omit<ScheduleException, 'id'>) => void
  removeException: (id: string) => void
}

// care_option_id는 백엔드 schedules 테이블에 없는 컬럼이라, 어떤 돌봄 옵션을 선택해서
// 생긴 일정인지는 여기 로컬(localStorage)에만 별도로 기록해서 GapMatchPanel 체크상태에 씀.
type CareOptionTagState = { careOptionIdBySchedule: Record<string, string> }

const useCareOptionTags = create<CareOptionTagState>()(
  persist(() => ({ careOptionIdBySchedule: {} }), { name: 'care-option-tags' }),
)

export const useCareScheduleStore = create<CareScheduleState>()((set, get) => ({
  children: [],
  schedules: [],
  exceptions: [],
  loaded: false,

  loadAll: async () => {
    if (get().loaded) return
    const [childRows, scheduleRows] = await Promise.all([fetchChildren(), fetchSchedules()])
    const tags = useCareOptionTags.getState().careOptionIdBySchedule
    set({
      children: childRows.map(toChild),
      schedules: scheduleRows.map((r) => ({ ...toRecurring(r), careOptionId: tags[r.id] })),
      loaded: true,
    })
  },

  addChild: async (c) => {
    const row = await createChild({ name: c.name, grade: c.grade, commute_minutes: c.commuteMinutes })
    set((s) => ({ children: [...s.children, toChild(row)] }))
  },

  removeChild: async (id) => {
    await deleteChild(id)
    set((s) => ({
      children: s.children.filter((c) => c.id !== id),
      schedules: s.schedules.filter((sch) => sch.childId !== id),
    }))
  },

  addSchedule: async (sch) => {
    const payload: NewSchedule = {
      child_id: sch.childId,
      type: sch.type,
      days_of_week: sch.daysOfWeek,
      start_time: sch.startTime,
      end_time: sch.endTime,
    }
    const row = await createSchedule(payload)
    if (sch.careOptionId) {
      const tags = useCareOptionTags.getState().careOptionIdBySchedule
      useCareOptionTags.setState({ careOptionIdBySchedule: { ...tags, [row.id]: sch.careOptionId } })
    }
    set((s) => ({ schedules: [...s.schedules, { ...toRecurring(row), careOptionId: sch.careOptionId }] }))
  },

  updateSchedule: async (id, sch) => {
    const payload: NewSchedule = {
      child_id: sch.childId,
      type: sch.type,
      days_of_week: sch.daysOfWeek,
      start_time: sch.startTime,
      end_time: sch.endTime,
    }
    const row = await apiUpdateSchedule(id, payload)
    set((s) => ({
      schedules: s.schedules.map((x) => (x.id === id ? { ...toRecurring(row), careOptionId: sch.careOptionId } : x)),
    }))
  },

  removeSchedule: async (id) => {
    await deleteSchedule(id)
    const tags = useCareOptionTags.getState().careOptionIdBySchedule
    if (id in tags) {
      const next = { ...tags }
      delete next[id]
      useCareOptionTags.setState({ careOptionIdBySchedule: next })
    }
    set((s) => ({ schedules: s.schedules.filter((x) => x.id !== id) }))
  },

  // 서버에 GET/DELETE 라우트가 아직 없어서(POST만 있음) 화면에서도 아직 안 씀 — 로컬 상태만 유지
  addException: (e) => set((s) => ({ exceptions: [...s.exceptions, { ...e, id: crypto.randomUUID() }] })),
  removeException: (id) => set((s) => ({ exceptions: s.exceptions.filter((x) => x.id !== id) })),
}))
