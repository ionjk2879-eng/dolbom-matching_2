import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Schedule } from '../data/types'

type ScheduleState = {
  schedules: Schedule[]
  shareWithFamily: boolean
  shareWithCenters: boolean
  addSchedule: (s: Omit<Schedule, 'id'>) => void
  addRepeating: (s: Omit<Schedule, 'id' | 'date' | 'repeatId'>, dates: string[]) => void
  updateSchedule: (id: string, s: Omit<Schedule, 'id'>) => void
  removeSchedule: (id: string) => void
  removeRepeat: (repeatId: string) => void
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
      addRepeating: (s, dates) => {
        const repeatId = crypto.randomUUID()
        set((state) => ({
          schedules: [...state.schedules, ...dates.map((date) => ({ ...s, date, repeatId, id: crypto.randomUUID() }))],
        }))
      },
      updateSchedule: (id, s) =>
        set((state) => ({ schedules: state.schedules.map((x) => (x.id === id ? { ...x, ...s, id } : x)) })),
      removeSchedule: (id) => set((state) => ({ schedules: state.schedules.filter((x) => x.id !== id) })),
      removeRepeat: (repeatId) =>
        set((state) => ({ schedules: state.schedules.filter((x) => x.repeatId !== repeatId) })),
      setShareWithFamily: (v) => set({ shareWithFamily: v }),
      setShareWithCenters: (v) => set({ shareWithCenters: v }),
    }),
    { name: 'schedule' },
  ),
)
