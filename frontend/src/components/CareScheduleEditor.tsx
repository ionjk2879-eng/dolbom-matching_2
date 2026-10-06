import { useState, type FormEvent } from 'react'
import { Button } from './Button'
import { WeekScheduleGrid, type Target } from './WeekScheduleGrid'
import { GapWeekGrid } from './GapWeekGrid'
import { useCareScheduleStore } from '../store/careScheduleStore'
import { blockLabel } from '../data/scheduleLabel'
import { useMatchStore } from '../store/matchStore'
import { REGIONS } from '../data/careMatch'
import { DISTRICTS } from '../data/districts'

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
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="child-name" className="text-xs font-semibold text-ink-2">
          아이 이름
        </label>
        <input
          id="child-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="focus-ring mt-1 w-32 rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="child-grade" className="text-xs font-semibold text-ink-2">
          학년
        </label>
        <select
          id="child-grade"
          value={grade}
          onChange={(e) => setGrade(Number(e.target.value))}
          className="focus-ring mt-1 rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm"
        >
          {[1, 2, 3, 4, 5, 6].map((g) => (
            <option key={g} value={g}>
              {g}학년
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="child-commute" className="text-xs font-semibold text-ink-2">
          통학시간(분)
        </label>
        <input
          id="child-commute"
          type="number"
          min={0}
          value={commuteMinutes}
          onChange={(e) => setCommuteMinutes(Number(e.target.value))}
          className="focus-ring mt-1 w-24 rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm"
        />
      </div>
      <Button type="submit">아이 추가</Button>
      {error && <p className="w-full text-xs text-error">{error}</p>}
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
    if (!name) return setError('이름을 입력해주세요')
    if (await updateChild(id, { name, grade, commuteMinutes })) onClose()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-ivory-card p-3">
      <div>
        <label className="text-xs font-semibold text-ink-2">이름</label>
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="focus-ring mt-1 w-32 rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="text-xs font-semibold text-ink-2">학년</label>
        <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}
          className="focus-ring mt-1 rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm">
          {[1, 2, 3, 4, 5, 6].map((g) => <option key={g} value={g}>{g}학년</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-ink-2">통학시간(분)</label>
        <input type="number" min={0} value={commuteMinutes} onChange={(e) => setCommuteMinutes(Number(e.target.value))}
          className="focus-ring mt-1 w-24 rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm" />
      </div>
      <Button type="submit">저장</Button>
      <button type="button" onClick={onClose} className="focus-ring text-xs font-semibold text-ink-2">취소</button>
      {error && <p className="w-full text-xs text-error">{error}</p>}
    </form>
  )
}

function ScheduleEditForm({ id, onClose }: { id: string; onClose: () => void }) {
  const { children, schedules, updateSchedule, removeSchedule } = useCareScheduleStore()
  const schedule = schedules.find((s) => s.id === id)
  const [startTime, setStartTime] = useState(schedule?.startTime ?? '')
  const [endTime, setEndTime] = useState(schedule?.endTime ?? '')
  const [error, setError] = useState('')
  if (!schedule) return null

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (startTime >= endTime) return setError('끝나는 시간이 시작 시간보다 늦어야 해요')
    const { id: _id, ...rest } = schedule // eslint-disable-line @typescript-eslint/no-unused-vars
    if (await updateSchedule(id, { ...rest, startTime, endTime })) onClose()
  }

  const onRemove = async () => {
    if (!window.confirm(`'${blockLabel(schedule, children)}' 일정을 삭제할까요?`)) return
    if (await removeSchedule(id)) onClose()
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
      <Button type="submit">저장</Button>
      <button type="button" onClick={onRemove} className="focus-ring text-xs font-semibold text-error">
        삭제
      </button>
      <button type="button" onClick={onClose} className="focus-ring text-xs font-semibold text-ink-2">
        취소
      </button>
      {error && <p className="w-full text-xs text-error">{error}</p>}
    </form>
  )
}

// 아이 등록 + 부모/아이 반복 일정 캘린더. GapSetup 페이지와 Home 메인페이지에서 공용으로 쓴다.
export function CareScheduleEditor() {
  const { children, schedules, removeChild, addSchedule, removeSchedule, updateSchedule } = useCareScheduleStore()
  const match = useMatchStore()
  const [view, setView] = useState<'schedule' | 'gap'>('schedule')
  const [target, setTarget] = useState<Target>({ type: 'parent', parentLabel: 'mom' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingChildId, setEditingChildId] = useState<string | null>(null)

  const type = target.type === 'parent' ? 'parent_work' as const : 'child_school' as const
  const childId = target.type === 'child' ? target.childId : null
  const parentLabel = target.type === 'parent' ? target.parentLabel : undefined

  const activeSchedules = schedules.filter((s) =>
    target.type === 'parent'
      ? s.type === 'parent_work' && s.parentLabel === parentLabel
      : (s.type === 'child_school' || s.type === 'care') && s.childId === target.childId
  )

  const onCreate = (daysOfWeek: number[], startTime: string, endTime: string) => {
    // 드래그 범위와 겹치는 블록 전체를 한 번씩만 제거
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

    // 드래그 범위 밖 요일은 원래 시간 그대로 단일 요일 블록으로 복원
    overlapping.forEach((s) => {
      s.daysOfWeek.filter((d) => !daysOfWeek.includes(d)).forEach((d) =>
        addSchedule({ type, childId, daysOfWeek: [d], startTime: s.startTime, endTime: s.endTime, parentLabel: s.parentLabel })
      )
    })

    // 드래그 범위 각 요일에 병합 블록 생성
    daysOfWeek.forEach((day) => {
      const dayOverlap = overlapping.filter((s) => s.daysOfWeek.includes(day))
      const mergedStart = [startTime, ...dayOverlap.map((s) => s.startTime)].sort()[0]
      const mergedEnd = [endTime, ...dayOverlap.map((s) => s.endTime)].sort().reverse()[0]
      addSchedule({ type, childId, daysOfWeek: [day], startTime: mergedStart, endTime: mergedEnd, parentLabel })
    })
  }

  const onPunch = async (id: string, punchStart: string, punchEnd: string) => {
    const s = schedules.find((x) => x.id === id)
    if (!s) return
    const ok = await removeSchedule(id)
    if (!ok) return
    if (s.startTime < punchStart)
      await addSchedule({ type: s.type, childId: s.childId, daysOfWeek: s.daysOfWeek, startTime: s.startTime, endTime: punchStart, parentLabel: s.parentLabel })
    if (s.endTime > punchEnd)
      await addSchedule({ type: s.type, childId: s.childId, daysOfWeek: s.daysOfWeek, startTime: punchEnd, endTime: s.endTime, parentLabel: s.parentLabel })
  }

  const onMove = (id: string, daysOfWeek: number[], startTime: string, endTime: string) => {
    const s = schedules.find((x) => x.id === id)
    if (!s) return
    const { id: _id, ...rest } = s // eslint-disable-line @typescript-eslint/no-unused-vars
    updateSchedule(id, { ...rest, daysOfWeek, startTime, endTime })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 최상위 탭: 일정 등록 / 공백 패턴 */}
      <div className="inline-flex self-start rounded-xl border border-line bg-ivory-deep-2 p-1">
        <button
          type="button"
          onClick={() => setView('schedule')}
          className={`focus-ring rounded-lg px-4 py-1.5 text-xs font-semibold ${view === 'schedule' ? 'bg-ivory text-ink shadow-sm' : 'text-ink-2'}`}
        >
          일정 등록
        </button>
        <button
          type="button"
          onClick={() => setView('gap')}
          className={`focus-ring rounded-lg px-4 py-1.5 text-xs font-semibold ${view === 'gap' ? 'bg-ivory text-ink shadow-sm' : 'text-ink-2'}`}
        >
          공백 패턴
        </button>
      </div>

      {view === 'gap' ? (
        <GapWeekGrid children={children} schedules={schedules} />
      ) : (
      <>
      <div className="flex flex-col gap-3">
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
                      <button type="button" onClick={() => setEditingChildId(c.id)} className="focus-ring text-xs font-semibold text-ink-2">
                        수정
                      </button>
                      <button type="button" onClick={() => removeChild(c.id)} className="focus-ring text-xs font-semibold text-error">
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

      <div className="flex flex-col gap-3">
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
                className={`focus-ring rounded-lg px-3 py-1.5 text-xs font-semibold ${
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
                className={`focus-ring rounded-lg px-3 py-1.5 text-xs font-semibold ${
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
        <WeekScheduleGrid
          schedules={activeSchedules}
          kids={children}
          target={target}
          onCreate={onCreate}
          onEdit={setEditingId}
          onDelete={(id) => removeSchedule(id)}
          onPunch={onPunch}
          onMove={onMove}
        />
        {editingId && <ScheduleEditForm key={editingId} id={editingId} onClose={() => setEditingId(null)} />}
      </div>
      </>
      )}
    </div>
  )
}
