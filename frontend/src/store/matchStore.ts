import { create } from 'zustand'

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

// Not persisted: a filter left over from a past visit made /find open empty; the region is
// filled from the user's location on each visit instead (useAutoRegion)
export const useMatchStore = create<MatchState>()((set) => ({
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
}))
