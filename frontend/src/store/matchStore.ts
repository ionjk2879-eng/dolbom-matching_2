import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type MatchState = {
  area: string
  grade: string
  time: string
  selectedDates: string[]
  need: string
  setArea: (v: string) => void
  setGrade: (v: string) => void
  setTime: (v: string) => void
  setNeed: (v: string) => void
  toggleDate: (date: string) => void
  setWeekdays: (dates: string[]) => void
}

export const useMatchStore = create<MatchState>()(
  persist(
    (set) => ({
      area: '',
      grade: '',
      time: '',
      selectedDates: [],
      need: '',
      setArea: (v) => set({ area: v }),
      setGrade: (v) => set({ grade: v }),
      setTime: (v) => set({ time: v }),
      setNeed: (v) => set({ need: v }),
      toggleDate: (date) =>
        set((s) => ({
          selectedDates: s.selectedDates.includes(date)
            ? s.selectedDates.filter((d) => d !== date)
            : [...s.selectedDates, date],
        })),
      setWeekdays: (dates) => set({ selectedDates: dates }),
    }),
    {
      name: 'match',
      // Drop saved dates that have already passed
      merge: (persisted, current) => {
        const saved = persisted as Partial<MatchState>
        const d = new Date()
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        return { ...current, ...saved, selectedDates: (saved.selectedDates ?? []).filter((date) => date >= today) }
      },
    },
  ),
)
