import { create } from 'zustand'

type EventState = {
  applied: string[]
  toggleApply: (id: string) => void
}

export const useEventStore = create<EventState>((set) => ({
  applied: [],
  toggleApply: (id) =>
    set((s) => ({
      applied: s.applied.includes(id) ? s.applied.filter((x) => x !== id) : [...s.applied, id],
    })),
}))
