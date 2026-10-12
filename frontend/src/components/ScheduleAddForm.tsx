import { useState, type FormEvent } from 'react'
import { Button } from './Button'
import { WEEKDAY_LABELS } from '../data/date'

// Touch replacement for drag-to-create: pick days and times, then the editor's onCreate
// merges it like a drag would (and tags it with the selected 엄마/아빠/아이 tab)
export function ScheduleAddForm({ targetLabel, onCreate }: {
  targetLabel: string
  onCreate: (daysOfWeek: number[], startTime: string, endTime: string) => void | Promise<void>
}) {
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const toggleDay = (d: number) => setDays((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d].sort()))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (days.length === 0) return setError('요일을 하나 이상 골라주세요')
    if (startTime >= endTime) return setError('끝나는 시간이 시작 시간보다 늦어야 해요')
    setError('')
    setSaving(true)
    await onCreate(days, startTime, endTime)
    setSaving(false)
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-xl border border-line p-3">
      <p className="text-sm font-bold text-ink">일정 추가 <span className="font-normal text-ink-2">· {targetLabel}</span></p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="요일">
        {WEEKDAY_LABELS.map((label, d) => (
          <button
            key={d}
            type="button"
            aria-pressed={days.includes(d)}
            onClick={() => toggleDay(d)}
            className={`focus-ring h-11 w-11 rounded-full border text-sm font-semibold ${
              days.includes(d) ? 'border-green bg-green-soft text-green' : 'border-line-2 text-ink-2'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-ink-2">
          시작
          <input type="time" step={1800} value={startTime} onChange={(e) => setStartTime(e.target.value)}
            className="focus-ring mt-1 block rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-semibold text-ink-2">
          끝
          <input type="time" step={1800} value={endTime} onChange={(e) => setEndTime(e.target.value)}
            className="focus-ring mt-1 block rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm" />
        </label>
        <Button type="submit" disabled={saving}>{saving ? '추가 중...' : '추가'}</Button>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </form>
  )
}
