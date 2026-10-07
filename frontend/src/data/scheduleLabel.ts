import type { Child, RecurringSchedule } from './types'

// Type name for lists (/calendar, my page); work is split into 엄마/아빠 when tagged
export function typeLabel(schedule: RecurringSchedule): string {
  if (schedule.type === 'parent_work') {
    if (schedule.parentLabel === 'mom') return '엄마 근무'
    if (schedule.parentLabel === 'dad') return '아빠 근무'
    return '부모 근무'
  }
  return schedule.type === 'child_school' ? '아이 학교' : '돌봄(선택한 옵션)'
}

export function blockLabel(schedule: RecurringSchedule, kids: Child[]): string {
  if (schedule.title) return schedule.title
  if (schedule.type === 'parent_work') {
    // Untagged work (tags live in localStorage, so other devices see none) is neither mom's nor dad's
    if (schedule.parentLabel === 'dad') return '아빠 근무'
    if (schedule.parentLabel === 'mom') return '엄마 근무'
    return '부모 근무'
  }
  if (schedule.type === 'care') return '돌봄(선택)'
  return kids.find((c) => c.id === schedule.childId)?.name ?? '아이 학교'
}
