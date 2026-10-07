import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHero } from '../components/PageHero'
import { Card } from '../components/Card'
import { WEEKDAY_LABELS, toISO } from '../data/date'
import { typeLabel } from '../data/scheduleLabel'
import { useAuthStore } from '../store/authStore'
import type { AuthUser } from '../api/auth'
import { useCareScheduleLoading, useCareScheduleStore } from '../store/careScheduleStore'
import { computeGaps } from '../data/gaps'
import { ChildManager } from '../components/CareScheduleEditor'

const providerLabels: Record<AuthUser['provider'], string> = {
  kakao: '카카오',
  naver: '네이버',
  local: '아이디',
}

function Section({ title, to, children }: { title: string; to: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-ink">{title}</p>
        <Link to={to} className="focus-ring tap-link text-xs font-semibold text-green hover:underline">
          전체 보기
        </Link>
      </div>
      {children}
    </Card>
  )
}

export function MyPage() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const { children, schedules, exceptions } = useCareScheduleStore()
  const loading = useCareScheduleLoading()

  // Earliest first so the list doesn't depend on the server's row order
  const recentSchedules = [...schedules].sort((a, b) => a.startTime.localeCompare(b.startTime)).slice(0, 3)
  const childName = (id: string | null) => children.find((c) => c.id === id)?.name
  const [today] = useState(() => toISO(new Date()))

  return (
    <div>
      <PageHero title="마이 페이지" />
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-2">
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-bold text-ink">내 정보</p>
          <p className="text-lg font-extrabold text-ink">{user?.name ?? user?.email ?? '사용자'}</p>
          <p className="text-xs text-ink-2">
            {user?.email && `${user.email} · `}
            {user ? `${providerLabels[user.provider] ?? '소셜'} 계정으로 로그인` : ''}
          </p>
          <button
            type="button"
            // Leave /mypage first, or RequireAuth would send us to /login with /mypage as the return path
            onClick={() => { navigate('/'); logout() }}
            className="focus-ring tap-target mt-2 self-start rounded-xl border border-line-2 px-4 py-2 text-sm font-semibold text-ink-2 hover:text-ink"
          >
            로그아웃
          </button>
        </Card>

        <Card className="flex flex-col gap-3">
          <p className="text-sm font-bold text-ink">아이 관리</p>
          {loading ? <p className="text-sm text-ink-2">불러오는 중...</p> : <ChildManager />}
        </Card>

        <Section title="오늘의 돌봄 공백" to="/gaps">
          {loading && <p className="text-sm text-ink-2">불러오는 중...</p>}
          {!loading && children.length === 0 && (
            <p className="text-sm text-ink-2">
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
                  <p className="mt-1 text-xs text-ink-2">오늘은 돌봄 공백이 없어요</p>
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
          {loading && <p className="text-sm text-ink-2">불러오는 중...</p>}
          {!loading && recentSchedules.length === 0 && <p className="text-sm text-ink-2">등록된 일정이 없어요</p>}
          {recentSchedules.map((s) => (
            <Link
              key={s.id}
              to="/calendar"
              className="focus-ring rounded-xl border border-line p-3 hover:border-green/40"
            >
              <p className="text-sm font-bold text-ink">{s.title || typeLabel(s)}</p>
              <p className="mt-1 text-xs text-ink-2">
                {s.daysOfWeek.map((d) => WEEKDAY_LABELS[d]).join('')} · {s.startTime}~{s.endTime}
                {s.childId && ` · ${childName(s.childId) ?? '알 수 없는 아이'}`}
              </p>
            </Link>
          ))}
        </Section>
      </div>
    </div>
  )
}
