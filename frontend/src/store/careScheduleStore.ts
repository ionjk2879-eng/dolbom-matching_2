import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Child, RecurringSchedule, ScheduleException } from '../data/types'
import { fetchChildren, createChild, updateChild as apiUpdateChild, deleteChild, type ApiChild } from '../api/children'
import {
  fetchSchedules,
  createSchedule,
  updateSchedule as apiUpdateSchedule,
  deleteSchedule,
  fetchExceptions,
  createException,
  deleteException,
  type ApiScheduleException,
  type NewSchedule,
} from '../api/schedules'
import { useAuthStore } from './authStore'

function toChild(row: ApiChild): Child {
  return { id: row.id, name: row.name, grade: row.grade, commuteMinutes: row.commute_minutes }
}

// Postgres TIME comes back as 'HH:mm:ss'; the UI and gap math use 'HH:mm'
const hhmm = (t: string) => t.slice(0, 5)

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
    startTime: hhmm(row.start_time),
    endTime: hhmm(row.end_time),
  }
}

function toException(row: ApiScheduleException): ScheduleException {
  return {
    id: row.id,
    scheduleId: row.schedule_id,
    date: row.exception_date.slice(0, 10), // DATE가 ISO 타임스탬프로 직렬화돼 올 수 있음
    startTime: row.start_time && hhmm(row.start_time),
    endTime: row.end_time && hhmm(row.end_time),
    isCancelled: row.is_cancelled,
  }
}

type CareScheduleState = {
  children: Child[]
  schedules: RecurringSchedule[]
  exceptions: ScheduleException[]
  loaded: boolean
  // Last failed request's message; shown by StoreErrorBanner
  error: string | null
  clearError: () => void
  // Actions resolve to false on failure (and set `error`) instead of throwing
  loadAll: () => Promise<boolean>
  addChild: (c: Omit<Child, 'id'>) => Promise<boolean>
  updateChild: (id: string, c: Omit<Child, 'id'>) => Promise<boolean>
  removeChild: (id: string) => Promise<boolean>
  addSchedule: (s: Omit<RecurringSchedule, 'id'>) => Promise<boolean>
  updateSchedule: (id: string, s: Omit<RecurringSchedule, 'id'>) => Promise<boolean>
  removeSchedule: (id: string) => Promise<boolean>
  addException: (e: Omit<ScheduleException, 'id'>) => Promise<boolean>
  removeException: (id: string) => Promise<boolean>
}

// care_option_id는 백엔드 schedules 테이블에 없는 컬럼이라, 어떤 돌봄 옵션을 선택해서
// 생긴 일정인지는 여기 로컬(localStorage)에만 별도로 기록해서 GapMatchPanel 체크상태에 씀.
type CareOptionTagState = { careOptionIdBySchedule: Record<string, string> }

const useCareOptionTags = create<CareOptionTagState>()(
  persist(() => ({ careOptionIdBySchedule: {} }), { name: 'care-option-tags' }),
)

// ponytail: 백엔드에 title/memo 컬럼이 생기면 NewSchedule payload로 옮기고 이 저장소는 제거
type ScheduleNote = { title?: string; memo?: string }
type ScheduleNoteState = { noteBySchedule: Record<string, ScheduleNote> }
const useScheduleNotes = create<ScheduleNoteState>()(
  persist(() => ({ noteBySchedule: {} }), { name: 'schedule-notes' }),
)
function saveNote(id: string, { title, memo }: ScheduleNote) {
  const next = { ...useScheduleNotes.getState().noteBySchedule }
  if (title || memo) next[id] = { title, memo }
  else delete next[id]
  useScheduleNotes.setState({ noteBySchedule: next })
}

type ParentTagState = { parentLabelBySchedule: Record<string, 'mom' | 'dad'> }
const useParentTags = create<ParentTagState>()(
  persist(() => ({ parentLabelBySchedule: {} }), { name: 'parent-tags' }),
)
// Removes deleted schedules' local-only tags/notes
function dropLocalTags(ids: string[]) {
  const omit = <T,>(rec: Record<string, T>) => Object.fromEntries(Object.entries(rec).filter(([k]) => !ids.includes(k)))
  useCareOptionTags.setState((s) => ({ careOptionIdBySchedule: omit(s.careOptionIdBySchedule) }))
  useScheduleNotes.setState((s) => ({ noteBySchedule: omit(s.noteBySchedule) }))
  useParentTags.setState((s) => ({ parentLabelBySchedule: omit(s.parentLabelBySchedule) }))
}

const initialData ={ children: [], schedules: [], exceptions: [], loaded: false, error: null }

export const useCareScheduleStore = create<CareScheduleState>()((set, get) => {
  const attempt = async (fn: () => Promise<void>): Promise<boolean> => {
    try {
      await fn()
      return true
    } catch (err) {
      set({ error: (err as Error).message })
      return false
    }
  }

  return {
    ...initialData,
    clearError: () => set({ error: null }),

    loadAll: async () => {
      if (get().loaded) return true
      // If the user logs out or switches accounts mid-request, drop this response (data or error)
      // so it can't refill the store that the auth subscription below just cleared
      const userId = useAuthStore.getState().user?.id
      const stale = () => useAuthStore.getState().user?.id !== userId
      try {
        const [childRows, scheduleRows] = await Promise.all([fetchChildren(), fetchSchedules()])
        // ponytail: 예외 일정 GET이 일정별 라우트뿐이라 일정 수만큼 요청함 — 많아지면 백엔드에 일괄 조회 요청
        const exceptionRows = await Promise.all(scheduleRows.map((r) => fetchExceptions(r.id)))
        if (stale()) return false
        const tags = useCareOptionTags.getState().careOptionIdBySchedule
        const notes = useScheduleNotes.getState().noteBySchedule
        const parentTags = useParentTags.getState().parentLabelBySchedule
        set({
          children: childRows.map(toChild),
          schedules: scheduleRows.map((r) => ({ ...toRecurring(r), careOptionId: tags[r.id], ...notes[r.id], parentLabel: parentTags[r.id] })),
          exceptions: exceptionRows.flat().map(toException),
          loaded: true,
        })
        return true
      } catch (err) {
        if (!stale()) set({ error: (err as Error).message })
        return false
      }
    },

    addChild: (c) =>
      attempt(async () => {
        const row = await createChild({ name: c.name, grade: c.grade, commute_minutes: c.commuteMinutes })
        set((s) => ({ children: [...s.children, toChild(row)] }))
      }),

    updateChild: (id, c) =>
      attempt(async () => {
        const row = await apiUpdateChild(id, { name: c.name, grade: c.grade, commute_minutes: c.commuteMinutes })
        set((s) => ({ children: s.children.map((x) => (x.id === id ? toChild(row) : x)) }))
      }),

    removeChild: (id) =>
      attempt(async () => {
        await deleteChild(id)
        // The child's schedules (and their exceptions) go with it
        const removed = get().schedules.filter((sch) => sch.childId === id).map((sch) => sch.id)
        dropLocalTags(removed)
        set((s) => ({
          children: s.children.filter((c) => c.id !== id),
          schedules: s.schedules.filter((sch) => sch.childId !== id),
          exceptions: s.exceptions.filter((e) => !removed.includes(e.scheduleId)),
        }))
      }),

    addSchedule: (sch) =>
      attempt(async () => {
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
        saveNote(row.id, sch)
        if (sch.parentLabel) {
          const parentTags = useParentTags.getState().parentLabelBySchedule
          useParentTags.setState({ parentLabelBySchedule: { ...parentTags, [row.id]: sch.parentLabel } })
        }
        set((s) => ({
          schedules: [...s.schedules, { ...toRecurring(row), careOptionId: sch.careOptionId, title: sch.title, memo: sch.memo, parentLabel: sch.parentLabel }],
        }))
      }),

    updateSchedule: (id, sch) =>
      attempt(async () => {
        const payload: NewSchedule = {
          child_id: sch.childId,
          type: sch.type,
          days_of_week: sch.daysOfWeek,
          start_time: sch.startTime,
          end_time: sch.endTime,
        }
        const row = await apiUpdateSchedule(id, payload)
        const tags = { ...useCareOptionTags.getState().careOptionIdBySchedule }
        if (sch.careOptionId) tags[id] = sch.careOptionId
        else delete tags[id]
        useCareOptionTags.setState({ careOptionIdBySchedule: tags })
        const parentTags = { ...useParentTags.getState().parentLabelBySchedule }
        if (sch.parentLabel) parentTags[id] = sch.parentLabel
        else delete parentTags[id]
        useParentTags.setState({ parentLabelBySchedule: parentTags })
        saveNote(id, sch)
        set((s) => ({
          schedules: s.schedules.map((x) =>
            x.id === id ? { ...toRecurring(row), careOptionId: sch.careOptionId, title: sch.title, memo: sch.memo, parentLabel: sch.parentLabel } : x,
          ),
        }))
      }),

    removeSchedule: (id) =>
      attempt(async () => {
        await deleteSchedule(id)
        dropLocalTags([id])
        set((s) => ({
          schedules: s.schedules.filter((x) => x.id !== id),
          exceptions: s.exceptions.filter((x) => x.scheduleId !== id),
        }))
      }),

    addException: (e) =>
      attempt(async () => {
        const row = await createException(e.scheduleId, {
          exception_date: e.date,
          start_time: e.startTime,
          end_time: e.endTime,
          is_cancelled: e.isCancelled,
        })
        set((s) => ({ exceptions: [...s.exceptions, toException(row)] }))
      }),

    removeException: (id) =>
      attempt(async () => {
        const target = get().exceptions.find((x) => x.id === id)
        if (!target) return
        await deleteException(target.scheduleId, id)
        set((s) => ({ exceptions: s.exceptions.filter((x) => x.id !== id) }))
      }),
  }
})

// True until the first load finishes; false on failure so pages fall back to their empty state
export const useCareScheduleLoading = () => useCareScheduleStore((s) => !s.loaded && !s.error)

// Drop the previous user's data on logout or account switch
useAuthStore.subscribe((state, prev) => {
  if (state.user?.id !== prev.user?.id) useCareScheduleStore.setState(initialData)
})
