import { create } from 'zustand'
import type { Schedule } from '../data/types'
import {
  fetchSchedules,
  createSchedule,
  updateSchedule as apiUpdateSchedule,
  deleteSchedule,
  type NewSchedule,
} from '../api/schedules'

type ScheduleState = {
  schedules: Schedule[]
  loading: boolean
  error: string | null
  shareWithFamily: boolean
  shareWithCenters: boolean
  loadSchedules: () => Promise<void>
  addSchedule: (s: NewSchedule) => Promise<void>
  updateSchedule: (id: string, s: NewSchedule) => Promise<void>
  removeSchedule: (id: string) => Promise<void>
  setShareWithFamily: (v: boolean) => void
  setShareWithCenters: (v: boolean) => void
}

export const useScheduleStore = create<ScheduleState>()((set, get) => ({
  schedules: [],
  loading: false,
  error: null,
  shareWithFamily: false,
  shareWithCenters: false,
  loadSchedules: async () => {
    set({ loading: true, error: null })
    try {
      const schedules = await fetchSchedules()
      set({ schedules, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },
  addSchedule: async (s) => {
    const created = await createSchedule(s)
    set({ schedules: [...get().schedules, created] })
  },
  updateSchedule: async (id, s) => {
    const updated = await apiUpdateSchedule(id, s)
    set({ schedules: get().schedules.map((x) => (x.id === id ? updated : x)) })
  },
  removeSchedule: async (id) => {
    await deleteSchedule(id)
    set({ schedules: get().schedules.filter((x) => x.id !== id) })
  },
  setShareWithFamily: (v) => set({ shareWithFamily: v }),
  setShareWithCenters: (v) => set({ shareWithCenters: v }),
}))
