import { useState } from 'react'
import { MonthCalendar } from './MonthCalendar'
import { useCareScheduleStore } from '../store/careScheduleStore'
import { blockLabel } from '../data/scheduleLabel'
import { formatDayLabel } from '../data/date'
import { computeGaps } from '../data/gaps'

function durationLabel(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`
}

// 공백 캘린더 탭: 월간 달력 + 날짜별 공백 + 이 날만 취소/시간 변경.
// selectedDate is owned by CareScheduleEditor so the picked day survives tab switches
export function GapCalendarTab({ selectedDate, onSelectDate }: { selectedDate: string; onSelectDate: (d: string) => void }) {
  const { children, schedules, exceptions, addException, removeException } = useCareScheduleStore()
  // The date is kept with the form so picking another day can't save it there
  const [override, setOverride] = useState<{ id: string; date: string; start: string; end: string } | null>(null)
  // Schedules whose exception request is in flight; blocks a double click from saving a duplicate
  const [pending, setPending] = useState<string[]>([])

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
  const withPending = async (scheduleId: string, run: () => Promise<boolean>) => {
    if (pending.includes(scheduleId)) return false
    setPending((p) => [...p, scheduleId])
    const ok = await run()
    setPending((p) => p.filter((id) => id !== scheduleId))
    return ok
  }
  const toggleCancel = (scheduleId: string, exceptionId: string | undefined) =>
    withPending(scheduleId, () =>
      exceptionId
        ? removeException(exceptionId)
        : addException({ scheduleId, date: selectedDate, startTime: null, endTime: null, isCancelled: true }),
    )
  // A cleared time input gives '', which would otherwise pass the start < end check
  const overrideValid = !!override && !!override.start && !!override.end && override.start < override.end
  // Only offered when the day has no exception yet, so there is nothing to replace
  const saveOverride = async (scheduleId: string) => {
    if (!override || !overrideValid) return
    const { date, start, end } = override
    const ok = await withPending(scheduleId, () =>
      addException({ scheduleId, date, startTime: start, endTime: end, isCancelled: false }),
    )
    if (ok) setOverride(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-6 sm:grid-cols-[1fr_240px]">
        {/* 월간 달력 */}
        <div className="min-w-0">
          <MonthCalendar
            selected={selectedDate}
            onSelect={onSelectDate}
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
              override?.id === schedule.id && override.date === selectedDate && !exception ? (
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
                      disabled={!overrideValid || pending.includes(schedule.id)}
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
                        onClick={() => setOverride({ id: schedule.id, date: selectedDate, start: schedule.startTime, end: schedule.endTime })}
                        className="focus-ring font-semibold text-ink-2 hover:text-ink"
                      >
                        시간 변경
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleCancel(schedule.id, exception?.id)}
                      disabled={pending.includes(schedule.id)}
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
  )
}
