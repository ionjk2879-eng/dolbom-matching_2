import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHero } from '../components/PageHero'
import { Card } from '../components/Card'
import { formatDayLabel, toISO } from '../data/date'
import { MonthCalendar } from '../components/MonthCalendar'
import { computeGaps } from '../data/gaps'
import { useCareScheduleLoading, useCareScheduleStore } from '../store/careScheduleStore'
import { blockLabel } from '../data/scheduleLabel'

function durationLabel(start: string, end: string): string {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`
}

export function GapCalendar() {
  const { children, schedules, exceptions, addException, removeException, removeSchedule } = useCareScheduleStore()
  const loading = useCareScheduleLoading()
  const [selected, setSelected] = useState(() => toISO(new Date()))

  const hasGapOn = (date: string) =>
    children.some((child) => computeGaps(child, date, schedules, exceptions).length > 0)

  const selectedGapsByChild = children.map((child) => ({
    child,
    gaps: computeGaps(child, selected, schedules, exceptions),
  }))

  // 선택한 날짜에 원래 잡혀 있는 반복 일정 + 그 날의 예외(취소 또는 시간 변경 — computeGaps처럼 날짜당 1개)
  const selectedDow = new Date(`${selected}T00:00:00`).getDay()
  const selectedDaySchedules = schedules
    .filter((s) => s.daysOfWeek.includes(selectedDow))
    .map((s) => ({ schedule: s, exception: exceptions.find((e) => e.scheduleId === s.id && e.date === selected) }))

  const [editing, setEditing] = useState<{ id: string; start: string; end: string } | null>(null)

  // Schedules whose cancel/undo request is in flight; blocks a second click from saving a duplicate
  const [pending, setPending] = useState<string[]>([])

  // Failures show in StoreErrorBanner
  const toggleCancel = async (scheduleId: string, cancelId: string | undefined) => {
    if (pending.includes(scheduleId)) return
    setPending((p) => [...p, scheduleId])
    if (cancelId) await removeException(cancelId)
    else await addException({ scheduleId, date: selected, startTime: null, endTime: null, isCancelled: true })
    setPending((p) => p.filter((id) => id !== scheduleId))
  }

  // Only offered when the day has no exception yet, so there is nothing to replace
  const saveOverride = async (scheduleId: string) => {
    if (!editing || editing.start >= editing.end || pending.includes(scheduleId)) return
    setPending((p) => [...p, scheduleId])
    const ok = await addException({ scheduleId, date: selected, startTime: editing.start, endTime: editing.end, isCancelled: false })
    setPending((p) => p.filter((id) => id !== scheduleId))
    if (ok) setEditing(null)
  }

  return (
    <div>
      <PageHero title="돌봄 공백 캘린더" back="/" desc="아이 학교/부모 근무 일정을 바탕으로 돌봄이 필요한 시간을 자동으로 계산해요" />
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <Link to="/" className="focus-ring tap-link text-sm font-semibold text-green underline">
          일정 등록 / 맞춤 매칭으로 돌아가기
        </Link>
      </div>
      <div className="mx-auto grid max-w-6xl gap-4 px-4 pb-10 pt-6 md:grid-cols-[1fr_360px]">
        <Card>
          <MonthCalendar selected={selected} onSelect={setSelected} renderBadge={(iso, sel) =>
              hasGapOn(iso) && (
                <span className={`text-xs font-bold leading-none ${sel ? 'text-white' : 'text-warn'}`}>공백</span>
              )
            } />
        </Card>

        <Card className="flex flex-col gap-4">
          <p className="text-sm font-bold text-ink">{formatDayLabel(selected)}</p>
          {loading && <p className="text-sm text-ink-2">불러오는 중...</p>}
          {!loading && children.length === 0 && (
            <p className="text-sm text-ink-2">
              등록된 아이/일정이 없어요.{' '}
              <Link to="/gaps/setup" className="focus-ring tap-link font-semibold text-green underline">
                반복 일정을 먼저 등록해주세요
              </Link>
            </p>
          )}
          {selectedGapsByChild.map(({ child, gaps }) => (
            <div key={child.id} className="rounded-xl border border-line p-3">
              <p className="text-sm font-bold text-ink">{child.name}</p>
              {gaps.length === 0 ? (
                <p className="mt-1 text-xs text-ink-2">이 날은 돌봄 공백이 없어요</p>
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
                {selectedDaySchedules.map(({ schedule, exception }) => {
                  const cancelled = exception?.isCancelled
                  const busy = pending.includes(schedule.id)
                  if (editing?.id === schedule.id)
                    return (
                      <div key={schedule.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="flex items-center gap-1 text-ink-2">
                          {blockLabel(schedule, children)}
                          <input
                            type="time"
                            value={editing.start}
                            onChange={(e) => setEditing({ ...editing, start: e.target.value })}
                            aria-label="이 날 시작 시간"
                            className="focus-ring rounded border border-line px-1"
                          />
                          ~
                          <input
                            type="time"
                            value={editing.end}
                            onChange={(e) => setEditing({ ...editing, end: e.target.value })}
                            aria-label="이 날 끝 시간"
                            className="focus-ring rounded border border-line px-1"
                          />
                        </span>
                        <div className="flex shrink-0 gap-3">
                          <button
                            type="button"
                            onClick={() => saveOverride(schedule.id)}
                            disabled={busy || editing.start >= editing.end}
                            className="focus-ring tap-target font-semibold text-green disabled:opacity-50"
                          >
                            저장
                          </button>
                          <button type="button" onClick={() => setEditing(null)} className="focus-ring tap-target font-semibold text-ink-2">
                            닫기
                          </button>
                        </div>
                      </div>
                    )
                  return (
                  <div key={schedule.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className={cancelled ? 'text-ink-2 line-through' : 'text-ink-2'}>
                      {blockLabel(schedule, children)} {schedule.startTime}~{schedule.endTime}
                      {exception && !cancelled && (
                        <b className="text-ink">
                          {' '}→ 이 날만 {exception.startTime}~{exception.endTime}
                        </b>
                      )}
                    </span>
                    <div className="flex shrink-0 gap-3">
                      {!exception && (
                        <button
                          type="button"
                          onClick={() => setEditing({ id: schedule.id, start: schedule.startTime, end: schedule.endTime })}
                          className="focus-ring tap-target font-semibold text-ink-2 hover:text-ink"
                        >
                          시간 변경
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleCancel(schedule.id, exception?.id)}
                        disabled={busy}
                        className={`focus-ring tap-target font-semibold ${exception ? 'text-green' : 'text-ink-2 hover:text-ink'}`}
                      >
                        {cancelled ? '취소 되돌리기' : exception ? '되돌리기' : '이 날만 취소'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          window.confirm(
                            `'${blockLabel(schedule, children)}' 일정을 삭제할까요? 이 날만이 아니라 매주 반복되는 일정 전체가 삭제돼요.`,
                          ) && removeSchedule(schedule.id)
                        }
                        className="focus-ring tap-target font-semibold text-error"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
