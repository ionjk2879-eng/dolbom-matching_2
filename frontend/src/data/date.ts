export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

// Local date as 'YYYY-MM-DD' (toISOString would shift to UTC)
export function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
