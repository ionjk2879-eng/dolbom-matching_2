import { useRef, useState, type FormEvent } from 'react'
import { Button } from './Button'
import { useCareScheduleStore } from '../store/careScheduleStore'
import { blockLabel } from '../data/scheduleLabel'
import type { RecurringSchedule } from '../data/types'

const SCHEDULE_PALETTE = [
  { hex: '#4285f4', name: '파랑' }, { hex: '#db4437', name: '빨강' }, { hex: '#0f9d58', name: '초록' },
  { hex: '#9c27b0', name: '보라' }, { hex: '#00897b', name: '청록' }, { hex: '#e64a19', name: '주황' },
  { hex: '#5c6bc0', name: '남색' }, { hex: '#039be5', name: '하늘' }, { hex: '#8d6e63', name: '갈색' },
  { hex: '#546e7a', name: '회청' },
]

export function ScheduleEditForm({
  schedule,
  onClose,
  onSave,
  onRemove,
  onColorPreview,
}: {
  schedule: RecurringSchedule
  onClose: () => void
  onSave: (id: string, data: Omit<RecurringSchedule, 'id'>) => void
  onRemove: (id: string) => void
  onColorPreview: (id: string, color: string | undefined) => void
}) {
  const { children } = useCareScheduleStore()
  const [startTime, setStartTime] = useState(schedule.startTime)
  const [endTime, setEndTime] = useState(schedule.endTime)
  const [color, setColor] = useState(schedule.color ?? '')
  const [error, setError] = useState('')
  // stable ref so cancel always knows the color at form-open time
  const originalColor = useRef(schedule.color ?? '')

  const handleColorChange = (hex: string) => {
    setColor(hex)
    onColorPreview(schedule.id, hex || undefined)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (startTime >= endTime) return setError('끝나는 시간이 시작 시간보다 늦어야 해요')
    const { id, ...rest } = schedule
    onSave(id, { ...rest, startTime, endTime, color: color || undefined })
    onClose()
  }

  const handleCancel = () => {
    onColorPreview(schedule.id, originalColor.current || undefined)
    onClose()
  }

  const handleColorReset = () => {
    setColor('')
    onColorPreview(schedule.id, undefined)
  }

  const handleRemove = () => {
    if (!window.confirm(`'${blockLabel(schedule, children)}' 일정을 삭제할까요?`)) return
    onColorPreview(schedule.id, undefined)
    onRemove(schedule.id)
    onClose()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3 rounded-xl border border-line p-3">
      <div>
        <label htmlFor="edit-start" className="text-xs font-semibold text-ink-2">
          시작
        </label>
        <input
          id="edit-start"
          type="time"
          step={1800}
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="focus-ring mt-1 block rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="edit-end" className="text-xs font-semibold text-ink-2">
          끝
        </label>
        <input
          id="edit-end"
          type="time"
          step={1800}
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="focus-ring mt-1 block rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm"
        />
      </div>
      <div>
        <p id="edit-color" className="text-xs font-semibold text-ink-2">색상</p>
        <div role="group" aria-labelledby="edit-color" className="mt-1 flex flex-wrap gap-1.5">
          {SCHEDULE_PALETTE.map(({ hex, name }) => (
            <button
              key={name}
              type="button"
              onClick={() => handleColorChange(hex)}
              aria-label={name}
              aria-pressed={color === hex}
              title={name}
              className="focus-ring tap-target flex items-center justify-center rounded-full"
            >
              <span
                className={`block h-6 w-6 rounded-full border-2 ${color === hex ? 'border-ink' : 'border-transparent'}`}
                style={{ backgroundColor: hex }}
              />
            </button>
          ))}
        </div>
      </div>
      <Button type="submit">저장</Button>
      <button type="button" onClick={handleColorReset} className="focus-ring text-xs font-semibold text-ink-2">
        삭제
      </button>
      <button type="button" onClick={handleCancel} className="focus-ring tap-target text-xs font-semibold text-ink-2">
        취소
      </button>
      <button type="button" onClick={handleRemove} className="focus-ring tap-target text-xs text-error">
        일정 삭제
      </button>
      {error && <p className="w-full text-xs text-error">{error}</p>}
    </form>
  )
}
