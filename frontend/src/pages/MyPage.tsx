import { Link } from 'react-router-dom'
import { PageHero } from '../components/PageHero'
import { Card } from '../components/Card'
import { centers } from '../data/centers'
import { toISO } from '../data/date'
import { useAuthStore } from '../store/authStore'
import { useScheduleStore } from '../store/scheduleStore'
import { useConsultStore } from '../store/consultStore'
import { useRequestStore } from '../store/requestStore'

const centerName = (id: string) => centers.find((c) => c.id === id)?.name

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
  const schedules = useScheduleStore((s) => s.schedules)
  const consults = useConsultStore((s) => s.consults)
  const { requests, offers } = useRequestStore()

  const today = toISO(new Date())
  const upcoming = schedules
    .filter((s) => s.date >= today)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    .slice(0, 3)
  const recentConsults = [...consults].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3)
  const openRequests = requests.filter((r) => r.status === 'open').length
  const pendingOffers = offers.filter((o) => o.status === 'pending').length

  return (
    <div>
      <PageHero title="마이 페이지" />
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-2">
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-bold text-ink">내 정보</p>
          <p className="text-lg font-extrabold text-ink">{user?.name}</p>
          <p className="text-xs text-ink-3">
            {user?.email ?? user?.id} · 사용자
          </p>
        </Card>

        <Section title="돌봄 요청" to="/request#manage">
          <div className="flex gap-6 text-sm">
            <p className="text-ink-2">
              진행 중인 요청 <span className="font-bold text-ink">{openRequests}건</span>
            </p>
            <Link to="/request#offers" className="focus-ring text-ink-2 hover:text-ink">
              답변 대기 제안 <span className="font-bold text-ink">{pendingOffers}건</span>
            </Link>
          </div>
        </Section>

        <Section title="다가오는 일정" to="/calendar">
          {upcoming.length === 0 && <p className="text-sm text-ink-3">예정된 일정이 없어요</p>}
          {upcoming.map((s) => (
            <Link
              key={s.id}
              to={`/calendar?date=${s.date}`}
              className="focus-ring rounded-xl border border-line p-3 hover:border-green/40"
            >
              <p className="text-sm font-bold text-ink">{s.title}</p>
              <p className="mt-1 text-xs text-ink-3">
                {s.date} {s.start}~{s.end}
                {s.centerId && ` · ${centerName(s.centerId)}`}
              </p>
            </Link>
          ))}
        </Section>

        <Section title="최근 상담 신청" to="/consults">
          {recentConsults.length === 0 && <p className="text-sm text-ink-3">아직 신청한 상담이 없어요</p>}
          {recentConsults.map((c) => (
            <Link
              key={c.id}
              to={`/centers/${c.centerId}`}
              className="focus-ring rounded-xl border border-line p-3 hover:border-green/40"
            >
              <p className="text-sm font-bold text-ink">{centerName(c.centerId) ?? '알 수 없는 센터'}</p>
              <p className="mt-1 text-xs text-ink-3">희망 상담일 {c.date}</p>
            </Link>
          ))}
        </Section>
      </div>
    </div>
  )
}
