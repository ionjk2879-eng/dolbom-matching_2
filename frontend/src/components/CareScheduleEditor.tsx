import { useState, type FormEvent } from 'react'
import { Button } from './Button'
import { WeekScheduleGrid, type Target } from './WeekScheduleGrid'
import { useCareScheduleStore } from '../store/careScheduleStore'

function ChildForm() {
  const addChild = useCareScheduleStore((s) => s.addChild)
  const [name, setName] = useState('')
  const [grade, setGrade] = useState(1)
  const [commuteMinutes, setCommuteMinutes] = useState(20)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name) return
    addChild({ name, grade, commuteMinutes })
    setName('')
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
    </form>
  )
}

// 아이 등록 + 부모/아이 반복 일정 캘린더. GapSetup 페이지와 Home 메인페이지에서 공용으로 쓴다.
export function CareScheduleEditor() {
  const { children, schedules, removeChild, addSchedule, removeSchedule } = useCareScheduleStore()
  const [target, setTarget] = useState<Target>({ type: 'parent' })

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
                <button type="button" onClick={() => removeChild(c.id)} className="focus-ring text-xs font-semibold text-error">
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
          onDelete={removeSchedule}
        />
      </div>
    </div>
  )
}
