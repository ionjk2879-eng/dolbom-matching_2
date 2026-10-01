import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHero } from '../components/PageHero'
import { Card } from '../components/Card'
import { WEEKDAY_LABELS, toISO } from '../data/date'
import { computeGaps } from '../data/gaps'
import { useCareScheduleStore } from '../store/careScheduleStore'
import { blockLabel } from '../components/WeekScheduleGrid'

function durationLabel(start: string, end: string): string {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`
}

export function GapCalendar() {
  const { children, schedules, exceptions, addException, removeException } = useCareScheduleStore()
  const [exceptionError, setExceptionError] = useState('')
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selected, setSelected] = useState(() => toISO(new Date()))
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const hasGapOn = (date: string) =>
    children.some((child) => computeGaps(child, date, schedules, exceptions).length > 0)

  const cells = useMemo(() => {
    const startOffset = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const list: (string | null)[] = Array(startOffset).fill(null)
    for (let d = 1; d <= daysInMonth; d++) list.push(toISO(new Date(year, month, d)))
    return list
  }, [year, month])

  const selectedGapsByChild = children.map((child) => ({
    child,
    gaps: computeGaps(child, selected, schedules, exceptions),
  }))

  // 선택한 날짜에 원래 잡혀 있는 반복 일정 + 그 날의 취소 예외
  const selectedDow = new Date(`${selected}T00:00:00`).getDay()
  const selectedDaySchedules = schedules
    .filter((s) => s.daysOfWeek.includes(selectedDow))
    .map((s) => ({ schedule: s, cancel: exceptions.find((e) => e.scheduleId === s.id && e.date === selected && e.isCancelled) }))

  const toggleCancel = async (scheduleId: string, cancelId: string | undefined) => {
    setExceptionError('')
    try {
      if (cancelId) await removeException(cancelId)
      else await addException({ scheduleId, date: selected, startTime: null, endTime: null, isCancelled: true })
    } catch {
      setExceptionError('변경하지 못했어요. 잠시 후 다시 시도해주세요')
    }
  }

  return (
    <div>
      <PageHero title="돌봄 공백 캘린더" desc="아이 학교/부모 근무 일정을 바탕으로 돌봄이 필요한 시간을 자동으로 계산해요" />
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <Link to="/gaps/setup" className="focus-ring text-sm font-semibold text-green underline">
          아이/반복 일정 등록하기
        </Link>
      </div>
      <div className="mx-auto grid max-w-6xl gap-4 px-4 pb-10 pt-6 md:grid-cols-[1fr_360px]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              aria-label="이전 달"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="focus-ring rounded-lg border border-line-2 px-3 py-1.5 text-sm hover:bg-ivory-deep"
            >
              이전
            </button>
            <p className="text-sm font-bold text-ink">
              {year}년 {month + 1}월
            </p>
            <button
              type="button"
              aria-label="다음 달"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="focus-ring rounded-lg border border-line-2 px-3 py-1.5 text-sm hover:bg-ivory-deep"
            >
              다음
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink-3">
            {WEEKDAY_LABELS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((iso, i) => {
              if (!iso) return <div key={i} />
              const hasGap = hasGapOn(iso)
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelected(iso)}
                  className={`focus-ring flex aspect-square flex-col items-center justify-center gap-1 rounded-lg text-sm transition ${
                    selected === iso ? 'bg-green text-white' : 'text-ink hover:bg-ivory-deep'
                  }`}
                >
                  {Number(iso.slice(8))}
                  {hasGap && (
                    <span className={`text-[10px] font-bold ${selected === iso ? 'text-white' : 'text-warn'}`}>
                      공백
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <p className="text-sm font-bold text-ink">{selected}</p>
          {children.length === 0 && (
            <p className="text-sm text-ink-3">
              등록된 아이/일정이 없어요.{' '}
              <Link to="/gaps/setup" className="focus-ring font-semibold text-green underline">
                반복 일정을 먼저 등록해주세요
              </Link>
            </p>
          )}
          {selectedGapsByChild.map(({ child, gaps }) => (
            <div key={child.id} className="rounded-xl border border-line p-3">
              <p className="text-sm font-bold text-ink">{child.name}</p>
              {gaps.length === 0 ? (
                <p className="mt-1 text-xs text-ink-3">이 날은 돌봄 공백이 없어요</p>
              ) : (
                <div className="mt-2 flex flex-col gap-2">
                  {gaps.map((g, i) => (
                    <div key={i} className="rounded-lg bg-warn-bg px-3 py-2 text-xs text-warn">
                      <span className="font-bold">
                        {g.start}~{g.end}
                      </span>{' '}
                      ({durationLabel(g.start, g.end)}) 돌봄이 필요해요
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {selectedDaySchedules.length > 0 && (
            <div className="rounded-xl border border-line p-3">
              <p className="text-sm font-bold text-ink">이 날의 일정</p>
              <div className="mt-2 flex flex-col gap-2">
                {selectedDaySchedules.map(({ schedule, cancel }) => (
                  <div key={schedule.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className={cancel ? 'text-ink-3 line-through' : 'text-ink-2'}>
                      {blockLabel(schedule, children)} {schedule.startTime}~{schedule.endTime}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleCancel(schedule.id, cancel?.id)}
                      className={`focus-ring shrink-0 font-semibold ${cancel ? 'text-green' : 'text-error'}`}
                    >
                      {cancel ? '취소 되돌리기' : '이 날만 취소'}
                    </button>
                  </div>
                ))}
              </div>
              {exceptionError && <p className="mt-2 text-xs text-error">{exceptionError}</p>}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
