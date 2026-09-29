import { WEEKDAY_LABELS } from './date'

// Center hours like '13:00~19:30'; time options from the match form like '~오후5시'
function closingMinutes(hours: string) {
  const [h, m] = hours.split('~')[1].split(':').map(Number)
  return h * 60 + m
}

export function coversTime(hours: string, time: string) {
  const close = closingMinutes(hours)
  if (time === '~오후5시') return close >= 17 * 60
  if (time === '~오후7시') return close >= 19 * 60
  if (time === '오후7시 이후') return close > 19 * 60
  return true
}

// Selected dates are ISO strings like '2026-09-29'; center days are labels like '월'
export function coversDates(days: string[], dates: string[]) {
  return dates.every((iso) => {
    const [y, m, d] = iso.split('-').map(Number)
    return days.includes(WEEKDAY_LABELS[new Date(y, m - 1, d).getDay()])
  })
}
