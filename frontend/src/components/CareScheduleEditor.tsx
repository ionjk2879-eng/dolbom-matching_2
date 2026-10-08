import { useState, type FormEvent } from 'react'
import { Button } from './Button'
import { WeekScheduleGrid, type Target } from './WeekScheduleGrid'
import { isTouchDevice } from '../data/device'
import { GapWeekGrid } from './GapWeekGrid'
import { GapCalendarTab } from './GapCalendarTab'
import { useCareScheduleStore } from '../store/careScheduleStore'
import { blockLabel } from '../data/scheduleLabel'
import { useMatchStore } from '../store/matchStore'
import { REGIONS } from '../data/careMatch'
import { DISTRICTS } from '../data/districts'
import { ChildManager } from './ChildManager'
import { WEEKDAY_LABELS, toISO } from '../data/date'
import type { RecurringSchedule } from '../data/types'


// 드래프트 방식이므로 store 대신 콜백으로 저장/삭제를 받음
const SCHEDULE_PALETTE = [
  { hex: '#4285f4', name: '파랑' }, { hex: '#db4437', name: '빨강' }, { hex: '#0f9d58', name: '초록' },
  { hex: '#9c27b0', name: '보라' }, { hex: '#00897b', name: '청록' }, { hex: '#e64a19', name: '주황' },
  { hex: '#5c6bc0', name: '남색' }, { hex: '#039be5', name: '하늘' }, { hex: '#8d6e63', name: '갈색' },
  { hex: '#546e7a', name: '회청' },
]

function ScheduleEditForm({
  schedule,
  onClose,
  onSave,
  onRemove,
}: {
  schedule: RecurringSchedule
  onClose: () => void
  onSave: (id: string, data: Omit<RecurringSchedule, 'id'>) => void
  onRemove: (id: string) => void
}) {
  const { children } = useCareScheduleStore()
  const [startTime, setStartTime] = useState(schedule.startTime)
  const [endTime, setEndTime] = useState(schedule.endTime)
  const [color, setColor] = useState(schedule.color ?? '')
  const [error, setError] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (startTime >= endTime) return setError('끝나는 시간이 시작 시간보다 늦어야 해요')
    const { id, ...rest } = schedule
    onSave(id, { ...rest, startTime, endTime, color: color || undefined })
    onClose()
  }

  const handleRemove = () => {
    if (!window.confirm(`'${blockLabel(schedule, children)}' 일정을 삭제할까요?`)) return
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
        {/* The dot stays 24px; tap-target widens only the touch area on phones */}
        <div role="group" aria-labelledby="edit-color" className="mt-1 flex flex-wrap gap-1.5">
          {[{ hex: '', name: '기본' }, ...SCHEDULE_PALETTE].map(({ hex, name }) => (
            <button
              key={name}
              type="button"
              onClick={() => setColor(hex)}
              aria-label={name}
              aria-pressed={color === hex}
              title={name}
              className="focus-ring tap-target flex items-center justify-center rounded-full"
            >
              <span
                className={`block h-6 w-6 rounded-full border-2 ${color === hex ? 'border-ink' : hex ? 'border-transparent' : 'border-line'} ${hex ? '' : 'bg-ivory-card'}`}
                style={hex ? { backgroundColor: hex } : undefined}
              />
            </button>
          ))}
        </div>
      </div>
      <Button type="submit">저장</Button>
      <button type="button" onClick={handleRemove} className="focus-ring text-xs font-semibold text-error">
        삭제
      </button>
      <button type="button" onClick={onClose} className="focus-ring tap-target text-xs font-semibold text-ink-2">
        취소
      </button>
      {error && <p className="w-full text-xs text-error">{error}</p>}
    </form>
  )
}

// Touch replacement for drag-to-create: pick days and times, then the editor's onCreate
// merges it like a drag would (and tags it with the selected 엄마/아빠/아이 tab)
function ScheduleAddForm({ targetLabel, onCreate }: {
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

// 아이 등록 + 부모/아이 반복 일정 캘린더. GapSetup 페이지와 Home 메인페이지에서 공용으로 쓴다.
export function CareScheduleEditor() {
  const { children, schedules, addSchedule, removeSchedule, updateSchedule } = useCareScheduleStore()
  const match = useMatchStore()
  const [view, setView] = useState<'schedule' | 'gap' | 'calendar'>('schedule')
  const [target, setTarget] = useState<Target>({ type: 'parent', parentLabel: 'mom' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [multiSelIds, setMultiSelIds] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState(() => toISO(new Date()))

  const type = target.type === 'parent' ? 'parent_work' as const : 'child_school' as const
  const childId = target.type === 'child' ? target.childId : null
  const parentLabel = target.type === 'parent' ? target.parentLabel : undefined

  const activeSchedules = schedules.filter((s) =>
    target.type === 'parent'
      ? s.type === 'parent_work' && (s.parentLabel === parentLabel || !s.parentLabel)
      : (s.type === 'child_school' || s.type === 'care') && s.childId === target.childId
  )

  const onCreate = (daysOfWeek: number[], startTime: string, endTime: string) => {
    const overlapIds = new Set(
      schedules
        .filter((s) =>
          s.type === type && s.childId === childId &&
          (type === 'parent_work' ? s.parentLabel === parentLabel : true) &&
          s.daysOfWeek.some((d) => daysOfWeek.includes(d)) &&
          s.startTime < endTime && s.endTime > startTime
        )
        .map((s) => s.id)
    )
    const overlapping = schedules.filter((s) => overlapIds.has(s.id))
    overlapping.forEach((s) => removeSchedule(s.id))
    overlapping.forEach((s) => {
      s.daysOfWeek.filter((d) => !daysOfWeek.includes(d)).forEach((d) =>
        addSchedule({ type, childId, daysOfWeek: [d], startTime: s.startTime, endTime: s.endTime, parentLabel: s.parentLabel, color: s.color, title: s.title, memo: s.memo })
      )
    })
    daysOfWeek.forEach((day) => {
      addSchedule({ type, childId, daysOfWeek: [day], startTime, endTime, parentLabel })
    })
  }

  const onPunch = (id: string, punchStart: string, punchEnd: string) => {
    const s = schedules.find((x) => x.id === id)
    if (!s) return
    removeSchedule(id)
    if (s.startTime < punchStart)
      addSchedule({ type: s.type, childId: s.childId, daysOfWeek: s.daysOfWeek, startTime: s.startTime, endTime: punchStart, parentLabel: s.parentLabel, color: s.color, title: s.title, memo: s.memo, careOptionId: s.careOptionId })
    if (s.endTime > punchEnd)
      addSchedule({ type: s.type, childId: s.childId, daysOfWeek: s.daysOfWeek, startTime: punchEnd, endTime: s.endTime, parentLabel: s.parentLabel, color: s.color, title: s.title, memo: s.memo, careOptionId: s.careOptionId })
  }

  const onMove = (id: string, daysOfWeek: number[], startTime: string, endTime: string) => {
    const s = schedules.find((x) => x.id === id)
    if (!s) return
    const { id: _id, ...rest } = s
    updateSchedule(id, { ...rest, daysOfWeek, startTime, endTime })
  }


  return (
    <div className="flex flex-col gap-10">
      {/* 최상위 탭: 일정 등록 / 공백 패턴 / 공백 캘린더 */}
      <div className="inline-flex self-start rounded-xl border border-line bg-ivory-deep-2 p-1">
        {(['schedule', 'gap', 'calendar'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`focus-ring rounded-lg px-4 py-1.5 text-xs font-semibold ${view === v ? 'bg-ivory text-ink shadow-sm' : 'text-ink-2'}`}
          >
            {v === 'schedule' ? '일정 등록' : v === 'gap' ? '공백 패턴' : '공백 캘린더'}
          </button>
        ))}
      </div>

      {view === 'gap' ? (
        <GapWeekGrid kids={children} schedules={schedules} />
      ) : view === 'calendar' ? (
        <GapCalendarTab selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      ) : (
      <>
      <div className="flex flex-col gap-6">
        <p className="text-sm font-bold text-ink">아이 등록</p>
        <ChildManager />
      </div>

      <div className="flex flex-col gap-6">
        <p className="text-sm font-bold text-ink">거주지</p>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="시/도"
            value={match.region}
            onChange={(e) => match.setRegion(e.target.value)}
            className="focus-ring rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm"
          >
            <option value="">시/도 선택</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            aria-label="구/군"
            value={match.district}
            onChange={(e) => match.setDistrict(e.target.value)}
            disabled={!match.region || (DISTRICTS[match.region]?.length ?? 0) === 0}
            className="focus-ring rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm disabled:opacity-40"
          >
            <option value="">구/군 전체</option>
            {(DISTRICTS[match.region] ?? []).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-ink">반복 일정 캘린더</p>
          <div className="inline-flex rounded-xl border border-line bg-ivory-deep-2 p-1">
            {(['mom', 'dad'] as const).map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setTarget({ type: 'parent', parentLabel: label })}
                className={`focus-ring tap-target rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  target.type === 'parent' && target.parentLabel === label ? 'bg-ivory text-ink' : 'text-ink-2'
                }`}
              >
                {label === 'mom' ? '엄마 근무' : '아빠 근무'}
              </button>
            ))}
            {children.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setTarget({ type: 'child', childId: c.id })}
                className={`focus-ring tap-target rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  target.type === 'child' && target.childId === c.id ? 'bg-ivory text-ink' : 'text-ink-2'
                }`}
              >
                {c.name} 학교
              </button>
            ))}
          </div>
        </div>

        {children.length === 0 && (
          <p className="text-xs text-ink-2">
            지금은 "부모 근무"만 등록할 수 있어요. 아이 학교 일정을 넣으려면 위에서 아이를 먼저 등록해주세요.
          </p>
        )}
        {isTouchDevice && (
          <ScheduleAddForm
            targetLabel={
              target.type === 'parent'
                ? (target.parentLabel === 'mom' ? '엄마 근무' : '아빠 근무')
                : `${children.find((c) => c.id === target.childId)?.name ?? '아이'} 학교`
            }
            onCreate={onCreate}
          />
        )}
        <WeekScheduleGrid
          schedules={activeSchedules}
          kids={children}
          target={target}
          onCreate={onCreate}
          onEdit={setEditingId}
          onDelete={removeSchedule}
          onPunch={onPunch}
          onMove={onMove}
          onSelectionChange={setMultiSelIds}
        />
        {editingId && (() => {
          const schedule = schedules.find((s) => s.id === editingId)
          if (!schedule) return null
          return (
            <ScheduleEditForm
              key={editingId}
              schedule={schedule}
              onClose={() => setEditingId(null)}
              onSave={(id, data) => {
                updateSchedule(id, data)
                // Selected blocks follow only a color change; a time-only edit must not repaint them
                if (multiSelIds.length > 1 && data.color !== schedule.color) {
                  multiSelIds.filter((sid) => sid !== id).forEach((sid) => {
                    const s = schedules.find((x) => x.id === sid)
                    if (s && s.color !== data.color) updateSchedule(sid, { ...s, color: data.color })
                  })
                }
              }}
              onRemove={removeSchedule}
            />
          )
        })()}

        {/* 아이 탭: 선택된 돌봄 센터 목록 */}
        {target.type === 'child' && (() => {
          const careList = schedules.filter(
            (s) => s.type === 'care' && s.childId === childId
          )
          if (careList.length === 0) return null
          return (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-ink-2">선택된 돌봄</p>
              <div className="flex flex-col gap-1.5">
                {careList.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-ivory-card px-3 py-2 text-xs">
                    <span className="font-semibold text-ink">{s.title ?? '돌봄(선택)'}</span>
                    <span className="text-ink-2">
                      {[...s.daysOfWeek].sort((a, b) => a - b).map((d) => WEEKDAY_LABELS[d]).join('')} · {s.startTime}~{s.endTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

      </div>
      </>
      )}
    </div>
  )
}
