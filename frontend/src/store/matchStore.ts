import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type MatchState = {
  grade: string
  time: string
  setGrade: (v: string) => void
  setTime: (v: string) => void
  reset: () => void
}

export const useMatchStore = create<MatchState>()(
  persist(
    (set) => ({
      grade: '',
      time: '',
      setGrade: (v) => set({ grade: v }),
      setTime: (v) => set({ time: v }),
      reset: () => set({ grade: '', time: '' }),
    }),
    { name: 'match' },
  ),
)
