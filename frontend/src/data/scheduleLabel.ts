import type { Child, RecurringSchedule } from './types'

export function blockLabel(schedule: RecurringSchedule, kids: Child[]): string {
  if (schedule.title) return schedule.title
  if (schedule.type === 'parent_work') return '부모 근무'
  if (schedule.type === 'care') return '돌봄(선택)'
  return kids.find((c) => c.id === schedule.childId)?.name ?? '아이 학교'
}
