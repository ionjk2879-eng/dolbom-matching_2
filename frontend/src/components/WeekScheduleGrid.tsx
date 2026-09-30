import { useEffect, useState } from 'react'
import { WEEKDAY_LABELS } from '../data/date'
import type { Child, RecurringSchedule } from '../data/types'

const START_HOUR = 6
const END_HOUR = 22
const SLOT_MINUTES = 30
const SLOTS_PER_DAY = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES
const ROW_HEIGHT = 20 // px

function slotToTime(slot: number): string {
  const mins = START_HOUR * 60 + slot * SLOT_MINUTES
  const h = Math.floor(mins / 60).toString().padStart(2, '0')
  const m = (mins % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

function timeToSlot(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h * 60 + m - START_HOUR * 60) / SLOT_MINUTES
}

const childColors = ['bg-green text-white', 'bg-sand text-ink', 'bg-warn text-white']

function blockColor(schedule: RecurringSchedule, kids: Child[]): string {
  if (schedule.type === 'parent_work') return 'bg-ink text-white'
  if (schedule.type === 'care') return 'bg-line-2 text-ink-2'
  const idx = kids.findIndex((c) => c.id === schedule.childId)
  return childColors[Math.max(idx, 0) % childColors.length]
}

function blockLabel(schedule: RecurringSchedule, kids: Child[]): string {
  if (schedule.type === 'parent_work') return '부모 근무'
  if (schedule.type === 'care') return '돌봄(선택)'
  return kids.find((c) => c.id === schedule.childId)?.name ?? '아이 학교'
}

type Cell = { day: number; slot: number }

export type Target = { type: 'parent' } | { type: 'child'; childId: string }

export function WeekScheduleGrid({
  schedules,
  kids,
  target,
  onCreate,
  onDelete,
}: {
  schedules: RecurringSchedule[]
  kids: Child[]
  target: Target
  onCreate: (daysOfWeek: number[], startTime: string, endTime: string) => void
  onDelete: (id: string) => void
}) {
  const [dragStart, setDragStart] = useState<Cell | null>(null)
  const [dragEnd, setDragEnd] = useState<Cell | null>(null)

  useEffect(() => {
    if (!dragStart) return
    const finish = () => {
      if (dragStart && dragEnd) {
        const dayLo = Math.min(dragStart.day, dragEnd.day)
        const dayHi = Math.max(dragStart.day, dragEnd.day)
        const slotLo = Math.min(dragStart.slot, dragEnd.slot)
        const slotHi = Math.max(dragStart.slot, dragEnd.slot)
        const daysOfWeek = Array.from({ length: dayHi - dayLo + 1 }, (_, i) => dayLo + i)
        onCreate(daysOfWeek, slotToTime(slotLo), slotToTime(slotHi + 1))
      }
      setDragStart(null)
      setDragEnd(null)
    }
    window.addEventListener('mouseup', finish)
    return () => window.removeEventListener('mouseup', finish)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragStart, dragEnd])

  const inSelection = (day: number, slot: number) => {
    if (!dragStart || !dragEnd) return false
    const dayLo = Math.min(dragStart.day, dragEnd.day)
    const dayHi = Math.max(dragStart.day, dragEnd.day)
    const slotLo = Math.min(dragStart.slot, dragEnd.slot)
    const slotHi = Math.max(dragStart.slot, dragEnd.slot)
    return day >= dayLo && day <= dayHi && slot >= slotLo && slot <= slotHi
  }

  return (
    <div className="select-none overflow-x-auto">
      <div className="mb-2 flex flex-wrap gap-3 text-xs text-ink-3">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-ink" /> 부모 근무
        </span>
        {kids.map((c, i) => (
          <span key={c.id} className="flex items-center gap-1">
            <span className={`h-3 w-3 rounded ${childColors[i % childColors.length].split(' ')[0]}`} /> {c.name} 학교
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-line-2" /> 돌봄(선택)
        </span>
      </div>

      <div className="flex min-w-[640px]">
        <div className="w-14 shrink-0">
          <div style={{ height: ROW_HEIGHT }} />
          {Array.from({ length: SLOTS_PER_DAY / 2 }, (_, i) => (
            <div key={i} style={{ height: ROW_HEIGHT * 2 }} className="text-right text-[10px] text-ink-3">
              {String(START_HOUR + i).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {WEEKDAY_LABELS.map((label, day) => (
          <div key={day} className="flex-1 border-l border-line">
            <div style={{ height: ROW_HEIGHT }} className="text-center text-xs font-semibold text-ink-2">
              {label}
            </div>
            <div className="relative" style={{ height: ROW_HEIGHT * SLOTS_PER_DAY }}>
              {Array.from({ length: SLOTS_PER_DAY }, (_, slot) => (
                <div
                  key={slot}
                  onMouseDown={() => {
                    setDragStart({ day, slot })
                    setDragEnd({ day, slot })
                  }}
                  onMouseEnter={() => dragStart && setDragEnd({ day, slot })}
                  className={`border-b border-line-3 ${
                    inSelection(day, slot) ? 'bg-green-soft' : slot % 2 === 0 ? 'bg-ivory-card' : 'bg-ivory'
                  }`}
                  style={{ height: ROW_HEIGHT }}
                />
              ))}

              {schedules
                .filter((s) => s.daysOfWeek.includes(day))
                .map((s) => {
                  const top = timeToSlot(s.startTime) * ROW_HEIGHT
                  const height = (timeToSlot(s.endTime) - timeToSlot(s.startTime)) * ROW_HEIGHT
                  return (
                    <button
                      key={s.id}
                      type="button"
                      title="클릭하면 삭제돼요"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => onDelete(s.id)}
                      className={`focus-ring absolute inset-x-0.5 overflow-hidden rounded px-1 text-left text-[10px] font-semibold ${blockColor(s, kids)}`}
                      style={{ top, height }}
                    >
                      {blockLabel(s, kids)} {s.startTime}~{s.endTime}
                    </button>
                  )
                })}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-2 text-xs text-ink-3">
        빈 칸을 드래그하면 현재 대상({target.type === 'parent' ? '부모 근무' : '아이 학교'})으로 등록되고, 등록된
        블록을 클릭하면 삭제돼요.
      </p>
    </div>
  )
}
