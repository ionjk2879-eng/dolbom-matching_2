import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type MatchState = {
  grade: string
  time: string
  region: string
  district: string
  costFilter: 'all' | 'free' | 'paid'
  setGrade: (v: string) => void
  setTime: (v: string) => void
  setRegion: (v: string) => void
  setDistrict: (v: string) => void
  setCostFilter: (v: 'all' | 'free' | 'paid') => void
  reset: () => void
}

export const useMatchStore = create<MatchState>()(
  persist(
    (set) => ({
      grade: '',
      time: '',
      region: '',
      district: '',
      costFilter: 'all',
      setGrade: (v) => set({ grade: v }),
      setTime: (v) => set({ time: v }),
      setRegion: (v) => set({ region: v, district: '' }),
      setDistrict: (v) => set({ district: v }),
      setCostFilter: (v) => set({ costFilter: v }),
      reset: () => set({ grade: '', time: '', region: '', district: '', costFilter: 'all' }),
    }),
    { name: 'match' },
  ),
)
