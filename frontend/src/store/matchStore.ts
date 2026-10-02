import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type MatchState = {
  area: string
  grade: string
  time: string
  setArea: (v: string) => void
  setGrade: (v: string) => void
  setTime: (v: string) => void
  reset: () => void
}

export const useMatchStore = create<MatchState>()(
  persist(
    (set) => ({
      area: '',
      grade: '',
      time: '',
      setArea: (v) => set({ area: v }),
      setGrade: (v) => set({ grade: v }),
      setTime: (v) => set({ time: v }),
      reset: () => set({ area: '', grade: '', time: '' }),
    }),
    { name: 'match' },
  ),
)
