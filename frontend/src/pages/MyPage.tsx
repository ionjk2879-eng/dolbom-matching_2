import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/Card'
import { ScheduleManager } from '../components/ScheduleManager'
import { ShareToggle } from '../components/ShareToggle'
import { centers } from '../data/centers'
import { WEEKDAY_LABELS, toISO } from '../data/date'
import { fitsSlot } from '../data/match'
import type { Offer } from '../data/types'
import { useAuthStore } from '../store/authStore'
import { useScheduleStore } from '../store/scheduleStore'
import { useConsultStore } from '../store/consultStore'
import { useRequestStore } from '../store/requestStore'

const centerName = (id: string) => centers.find((c) => c.id === id)?.name
const feeLabel = (fee: number) => (fee ? `월 ${fee / 10000}만원` : '무료')

const offerTag: Record<Offer['status'], [string, string]> = {
  pending: ['답변 대기', 'bg-warn-bg text-warn'],
  accepted: ['수락함', 'bg-green-soft text-green'],
  declined: ['거절함', 'bg-ivory-deep text-ink-2b'],
}

function SectionHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-bold text-ink">{title}</p>
      {children}
    </div>
  )
}

function MoreLink({ to, label = '전체 보기' }: { to: string; label?: string }) {
  return (
    <Link to={to} className="focus-ring whitespace-nowrap text-xs font-semibold text-green hover:text-ink">
      {label}
    </Link>
  )
}

export function MyPage() {
  const user = useAuthStore((s) => s.user)
  const { schedules, shareWithFamily, shareWithCenters, setShareWithFamily, setShareWithCenters } = useScheduleStore()
  const consults = useConsultStore((s) => s.consults)
  const { requests, offers, respondOffer } = useRequestStore()
  const [manager, setManager] = useState<{ startDate?: string; startEditId?: string } | null>(null)

  const now = new Date()
  const today = toISO(now)
  const week = Array.from({ length: 7 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + i))
  const weekEnd = toISO(week[6])

  const upcoming = schedules
    .filter((s) => s.date >= today)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
  const thisWeek = upcoming.filter((s) => s.date <= weekEnd)

  // Centers that cover the most of this week's schedules
  const matches = centers
    .map((c) => ({ c, covered: thisWeek.filter((s) => fitsSlot(c, s.date, s.start, s.end)).length }))
    .filter((m) => m.covered > 0)
    .sort((a, b) => b.covered - a.covered || b.c.match - a.c.match)
    .slice(0, 3)

  const pendingCount = offers.filter((o) => o.status === 'pending').length
  const openRequests = requests.filter((r) => r.status === 'open').length
  const recentConsults = [...consults].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 2)

  const shareSummary =
    shareWithFamily && shareWithCenters
      ? '가족과 연결된 센터 모두 내 일정을 볼 수 있어요'
      : shareWithFamily
        ? '가족만 내 일정을 볼 수 있어요'
        : shareWithCenters
          ? '연결된 센터만 해당 일정을 볼 수 있어요'
          : '내 일정은 나만 볼 수 있어요'

  return (
    <div>
      <div className="bg-ivory-deep">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-4 py-10">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-[-0.03em] text-ink">마이 페이지</h1>
            <p className="mt-2 text-sm text-ink-2">
              {schedules.length === 0
                ? '일정을 등록하면 그 시간에 맞는 센터를 찾아드려요'
                : '내 일정과 요청, 상담 현황을 한눈에 확인하세요'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-green-soft px-4 py-2 text-[13px] font-bold text-green">
              이번 주 일정 {thisWeek.length}건
            </span>
            <span className="rounded-full bg-warn-bg px-4 py-2 text-[13px] font-bold text-warn">
              답변 대기 제안 {pendingCount}건
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl items-start gap-4 px-4 pb-16 pt-10 lg:grid-cols-2">
        <Card highlight className="flex flex-col gap-3.5">
          <SectionHead title="다가오는 일정">
            <div className="flex items-center gap-3">
              <MoreLink to="/calendar" label="캘린더 보기" />
              <button
                type="button"
                onClick={() => setManager({})}
                className="focus-ring rounded-xl bg-green px-3.5 py-2 text-[13px] font-semibold text-white hover:opacity-90"
              >
                일정 관리
              </button>
            </div>
          </SectionHead>
          <div className="grid grid-cols-7 gap-1.5">
            {week.map((d, i) => {
              const has = upcoming.some((s) => s.date === toISO(d))
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-0.5 rounded-xl py-2 ${
                    i === 0 ? 'bg-green text-white' : 'border border-line-3 bg-ivory text-ink'
                  }`}
                >
                  <span className="text-[11px] font-semibold">{WEEKDAY_LABELS[d.getDay()]}</span>
                  <span className="text-[17px] font-extrabold">{d.getDate()}</span>
                  <span
                    className={`h-[5px] w-[5px] rounded-full ${has ? (i === 0 ? 'bg-white' : 'bg-green') : 'bg-transparent'}`}
                  />
                </div>
              )
            })}
          </div>
          {upcoming.length === 0 && <p className="text-sm text-ink-3">예정된 일정이 없어요</p>}
          <div className="flex flex-col gap-2">
            {upcoming.slice(0, 3).map((s) => {
              const [y, m, d] = s.date.split('-').map(Number)
              const label = s.date === today ? '오늘' : `${m}.${d} ${WEEKDAY_LABELS[new Date(y, m - 1, d).getDay()]}`
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setManager({ startDate: s.date, startEditId: s.id })}
                  className="focus-ring flex items-center gap-3.5 rounded-xl border border-line p-3 text-left hover:border-green/40"
                >
                  <span className="min-w-16 rounded-[10px] bg-green-soft px-2 py-1.5 text-center text-xs font-bold text-green">
                    {label}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-bold text-ink">{s.title}</span>
                    <span className="text-xs text-ink-3">
                      {s.start}~{s.end} · {centerName(s.centerId) ?? '센터 연결 안 됨'}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="flex flex-col gap-3.5">
          <SectionHead title="내 일정에 맞는 센터">
            <MoreLink to="/find" />
          </SectionHead>
          <p className="-mt-2.5 text-xs text-ink-3">
            {thisWeek.length === 0
              ? '일정을 등록하면 자동으로 골라드려요'
              : `이번 주 일정 ${thisWeek.length}건 기준으로 골랐어요`}
          </p>
          {thisWeek.length > 0 && matches.length === 0 && (
            <p className="text-sm text-ink-3">이번 주 일정 시간에 운영하는 센터가 없어요</p>
          )}
          <div className="flex flex-col gap-2">
            {matches.map(({ c, covered }) => (
              <Link
                key={c.id}
                to={`/centers/${c.id}`}
                className="focus-ring flex items-center gap-3.5 rounded-xl border border-line p-3 hover:border-green/40"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-bold text-ink">{c.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        c.seats ? 'bg-green-soft text-green' : 'bg-ivory-deep text-ink-2b'
                      }`}
                    >
                      {c.seats ? `빈자리 ${c.seats}` : '대기'}
                    </span>
                  </span>
                  <span className="text-xs text-ink-3">
                    {c.district} {c.area} · {c.hours} · {feeLabel(c.feeMonthly)} · 일정 {covered}건 가능
                  </span>
                </span>
                <span className="flex flex-col items-end">
                  <span className="text-xl font-extrabold text-green">{c.match}%</span>
                  <span className="text-[11px] text-ink-3">매칭</span>
                </span>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-3.5">
          <SectionHead title="돌봄 요청 · 받은 제안">
            <MoreLink to="/request#offers" />
          </SectionHead>
          <p className="text-[13px] text-ink-2">
            진행 중인 요청 <b className="text-ink">{openRequests}건</b> · 답변 대기 제안{' '}
            <b className="text-ink">{pendingCount}건</b>
          </p>
          {offers.length === 0 && <p className="text-sm text-ink-3">아직 받은 제안이 없어요</p>}
          <div className="flex flex-col gap-2">
            {offers.map((o) => {
              const [label, tagClass] = offerTag[o.status]
              const [, m, d] = o.start.split('-').map(Number)
              return (
                <div key={o.id} className="flex flex-col gap-2 rounded-xl border border-line p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-ink">{centerName(o.centerId) ?? '알 수 없는 센터'}</span>
                    <span className={`whitespace-nowrap rounded-full px-2.5 py-[3px] text-[11px] font-bold ${tagClass}`}>
                      {label}
                    </span>
                  </div>
                  <p className="text-[13px] leading-normal text-ink-2">{o.message}</p>
                  <p className="text-xs text-ink-3">
                    {m}월 {d}일 시작 · {o.time} · {feeLabel(o.fee)}
                    {o.bus && ' · 차량 운행'}
                  </p>
                  {o.status === 'pending' && (
                    <div className="mt-0.5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => respondOffer(o.id, 'accepted')}
                        className="focus-ring rounded-xl bg-green px-[18px] py-2 text-[13px] font-semibold text-white hover:opacity-90"
                      >
                        수락
                      </button>
                      <button
                        type="button"
                        onClick={() => respondOffer(o.id, 'declined')}
                        className="focus-ring rounded-xl border border-line-2 px-[18px] py-2 text-[13px] font-semibold text-ink hover:bg-ivory-deep"
                      >
                        거절
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-1">
            <SectionHead title="일정 공유">
              <MoreLink to="/calendar/settings" label="캘린더 설정" />
            </SectionHead>
            <div className="divide-y divide-line">
              <ShareToggle
                title="가족과 공유"
                desc="내 일정 전체를 가족 구성원이 볼 수 있어요"
                checked={shareWithFamily}
                onChange={setShareWithFamily}
              />
              <ShareToggle
                title="돌봄 업체와 공유"
                desc="센터를 연결한 일정만 해당 센터에 공유돼요"
                checked={shareWithCenters}
                onChange={setShareWithCenters}
              />
            </div>
            <p className="rounded-xl bg-green-soft px-3 py-2.5 text-xs font-semibold text-green">{shareSummary}</p>
          </Card>

          <Card className="flex flex-col gap-3">
            <SectionHead title="최근 상담 신청">
              <MoreLink to="/consults" />
            </SectionHead>
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
          </Card>

          <Card className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sand text-lg font-extrabold text-ink">
              {user?.name[0]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-extrabold text-ink">{user?.name}</p>
              <p className="mt-1 text-xs text-ink-3">
                아이디 {user?.id} · {user?.role === 'center' ? '센터 운영자' : '사용자'}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {manager && <ScheduleManager {...manager} onClose={() => setManager(null)} />}
    </div>
  )
}
