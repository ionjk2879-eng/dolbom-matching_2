import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Schedule } from '../data/types'

type ScheduleState = {
  schedules: Schedule[]
  shareWithFamily: boolean
  shareWithCenters: boolean
  addSchedule: (s: Omit<Schedule, 'id'>) => void
  updateSchedule: (id: string, s: Omit<Schedule, 'id'>) => void
  removeSchedule: (id: string) => void
  setShareWithFamily: (v: boolean) => void
  setShareWithCenters: (v: boolean) => void
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set) => ({
      schedules: [],
      shareWithFamily: false,
      shareWithCenters: false,
      addSchedule: (s) => set((state) => ({ schedules: [...state.schedules, { ...s, id: crypto.randomUUID() }] })),
      updateSchedule: (id, s) =>
        set((state) => ({ schedules: state.schedules.map((x) => (x.id === id ? { ...s, id } : x)) })),
      removeSchedule: (id) => set((state) => ({ schedules: state.schedules.filter((x) => x.id !== id) })),
      setShareWithFamily: (v) => set({ shareWithFamily: v }),
      setShareWithCenters: (v) => set({ shareWithCenters: v }),
    }),
    { name: 'schedule' },
  ),
)
