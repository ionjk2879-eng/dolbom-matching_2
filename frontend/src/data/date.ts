export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

// Local date as 'YYYY-MM-DD' (toISOString would shift to UTC)
export function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 'YYYY-MM-DD' -> '10월 1일 (목)'
export function formatDayLabel(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY_LABELS[d.getDay()]})`
}
