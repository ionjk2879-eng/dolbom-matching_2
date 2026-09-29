import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHero } from '../components/PageHero'
import { Card } from '../components/Card'
import { RepeatBadge } from '../components/RepeatBadge'
import { centers } from '../data/centers'
import { WEEKDAY_LABELS, toISO } from '../data/date'
import { useScheduleStore } from '../store/scheduleStore'

export function Schedule() {
  const { schedules, shareWithFamily, shareWithCenters, removeSchedule, removeRepeat } = useScheduleStore()
  const [params] = useSearchParams()
  // ?date= comes back from the create/edit page so the calendar reopens on that day
  const paramDate = params.get('date') ?? ''
  const initialDate = /^\d{4}-\d{2}-\d{2}$/.test(paramDate) ? paramDate : toISO(new Date())
  const [viewDate, setViewDate] = useState(() => {
    const [y, m] = initialDate.split('-').map(Number)
    return new Date(y, m - 1, 1)
  })
  const [selected, setSelected] = useState(initialDate)
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const cells = useMemo(() => {
    const startOffset = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const list: (string | null)[] = Array(startOffset).fill(null)
    for (let d = 1; d <= daysInMonth; d++) list.push(toISO(new Date(year, month, d)))
    return list
  }, [year, month])

  const dayItems = schedules.filter((s) => s.date === selected).sort((a, b) => a.start.localeCompare(b.start))

  return (
    <div>
      <PageHero title="내 일정" desc="돌봄 일정을 달력에서 한눈에 관리하세요" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-6">
        <p className="text-xs text-ink-3">
          가족 공유 {shareWithFamily ? '켜짐' : '꺼짐'} · 업체 공유 {shareWithCenters ? '켜짐' : '꺼짐'}
        </p>
        <Link
          to="/calendar/settings"
          className="focus-ring rounded-full border border-line-2 px-3 py-1.5 text-xs font-semibold text-ink-2 hover:border-green/50"
        >
          캘린더 설정
        </Link>
      </div>
      <div className="mx-auto grid max-w-6xl gap-4 px-4 pb-10 pt-4 md:grid-cols-[1fr_320px]">
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
              const count = schedules.filter((s) => s.date === iso).length
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
                  {count > 0 && (
                    <span className={`text-[10px] font-bold ${selected === iso ? 'text-white' : 'text-green'}`}>
                      {count}건
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-ink">{selected}</p>
            <Link
              to={`/calendar/new?date=${selected}`}
              className="focus-ring rounded-xl bg-green px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              일정 등록
            </Link>
          </div>
          {dayItems.length === 0 && <p className="text-sm text-ink-3">등록된 일정이 없어요</p>}
          {dayItems.map((s) => (
            <div key={s.id} className="rounded-xl border border-line p-3">
              <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
                {s.title}
                {s.repeatId && <RepeatBadge />}
              </p>
              <p className="mt-1 text-xs text-ink-3">
                {s.start}~{s.end}
                {s.centerId && ` · ${centers.find((c) => c.id === s.centerId)?.name}`}
              </p>
              {s.memo && <p className="mt-1 text-xs text-ink-2">{s.memo}</p>}
              {shareWithCenters && s.centerId && (
                <span className="mt-2 inline-block rounded-full bg-green-soft px-2 py-0.5 text-[10px] font-bold text-green">
                  센터에 공유 중
                </span>
              )}
              <div className="mt-2 flex justify-end gap-3 text-xs font-semibold">
                <Link to={`/calendar/${s.id}/edit`} className="focus-ring text-ink-2 hover:text-ink">
                  수정
                </Link>
                <button
                  type="button"
                  onClick={() => window.confirm(`'${s.title}' 일정을 삭제할까요?`) && removeSchedule(s.id)}
                  className="focus-ring text-error hover:opacity-80"
                >
                  삭제
                </button>
                {s.repeatId && (
                  <button
                    type="button"
                    onClick={() =>
                      s.repeatId &&
                      window.confirm(`'${s.title}' 반복 일정을 모두 삭제할까요?`) &&
                      removeRepeat(s.repeatId)
                    }
                    className="focus-ring text-error hover:opacity-80"
                  >
                    반복 전체 삭제
                  </button>
                )}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
