import { useMemo, useState } from 'react'
import { WEEKDAY_LABELS, toISO } from '../data/date'

export function Calendar({
  selectedDates,
  onToggle,
  onSelectWeekdays,
}: {
  selectedDates: string[]
  onToggle: (date: string) => void
  onSelectWeekdays: (dates: string[]) => void
}) {
  const [viewDate, setViewDate] = useState(() => new Date())
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const cells = useMemo(() => {
    const today = toISO(new Date())
    const first = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startOffset = first.getDay()
    const list: { day: number | null; iso: string | null; weekend: boolean; disabled: boolean }[] = []
    for (let i = 0; i < startOffset; i++) list.push({ day: null, iso: null, weekend: false, disabled: false })
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month, d).getDay()
      const iso = toISO(new Date(year, month, d))
      list.push({ day: d, iso, weekend: dow === 0 || dow === 6, disabled: iso < today })
    }
    return list
  }, [year, month])

  const weekdayIsosInMonth = cells.filter((c) => c.iso && !c.weekend && !c.disabled).map((c) => c.iso as string)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="이전 달"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="focus-ring rounded-lg border border-line-2 px-3 py-1.5 text-sm hover:bg-ivory-deep"
        >
          이전
        </button>
        <p className="text-sm font-bold text-ink">
          {year}년 {month + 1}월
        </p>
        <button
          type="button"
          aria-label="다음 달"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="focus-ring rounded-lg border border-line-2 px-3 py-1.5 text-sm hover:bg-ivory-deep"
        >
          다음
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink-3">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (!c.day) return <div key={i} />
          const selected = c.iso ? selectedDates.includes(c.iso) : false
          return (
            <button
              key={c.iso}
              type="button"
              disabled={c.disabled}
              onClick={() => c.iso && onToggle(c.iso)}
              className={`focus-ring aspect-square rounded-lg text-sm transition ${
                c.disabled
                  ? 'cursor-not-allowed text-ink-3/50'
                  : selected
                    ? 'bg-green text-white'
                    : 'text-ink hover:bg-ivory-deep'
              }`}
            >
              {c.day}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-ink-2">선택한 날 {selectedDates.length}일</p>
        <button
          type="button"
          onClick={() => onSelectWeekdays(weekdayIsosInMonth)}
          className="focus-ring rounded-full border border-line-2 px-3 py-1.5 text-xs font-semibold text-ink-2 hover:border-green/50"
        >
          평일 전체 선택
        </button>
      </div>
    </div>
  )
}
