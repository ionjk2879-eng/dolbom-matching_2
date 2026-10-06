import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHero } from '../components/PageHero'
import { Card } from '../components/Card'
import { formatDayLabel, toISO } from '../data/date'
import { MonthCalendar } from '../components/MonthCalendar'
import type { ScheduleType } from '../data/types'
import { useScheduleStore } from '../store/scheduleStore'
import { useCareScheduleLoading, useCareScheduleStore } from '../store/careScheduleStore'

const typeLabels: Record<ScheduleType, string> = {
  parent_work: '부모 근무',
  child_school: '아이 학교',
  care: '돌봄(선택한 옵션)',
}

export function Schedule() {
  const { shareWithFamily, shareWithCenters } = useScheduleStore()
  const { schedules, children, removeSchedule } = useCareScheduleStore()
  const loading = useCareScheduleLoading()
  const childName = (id: string | null) => children.find((c) => c.id === id)?.name

  const [selected, setSelected] = useState(() => toISO(new Date()))

  const weekdayOf = (iso: string) => new Date(`${iso}T00:00:00`).getDay()
  const schedulesOn = (iso: string) => schedules.filter((s) => s.daysOfWeek.includes(weekdayOf(iso)))
  const dayItems = schedulesOn(selected).sort((a, b) => a.startTime.localeCompare(b.startTime))

  return (
    <div>
      <PageHero title="내 일정" desc="반복 주간 패턴으로 등록된 일정을 요일별로 확인하세요" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-6">
        <p className="text-xs text-ink-2">
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
          <MonthCalendar selected={selected} onSelect={setSelected} renderBadge={(iso, sel) => {
              const count = schedulesOn(iso).length
              return count > 0 && (
                <span className={`text-[10px] font-bold ${sel ? 'text-white' : 'text-green'}`}>{count}건</span>
              )
            }} />
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-ink">{formatDayLabel(selected)}</p>
            <Link
              to="/calendar/new"
              className="focus-ring rounded-xl bg-green px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              일정 등록
            </Link>
          </div>
          {loading && <p className="text-sm text-ink-2">불러오는 중...</p>}
          {!loading && dayItems.length === 0 && <p className="text-sm text-ink-2">등록된 일정이 없어요</p>}
          {dayItems.map((s) => (
            <div key={s.id} className="rounded-xl border border-line p-3">
              <p className="text-sm font-bold text-ink">{s.title || typeLabels[s.type]}</p>
              <p className="mt-1 text-xs text-ink-2">
                {s.title && `${typeLabels[s.type]} · `}
                {s.startTime}~{s.endTime}
                {s.childId && ` · ${childName(s.childId) ?? '알 수 없는 아이'}`}
              </p>
              {s.memo && <p className="mt-1.5 whitespace-pre-line text-xs text-ink-2">{s.memo}</p>}
              <div className="mt-2 flex justify-end gap-3 text-xs font-semibold">
                <Link to={`/calendar/${s.id}/edit`} className="focus-ring text-ink-2 hover:text-ink">
                  수정
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    window.confirm(`'${s.title || typeLabels[s.type]}' 일정을 삭제할까요?`) && removeSchedule(s.id)
                  }
                  className="focus-ring text-error hover:opacity-80"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
