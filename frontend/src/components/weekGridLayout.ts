import type { Child, RecurringSchedule } from '../data/types'

export const START_HOUR = 0
export const END_HOUR = 24
// Hour the grid is scrolled to when it opens (the rest is reached by scrolling)
export const INITIAL_SCROLL_HOUR = 6
// Hours visible at once inside the scroll box
export const VISIBLE_HOURS = 16
export const SLOT_MINUTES = 30
export const SLOTS_PER_DAY = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES
export const ROW_HEIGHT = 22

export function slotToTime(slot: number): string {
  // The last slot ends at midnight; '24:00' can't be shown by <input type="time">, so stop at 23:59
  const mins = Math.min(START_HOUR * 60 + slot * SLOT_MINUTES, 24 * 60 - 1)
  const h = Math.floor(mins / 60).toString().padStart(2, '0')
  const m = (mins % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

export function timeToSlot(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h * 60 + m - START_HOUR * 60) / SLOT_MINUTES
}

// Blocks reaching outside START_HOUR–END_HOUR are drawn clipped and can't be dragged: a drag would clamp
// their real times into the window. Edit those through the time form instead.
export function fitsWindow(s: { startTime: string; endTime: string }): boolean {
  return timeToSlot(s.startTime) >= 0 && timeToSlot(s.endTime) <= SLOTS_PER_DAY
}

export const childColors = ['bg-green text-white', 'bg-sand text-ink', 'bg-warn text-white']

export function blockColor(s: RecurringSchedule, kids: Child[]): string {
  if (s.type === 'parent_work') {
    if (s.parentLabel === 'dad') return 'bg-warn text-white'
    if (s.parentLabel === 'mom') return 'bg-ink text-white'
    return 'bg-ink-2 text-white' // untagged
  }
  if (s.type === 'care') return 'bg-line-2 text-ink-2'
  const idx = kids.findIndex((c) => c.id === s.childId)
  return childColors[Math.max(idx, 0) % childColors.length]
}

// Splits a day's blocks into side-by-side lanes so overlapping ones (e.g. school inside work hours) stay visible
export function layoutLanes(items: RecurringSchedule[]) {
  const laneEnds: string[] = []
  const laneOf = new Map<string, number>()
  for (const s of [...items].sort((a, b) => a.startTime.localeCompare(b.startTime))) {
    let lane = laneEnds.findIndex((end) => end <= s.startTime)
    if (lane === -1) lane = laneEnds.push(s.endTime) - 1
    else laneEnds[lane] = s.endTime
    laneOf.set(s.id, lane)
  }
  return { laneOf, lanes: Math.max(laneEnds.length, 1) }
}
