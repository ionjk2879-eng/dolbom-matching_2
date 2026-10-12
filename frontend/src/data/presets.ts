import type { Child, RecurringSchedule } from './types'

export type PresetItem = {
  type: RecurringSchedule['type']
  childIndex: number | null // null = parent schedule; index into children array for child_school
  daysOfWeek: number[]
  startTime: string
  endTime: string
  parentLabel?: 'mom' | 'dad'
  color?: string
  title?: string
}

export type Preset = {
  id: string
  name: string
  createdAt: string
  items: PresetItem[]
  region?: string
  district?: string
}

const KEY = 'schedule-presets'

export function loadPresets(): Preset[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function upsertPreset(p: Preset) {
  const list = loadPresets().filter((x) => x.id !== p.id)
  localStorage.setItem(KEY, JSON.stringify([...list, p]))
}

export function deletePreset(id: string) {
  localStorage.setItem(KEY, JSON.stringify(loadPresets().filter((p) => p.id !== id)))
}

export function draftToPresetItems(schedules: RecurringSchedule[], children: Child[]): PresetItem[] {
  return schedules
    .filter((s) => s.type === 'parent_work' || s.type === 'child_school')
    .map((s) => ({
      type: s.type,
      childIndex: s.childId ? children.findIndex((c) => c.id === s.childId) : null,
      daysOfWeek: s.daysOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      parentLabel: s.parentLabel,
      color: s.color,
      title: s.title,
    }))
    .filter((item) => item.childIndex !== -1)
}

export function presetItemsToDraft(
  items: PresetItem[],
  children: Child[],
  mkId: () => string,
): RecurringSchedule[] {
  return items
    .map((item) => {
      const childId =
        item.childIndex !== null ? (children[item.childIndex]?.id ?? null) : null
      if (item.childIndex !== null && childId === null) return null // child not at that index
      return {
        id: mkId(),
        type: item.type,
        childId,
        daysOfWeek: item.daysOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        parentLabel: item.parentLabel,
        color: item.color,
        title: item.title,
      } as RecurringSchedule
    })
    .filter((s): s is RecurringSchedule => s !== null)
}
