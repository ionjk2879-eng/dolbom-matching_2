import { addDays, weeklyDates } from './date'

export type Repeat = { on: boolean; days: string[]; until: string }

export const noRepeat: Repeat = { on: false, days: [], until: '' }

export const MAX_REPEAT_DAYS = 183

// Returns an error message, or the dates to create
export function repeatDates(date: string, r: Repeat): string | string[] {
  if (!r.on) return [date]
  if (r.days.length === 0) return '반복할 요일을 골라주세요'
  if (!r.until || r.until < date) return '반복 종료일은 시작 날짜 이후여야 해요'
  if (r.until > addDays(date, MAX_REPEAT_DAYS)) return '반복은 최대 6개월까지 만들 수 있어요'
  const dates = weeklyDates(date, r.until, r.days)
  return dates.length ? dates : '기간 안에 고른 요일이 없어요'
}
