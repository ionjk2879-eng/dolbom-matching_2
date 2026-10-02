import { useState, type FormEvent } from 'react'
import { Button } from './Button'
import { WeekScheduleGrid, type Target } from './WeekScheduleGrid'
import { useCareScheduleStore } from '../store/careScheduleStore'
import { blockLabel } from '../data/scheduleLabel'

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
    // On failure the form stays open and StoreErrorBanner shows the error
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
  const { children, schedules, removeChild, addSchedule } = useCareScheduleStore()
  const [target, setTarget] = useState<Target>({ type: 'parent' })
  const [editingId, setEditingId] = useState<string | null>(null)

  const onCreate = (daysOfWeek: number[], startTime: string, endTime: string) => {
    if (target.type === 'parent') {
      addSchedule({ type: 'parent_work', childId: null, daysOfWeek, startTime, endTime })
    } else {
      addSchedule({ type: 'child_school', childId: target.childId, daysOfWeek, startTime, endTime })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-bold text-ink">아이 등록</p>
        <ChildForm />
        {children.length > 0 && (
          <div className="flex flex-col gap-2">
            {children.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-line p-3 text-sm">
                <span>
                  {c.name} · {c.grade}학년 · 통학 {c.commuteMinutes}분
                </span>
                <button
                  type="button"
                  onClick={() =>
                    window.confirm(`${c.name}을(를) 삭제할까요? 이 아이의 학교·돌봄 일정도 함께 삭제돼요.`) && removeChild(c.id)
                  }
                  className="focus-ring text-xs font-semibold text-error"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-ink">반복 일정 캘린더</p>
          <div className="inline-flex rounded-xl border border-line bg-ivory-deep-2 p-1">
            <button
              type="button"
              onClick={() => setTarget({ type: 'parent' })}
              className={`focus-ring rounded-lg px-3 py-1.5 text-xs font-semibold ${target.type === 'parent' ? 'bg-ivory text-ink' : 'text-ink-2'}`}
            >
              부모 근무
            </button>
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
          <p className="text-xs text-ink-3">
            지금은 "부모 근무"만 등록할 수 있어요. 아이 학교 일정을 넣으려면 위에서 아이를 먼저 등록해주세요.
          </p>
        )}
        <WeekScheduleGrid
          schedules={schedules}
          kids={children}
          target={target}
          onCreate={onCreate}
          onSelect={setEditingId}
        />
        {editingId && <ScheduleEditForm key={editingId} id={editingId} onClose={() => setEditingId(null)} />}
      </div>
    </div>
  )
}
