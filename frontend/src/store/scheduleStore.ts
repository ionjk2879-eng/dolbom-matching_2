import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Calendar sharing toggles (ScheduleSettings). Schedules themselves live in careScheduleStore.
// Saved in this browser only: there is no backend API for these settings yet.
type ScheduleState = {
  shareWithFamily: boolean
  shareWithCenters: boolean
  setShareWithFamily: (v: boolean) => void
  setShareWithCenters: (v: boolean) => void
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set) => ({
      shareWithFamily: false,
      shareWithCenters: false,
      setShareWithFamily: (v) => set({ shareWithFamily: v }),
      setShareWithCenters: (v) => set({ shareWithCenters: v }),
    }),
    { name: 'schedule-share' },
  ),
)
