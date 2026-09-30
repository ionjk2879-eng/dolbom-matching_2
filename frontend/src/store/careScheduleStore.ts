import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Child, RecurringSchedule, ScheduleException } from '../data/types'

type CareScheduleState = {
  children: Child[]
  schedules: RecurringSchedule[]
  exceptions: ScheduleException[]
  addChild: (c: Omit<Child, 'id'>) => void
  removeChild: (id: string) => void
  addSchedule: (s: Omit<RecurringSchedule, 'id'>) => void
  updateSchedule: (id: string, s: Omit<RecurringSchedule, 'id'>) => void
  removeSchedule: (id: string) => void
  addException: (e: Omit<ScheduleException, 'id'>) => void
  removeException: (id: string) => void
}

export const useCareScheduleStore = create<CareScheduleState>()(
  persist(
    (set) => ({
      children: [],
      schedules: [],
      exceptions: [],
      addChild: (c) => set((s) => ({ children: [...s.children, { ...c, id: crypto.randomUUID() }] })),
      removeChild: (id) =>
        set((s) => ({
          children: s.children.filter((c) => c.id !== id),
          schedules: s.schedules.filter((sch) => sch.childId !== id),
        })),
      addSchedule: (sch) => set((s) => ({ schedules: [...s.schedules, { ...sch, id: crypto.randomUUID() }] })),
      updateSchedule: (id, sch) =>
        set((s) => ({ schedules: s.schedules.map((x) => (x.id === id ? { ...sch, id } : x)) })),
      removeSchedule: (id) => set((s) => ({ schedules: s.schedules.filter((x) => x.id !== id) })),
      addException: (e) => set((s) => ({ exceptions: [...s.exceptions, { ...e, id: crypto.randomUUID() }] })),
      removeException: (id) => set((s) => ({ exceptions: s.exceptions.filter((x) => x.id !== id) })),
    }),
    { name: 'care-schedule' },
  ),
)
