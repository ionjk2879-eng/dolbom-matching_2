import { useState, type FormEvent } from 'react'
import { Button } from './Button'
import { WeekScheduleGrid, type Target } from './WeekScheduleGrid'
import { isTouchDevice } from '../data/device'
import { GapWeekGrid } from './GapWeekGrid'
import { MonthCalendar } from './MonthCalendar'
import { useCareScheduleStore } from '../store/careScheduleStore'
import { blockLabel } from '../data/scheduleLabel'
import { useMatchStore } from '../store/matchStore'
import { REGIONS } from '../data/careMatch'
import { DISTRICTS } from '../data/districts'
import { WEEKDAY_LABELS, formatDayLabel, toISO } from '../data/date'
import { computeGaps } from '../data/gaps'
import type { RecurringSchedule } from '../data/types'

function durationLabel(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`
}


function ChildForm() {
  const addChild = useCareScheduleStore((s) => s.addChild)
  const [name, setName] = useState('')
  const [grade, setGrade] = useState(1)
  const [commuteMinutes, setCommuteMinutes] = useState(20)

  const [error, setError] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('아이 이름을 입력해주세요')
    setError('')
    if (await addChild({ name: trimmed, grade, commuteMinutes })) setName('')
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-4">
      <label htmlFor="child-name" className="flex items-center gap-2 text-sm font-semibold text-ink-2">
        아이 이름
        <input
          id="child-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="focus-ring w-36 rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm font-normal text-ink"
        />
      </label>
      <label htmlFor="child-grade" className="flex items-center gap-2 text-sm font-semibold text-ink-2">
        학년
        <select
          id="child-grade"
          value={grade}
          onChange={(e) => setGrade(Number(e.target.value))}
          className="focus-ring rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm font-normal text-ink"
        >
          {[1, 2, 3, 4, 5, 6].map((g) => (
            <option key={g} value={g}>{g}학년</option>
          ))}
        </select>
      </label>
      <label htmlFor="child-commute" className="flex items-center gap-2 text-sm font-semibold text-ink-2">
        통학시간(분)
        <input
          id="child-commute"
          type="number"
          min={0}
          value={commuteMinutes}
          onChange={(e) => setCommuteMinutes(Number(e.target.value))}
          className="focus-ring w-20 rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm font-normal text-ink"
        />
      </label>
      <Button type="submit">아이 추가</Button>
      {error && <p className="w-full text-sm text-error">{error}</p>}
    </form>
  )
}

function ChildEditForm({ id, onClose }: { id: string; onClose: () => void }) {
  const { children, updateChild } = useCareScheduleStore()
  const child = children.find((c) => c.id === id)
  const [name, setName] = useState(child?.name ?? '')
  const [grade, setGrade] = useState(child?.grade ?? 1)
  const [commuteMinutes, setCommuteMinutes] = useState(child?.commuteMinutes ?? 20)
  const [error, setError] = useState('')
  if (!child) return null

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('이름을 입력해주세요')
    if (await updateChild(id, { name: trimmed, grade, commuteMinutes })) onClose()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-ivory-card p-4">
      <label className="flex items-center gap-2 text-sm font-semibold text-ink-2">
        이름
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="focus-ring w-36 rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm font-normal text-ink" />
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold text-ink-2">
        학년
        <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}
          className="focus-ring rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm font-normal text-ink">
          {[1, 2, 3, 4, 5, 6].map((g) => <option key={g} value={g}>{g}학년</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold text-ink-2">
        통학시간(분)
        <input type="number" min={0} value={commuteMinutes} onChange={(e) => setCommuteMinutes(Number(e.target.value))}
          className="focus-ring w-20 rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm font-normal text-ink" />
      </label>
      <Button type="submit">저장</Button>
      <button type="button" onClick={onClose} className="focus-ring text-sm font-semibold text-ink-2">취소</button>
      {error && <p className="w-full text-sm text-error">{error}</p>}
    </form>
  )
}

// 드래프트 방식이므로 store 대신 콜백으로 저장/삭제를 받음
const SCHEDULE_PALETTE = ['#4285f4','#db4437','#0f9d58','#9c27b0','#00897b','#e64a19','#5c6bc0','#039be5','#8d6e63','#546e7a']

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
        <label className="text-xs font-semibold text-ink-2">색상</label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setColor('')}
            className={`h-6 w-6 rounded-full border-2 bg-ivory-card ${!color ? 'border-ink' : 'border-line'}`}
            title="기본"
          />
          {SCHEDULE_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full border-2 ${color === c ? 'border-ink' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
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

// 아이 추가 폼 + 등록된 아이 목록(수정/삭제). CareScheduleEditor와 MyPage에서 공용으로 쓴다.
export function ChildManager() {
  const { children, removeChild } = useCareScheduleStore()
  const [editingChildId, setEditingChildId] = useState<string | null>(null)

  const onRemove = (id: string, name: string) => {
    if (window.confirm(`'${name}'을(를) 삭제할까요? 이 아이의 학교·돌봄 일정도 함께 삭제돼요.`)) removeChild(id)
  }

  return (
    <>
      <ChildForm />
      {children.length > 0 && (
        <div className="flex flex-col gap-2">
          {children.map((c) => (
            <div key={c.id} className="flex flex-col gap-2">
              {editingChildId === c.id ? (
                <ChildEditForm key={c.id} id={c.id} onClose={() => setEditingChildId(null)} />
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-line p-3 text-sm">
                  <span>{c.name} · {c.grade}학년 · 통학 {c.commuteMinutes}분</span>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setEditingChildId(c.id)} className="focus-ring tap-target text-xs font-semibold text-ink-2">
                      수정
                    </button>
                    <button type="button" onClick={() => onRemove(c.id, c.name)} className="focus-ring tap-target text-xs font-semibold text-error">
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// 아이 등록 + 부모/아이 반복 일정 캘린더. GapSetup 페이지와 Home 메인페이지에서 공용으로 쓴다.
export function CareScheduleEditor() {
  const { children, schedules, exceptions, removeChild, addSchedule, removeSchedule, updateSchedule, addException, removeException } = useCareScheduleStore()
  const match = useMatchStore()
  const [view, setView] = useState<'schedule' | 'gap' | 'calendar'>('schedule')
  const [target, setTarget] = useState<Target>({ type: 'parent', parentLabel: 'mom' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [multiSelIds, setMultiSelIds] = useState<string[]>([])
  const [editingChildId, setEditingChildId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => toISO(new Date()))
  const [override, setOverride] = useState<{ id: string; start: string; end: string } | null>(null)

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
        addSchedule({ type, childId, daysOfWeek: [d], startTime: s.startTime, endTime: s.endTime, parentLabel: s.parentLabel })
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
      addSchedule({ type: s.type, childId: s.childId, daysOfWeek: s.daysOfWeek, startTime: s.startTime, endTime: punchStart, parentLabel: s.parentLabel })
    if (s.endTime > punchEnd)
      addSchedule({ type: s.type, childId: s.childId, daysOfWeek: s.daysOfWeek, startTime: punchEnd, endTime: s.endTime, parentLabel: s.parentLabel })
  }

  const onMove = (id: string, daysOfWeek: number[], startTime: string, endTime: string) => {
    const s = schedules.find((x) => x.id === id)
    if (!s) return
    const { id: _id, ...rest } = s
    updateSchedule(id, { ...rest, daysOfWeek, startTime, endTime })
  }

  // 공백 캘린더 탭
  const hasGapOn = (date: string) =>
    children.some((child) => computeGaps(child, date, schedules, exceptions).length > 0)
  const calDow = new Date(`${selectedDate}T00:00:00`).getDay()
  const calGaps = children.map((child) => ({
    child,
    gaps: computeGaps(child, selectedDate, schedules, exceptions),
  }))
  const calDaySchedules = schedules
    .filter((s) => s.daysOfWeek.includes(calDow))
    // 그 날의 예외(취소 또는 시간 변경 — computeGaps처럼 날짜당 1개)
    .map((s) => ({
      schedule: s,
      exception: exceptions.find((e) => e.scheduleId === s.id && e.date === selectedDate),
    }))
  const toggleCancel = (scheduleId: string, exceptionId: string | undefined) => {
    if (exceptionId) removeException(exceptionId)
    else addException({ scheduleId, date: selectedDate, startTime: null, endTime: null, isCancelled: true })
  }
  // Only offered when the day has no exception yet, so there is nothing to replace
  const saveOverride = async (scheduleId: string) => {
    if (!override || override.start >= override.end) return
    const ok = await addException({ scheduleId, date: selectedDate, startTime: override.start, endTime: override.end, isCancelled: false })
    if (ok) setOverride(null)
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
        <div className="flex flex-col gap-4">
          <div className="grid gap-6 sm:grid-cols-[1fr_240px]">
            {/* 월간 달력 */}
            <div className="min-w-0">
              <MonthCalendar
                selected={selectedDate}
                onSelect={setSelectedDate}
                renderBadge={(iso, sel) =>
                  hasGapOn(iso) ? (
                    <span className={`text-[10px] font-bold leading-none ${sel ? 'text-white' : 'text-warn'}`}>공백</span>
                  ) : null
                }
              />
            </div>

            {/* 선택 날짜 공백 요약 */}
            <div className="flex flex-col gap-3">
              <p className="text-sm font-bold text-ink">{formatDayLabel(selectedDate)}</p>
              {children.length === 0 ? (
                <p className="text-sm text-ink-2">아이와 일정을 등록하면 공백을 계산해요.</p>
              ) : (
                calGaps.map(({ child, gaps }) => (
                  <div key={child.id} className="rounded-xl border border-line p-3">
                    <p className="text-sm font-bold text-ink">{child.name}</p>
                    {gaps.length === 0 ? (
                      <p className="mt-1 text-sm text-ink-2">이 날은 돌봄 공백이 없어요</p>
                    ) : (
                      <div className="mt-2 flex flex-col gap-2">
                        {gaps.map((g, i) => (
                          <div key={i} className="rounded-lg bg-warn-bg px-3 py-2.5 text-sm text-warn">
                            <span className="font-bold">{g.start}~{g.end}</span>{' '}
                            <span className="opacity-80">({durationLabel(g.start, g.end)})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 이 날의 일정 — 그리드 아래 전체 너비 */}
          {calDaySchedules.length > 0 && (
            <div className="rounded-xl border border-line p-4">
              <p className="text-sm font-bold text-ink">{formatDayLabel(selectedDate)} 일정</p>
              <div className="mt-3 flex flex-col gap-3">
                {calDaySchedules.map(({ schedule, exception }) =>
                  override?.id === schedule.id ? (
                    <div key={schedule.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-1 text-ink-2">
                        {blockLabel(schedule, children)}
                        <input
                          type="time"
                          value={override.start}
                          onChange={(e) => setOverride({ ...override, start: e.target.value })}
                          aria-label="이 날 시작 시간"
                          className="focus-ring rounded border border-line px-1"
                        />
                        ~
                        <input
                          type="time"
                          value={override.end}
                          onChange={(e) => setOverride({ ...override, end: e.target.value })}
                          aria-label="이 날 끝 시간"
                          className="focus-ring rounded border border-line px-1"
                        />
                      </span>
                      <div className="flex shrink-0 gap-3">
                        <button
                          type="button"
                          onClick={() => saveOverride(schedule.id)}
                          disabled={override.start >= override.end}
                          className="focus-ring font-semibold text-green disabled:opacity-50"
                        >
                          저장
                        </button>
                        <button type="button" onClick={() => setOverride(null)} className="focus-ring font-semibold text-ink-2">
                          닫기
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div key={schedule.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                      <span className={exception?.isCancelled ? 'text-ink-2 line-through' : 'text-ink-2'}>
                        {blockLabel(schedule, children)} {schedule.startTime}~{schedule.endTime}
                        {exception && !exception.isCancelled && (
                          <b className="text-ink"> → 이 날만 {exception.startTime}~{exception.endTime}</b>
                        )}
                      </span>
                      <div className="flex shrink-0 gap-3">
                        {!exception && (
                          <button
                            type="button"
                            onClick={() => setOverride({ id: schedule.id, start: schedule.startTime, end: schedule.endTime })}
                            className="focus-ring font-semibold text-ink-2 hover:text-ink"
                          >
                            시간 변경
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleCancel(schedule.id, exception?.id)}
                          className={`focus-ring font-semibold ${exception ? 'text-green' : 'text-ink-2 hover:text-ink'}`}
                        >
                          {exception ? '되돌리기' : '이 날만 취소'}
                        </button>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
      <>
      <div className="flex flex-col gap-6">
        <p className="text-sm font-bold text-ink">아이 등록</p>
        <ChildForm />
        {children.length > 0 && (
          <div className="flex flex-col gap-2">
            {children.map((c) => (
              <div key={c.id} className="flex flex-col gap-2">
                {editingChildId === c.id ? (
                  <ChildEditForm key={c.id} id={c.id} onClose={() => setEditingChildId(null)} />
                ) : (
                  <div className="flex items-center justify-between rounded-xl border border-line p-3 text-sm">
                    <span>{c.name} · {c.grade}학년 · 통학 {c.commuteMinutes}분</span>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setEditingChildId(c.id)} className="focus-ring text-sm font-semibold text-ink-2">
                        수정
                      </button>
                      <button type="button" onClick={() => removeChild(c.id)} className="focus-ring text-sm font-semibold text-error">
                        삭제
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
                if (multiSelIds.length > 1) {
                  multiSelIds.filter((sid) => sid !== id).forEach((sid) => {
                    const s = schedules.find((x) => x.id === sid)
                    if (s) updateSchedule(sid, { ...s, color: data.color })
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
