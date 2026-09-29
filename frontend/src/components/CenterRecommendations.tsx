import { centers } from '../data/centers'
import { WEEKDAY_LABELS, weekdayOf } from '../data/date'
import { fitsWeekly } from '../data/match'
import type { Repeat } from '../data/repeat'

// Top 3 centers open for the schedule's weekday(s) and time; picking one links it to the schedule
export function CenterRecommendations({
  date,
  start,
  end,
  repeat,
  value,
  onChange,
}: {
  date: string
  start: string
  end: string
  repeat: Repeat
  value: string
  onChange: (centerId: string) => void
}) {
  const ready = !!date && !!start && !!end && start < end
  // With a weekly repeat, recommend only centers open on every repeated weekday
  const days = !ready
    ? []
    : repeat.on && repeat.days.length
      ? WEEKDAY_LABELS.filter((d) => repeat.days.includes(d))
      : [weekdayOf(date)]
  const fits = ready ? centers.filter((c) => fitsWeekly(c, days, start, end)) : []
  const recs = [...fits]
    .sort((a, b) => Number(b.seats > 0) - Number(a.seats > 0) || a.distanceM - b.distanceM)
    .slice(0, 3)
  const selectedName = centers.find((c) => c.id === value)?.name

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-ink">돌봄 센터 (선택)</span>
        {ready && (
          <span className="text-xs text-ink-3">
            {days.join('·')}요일 {start}~{end} 운영 {fits.length}곳
          </span>
        )}
      </div>
      {!ready && (
        <p className="text-[13px] text-ink-2 opacity-55">
          날짜와 시작·종료 시간을 입력하면 그 시간과 요일에 운영하는 센터를 골라드려요
        </p>
      )}
      {ready && recs.length === 0 && (
        <p className="rounded-xl bg-warn-bg px-3.5 py-3 text-[13px] text-warn">
          이 시간에 운영하는 센터가 없어요. 시간을 조정해 보세요.
        </p>
      )}
      {recs.map((c, i) => {
        const selected = value === c.id
        const dist = c.distanceM >= 1000 ? `${(c.distanceM / 1000).toFixed(1)}km` : `${c.distanceM}m`
        const fee = c.feeMonthly ? `월 ${c.feeMonthly / 10000}만원` : '무료'
        const badge = c.seats === 0 ? '대기' : i === 0 ? '추천' : `빈자리 ${c.seats}`
        const badgeClass =
          c.seats === 0 ? 'bg-ivory-deep text-ink-2b' : i === 0 ? 'bg-green text-white' : 'bg-green-soft text-green'
        return (
          <button
            key={c.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? '' : c.id)}
            className={`focus-ring flex w-full items-center gap-3 rounded-xl border p-3 text-left ${
              selected ? 'border-green bg-green-soft' : 'border-line bg-ivory-card'
            }`}
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-bold text-ink">{c.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${badgeClass}`}>{badge}</span>
              </span>
              <span className="text-xs text-ink-3">
                운영 {c.hours} · {dist} · {fee}
                {c.bus && ' · 차량 운행'}
              </span>
            </span>
            <span
              className={`shrink-0 rounded-[10px] px-3 py-1.5 text-xs font-bold ${
                selected ? 'bg-green text-white' : 'border border-line-2 text-ink-2'
              }`}
            >
              {selected ? '선택됨' : '선택'}
            </span>
          </button>
        )
      })}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="focus-ring self-start text-xs font-semibold text-ink-2 underline"
        >
          센터 선택 해제{!recs.some((c) => c.id === value) && ` (${selectedName})`}
        </button>
      )}
    </div>
  )
}
