export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

// Local date as 'YYYY-MM-DD' (toISOString would shift to UTC)
export function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function fromISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function weekdayOf(iso: string) {
  return WEEKDAY_LABELS[fromISO(iso).getDay()]
}

export function addDays(iso: string, n: number) {
  const d = fromISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

// Every date from start to until (inclusive) that falls on one of the weekday labels
export function weeklyDates(start: string, until: string, weekdays: string[]) {
  const dates: string[] = []
  for (let iso = start; iso <= until; iso = addDays(iso, 1)) {
    if (weekdays.includes(weekdayOf(iso))) dates.push(iso)
  }
  return dates
}
