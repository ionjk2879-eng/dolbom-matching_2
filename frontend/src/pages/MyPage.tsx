import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHero } from '../components/PageHero'
import { Card } from '../components/Card'
import { WEEKDAY_LABELS, toISO } from '../data/date'
import type { ScheduleType } from '../data/types'
import { useAuthStore } from '../store/authStore'
import { useCareScheduleLoading, useCareScheduleStore } from '../store/careScheduleStore'
import { computeGaps } from '../data/gaps'

const typeLabels: Record<ScheduleType, string> = {
  parent_work: '부모 근무',
  child_school: '아이 학교',
  care: '돌봄(선택한 옵션)',
}

function Section({ title, to, children }: { title: string; to: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-ink">{title}</p>
        <Link to={to} className="focus-ring text-xs font-semibold text-green hover:underline">
          전체 보기
        </Link>
      </div>
      {children}
    </Card>
  )
}

export function MyPage() {
  const user = useAuthStore((s) => s.user)
  const { children, schedules, exceptions } = useCareScheduleStore()
  const loading = useCareScheduleLoading()

  const recentSchedules = schedules.slice(0, 3)
  const [today] = useState(() => toISO(new Date()))

  return (
    <div>
      <PageHero title="마이 페이지" />
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-2">
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-bold text-ink">내 정보</p>
          <p className="text-lg font-extrabold text-ink">{user?.name ?? user?.email ?? '사용자'}</p>
          <p className="text-xs text-ink-3">
            {user?.email ?? user?.id} · 사용자
          </p>
        </Card>

        <Section title="오늘의 돌봄 공백" to="/gaps">
          {loading && <p className="text-sm text-ink-3">불러오는 중...</p>}
          {!loading && children.length === 0 && (
            <p className="text-sm text-ink-3">
              등록된 아이/일정이 없어요.{' '}
              <Link to="/gaps/setup" className="font-semibold text-green underline">
                등록하기
              </Link>
            </p>
          )}
          {children.map((child) => {
            const gaps = computeGaps(child, today, schedules, exceptions)
            return (
              <div key={child.id} className="rounded-xl border border-line p-3">
                <p className="text-sm font-bold text-ink">{child.name}</p>
                {gaps.length === 0 ? (
                  <p className="mt-1 text-xs text-ink-3">오늘은 돌봄 공백이 없어요</p>
                ) : (
                  gaps.map((g, i) => (
                    <span key={i} className="mt-1 inline-block rounded-lg bg-warn-bg px-2 py-1 text-xs font-bold text-warn">
                      {g.start}~{g.end}
                    </span>
                  ))
                )}
              </div>
            )
          })}
        </Section>

        <Section title="등록된 일정" to="/calendar">
          {loading && <p className="text-sm text-ink-3">불러오는 중...</p>}
          {!loading && recentSchedules.length === 0 && <p className="text-sm text-ink-3">등록된 일정이 없어요</p>}
          {recentSchedules.map((s) => (
            <Link
              key={s.id}
              to="/calendar"
              className="focus-ring rounded-xl border border-line p-3 hover:border-green/40"
            >
              <p className="text-sm font-bold text-ink">{s.title || typeLabels[s.type]}</p>
              <p className="mt-1 text-xs text-ink-3">
                {s.daysOfWeek.map((d) => WEEKDAY_LABELS[d]).join('')} · {s.startTime}~{s.endTime}
              </p>
            </Link>
          ))}
        </Section>
      </div>
    </div>
  )
}
