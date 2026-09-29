import { create } from 'zustand'

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

export const useMatchStore = create<MatchState>((set) => ({
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
}))
