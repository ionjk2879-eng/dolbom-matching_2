import { create } from 'zustand'

// Calendar sharing toggles (ScheduleSettings). Schedules themselves live in careScheduleStore.
// Not persisted yet: there is no backend API for these settings.
type ScheduleState = {
  shareWithFamily: boolean
  shareWithCenters: boolean
  setShareWithFamily: (v: boolean) => void
  setShareWithCenters: (v: boolean) => void
}

export const useScheduleStore = create<ScheduleState>()((set) => ({
  shareWithFamily: false,
  shareWithCenters: false,
  setShareWithFamily: (v) => set({ shareWithFamily: v }),
  setShareWithCenters: (v) => set({ shareWithCenters: v }),
}))
