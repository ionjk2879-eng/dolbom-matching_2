import { WEEKDAY_LABELS, addDays, weekdayOf } from '../data/date'
import { MAX_REPEAT_DAYS, noRepeat, repeatDates, type Repeat } from '../data/repeat'

// Weekly repeat toggle + weekday chips + end date, shown only when creating a schedule
export function RepeatFields({ date, value, onChange }: { date: string; value: Repeat; onChange: (r: Repeat) => void }) {
  const toggleOn = () =>
    onChange(value.on ? noRepeat : { on: true, days: date ? [weekdayOf(date)] : [], until: date ? addDays(date, 27) : '' })
  const toggleDay = (d: string) =>
    onChange({ ...value, days: value.days.includes(d) ? value.days.filter((x) => x !== d) : [...value.days, d] })
  const result = value.on && date ? repeatDates(date, value) : null

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-ink">
        <input type="checkbox" checked={value.on} onChange={toggleOn} className="h-4 w-4 accent-green" />
        매주 반복
      </label>
      {value.on && (
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-ivory p-3">
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_LABELS.map((d) => {
              const selected = value.days.includes(d)
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleDay(d)}
                  className={`focus-ring h-9 w-9 rounded-full border text-sm font-semibold ${
                    selected ? 'border-green bg-green text-white' : 'border-line-2 bg-ivory-card text-ink-2'
                  }`}
                >
                  {d}
                </button>
              )
            })}
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
            반복 종료일
            <input
              type="date"
              value={value.until}
              min={date}
              max={date ? addDays(date, MAX_REPEAT_DAYS) : undefined}
              onChange={(e) => onChange({ ...value, until: e.target.value })}
              className="focus-ring rounded-xl border border-line-2 bg-ivory-card px-4 py-2.5 text-sm font-normal"
            />
          </label>
          {Array.isArray(result) && <p className="text-xs text-green">일정 {result.length}개가 만들어져요</p>}
        </div>
      )}
    </div>
  )
}
