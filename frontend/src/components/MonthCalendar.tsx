import { useMemo, useState, type ReactNode } from 'react'
import { WEEKDAY_LABELS, toISO } from '../data/date'

const navButton =
  'focus-ring flex h-8 w-8 items-center justify-center rounded-lg border border-line-2 text-ink-2 hover:bg-ivory-deep'

// 월간 달력. 날짜 칸 아래 표시는 renderBadge로 페이지마다 다르게 그린다.
export function MonthCalendar({
  selected,
  onSelect,
  renderBadge,
}: {
  selected: string
  onSelect: (iso: string) => void
  renderBadge?: (iso: string, isSelected: boolean) => ReactNode
}) {
  const today = toISO(new Date())
  const [viewDate, setViewDate] = useState(() => new Date(`${selected}T00:00:00`))
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const cells = useMemo(() => {
    const list: (string | null)[] = Array(new Date(year, month, 1).getDay()).fill(null)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) list.push(toISO(new Date(year, month, d)))
    return list
  }, [year, month])

  const goToday = () => {
    setViewDate(new Date())
    onSelect(today)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-base font-extrabold text-ink">
          {year}년 {month + 1}월
        </p>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={goToday} className="focus-ring rounded-lg border border-line-2 px-3 py-1.5 text-xs font-semibold text-ink-2 hover:bg-ivory-deep">
            오늘
          </button>
          <button type="button" aria-label="이전 달" onClick={() => setViewDate(new Date(year, month - 1, 1))} className={navButton}>
            ‹
          </button>
          <button type="button" aria-label="다음 달" onClick={() => setViewDate(new Date(year, month + 1, 1))} className={navButton}>
            ›
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink-3">
        {WEEKDAY_LABELS.map((w, i) => (
          <div key={w} className={`py-1 ${i === 0 ? 'text-error' : ''}`}>
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((iso, i) => {
          if (!iso) return <div key={i} />
          const isSelected = selected === iso
          const isSunday = i % 7 === 0
          return (
            <button
              key={iso}
              type="button"
              aria-pressed={isSelected}
              aria-current={iso === today ? 'date' : undefined}
              onClick={() => onSelect(iso)}
              className={`focus-ring flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-sm transition ${
                isSelected
                  ? 'bg-green font-bold text-white'
                  : `${isSunday ? 'text-error' : 'text-ink'} hover:bg-ivory-deep ${iso === today ? 'ring-1 ring-green ring-inset font-bold' : ''}`
              }`}
            >
              {Number(iso.slice(8))}
              {renderBadge?.(iso, isSelected)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
