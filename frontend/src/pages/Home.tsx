import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Chip } from '../components/Chip'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { SeatBadge } from '../components/SeatBadge'
import { Calendar } from '../components/Calendar'
import { PlaceholderImage } from '../components/PlaceholderImage'
import { useMatchStore } from '../store/matchStore'
import { centers } from '../data/centers'
import { events } from '../data/events'
import { newsItems, infoArticles } from '../data/info'

const orgTypes = ['다함께돌봄센터', '지역아동센터', '초등돌봄교실', '청소년방과후아카데미', '공동육아나눔터']
const grades = ['유아', '초1~2', '초3~4', '초5~6']
const times = ['~오후5시', '~오후7시', '오후7시 이후']
const needs = ['차량 운행', '무료·저비용', '평점 높은 곳', '빈자리 있음']
const partners = ['대전광역시', '유성구청', '동구청', '중구청', '서구청', '대덕구청', '육아종합지원센터']

export function Home() {
  const navigate = useNavigate()
  const match = useMatchStore()
  const [heroArea, setHeroArea] = useState('')
  const [heroGrade, setHeroGrade] = useState('')
  const [heroTime, setHeroTime] = useState('')
  const [selectedOrgTypes, setSelectedOrgTypes] = useState<string[]>([])
  const [infoTab, setInfoTab] = useState<'play' | 'care' | 'card'>('play')
  const [appliedEvents, setAppliedEvents] = useState<string[]>([])

  const toggleOrgType = (t: string) =>
    setSelectedOrgTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  const toggleApply = (id: string) =>
    setAppliedEvents((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const goSearch = () => {
    match.setArea(heroArea)
    match.setGrade(heroGrade)
    match.setTime(heroTime)
    navigate('/find')
  }

  const goMatch = () => navigate('/find')

  const matchedCount = match.grade
    ? centers.filter((c) => c.grade.includes(match.grade.replace('초', ''))).length || centers.length
    : centers.length

  return (
    <div>
      {/* 히어로 */}
      <section className="bg-ivory-deep">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-ink md:text-4xl">
            함께 돌보면, 아이의 오후가 든든해져요
          </h1>
          <div className="mx-auto mt-8 flex max-w-3xl flex-col gap-2 rounded-2xl border border-line bg-ivory-card p-3 shadow-[0_24px_40px_-28px_rgba(60,50,30,.45)] md:flex-row">
            <select
              aria-label="지역"
              value={heroArea}
              onChange={(e) => setHeroArea(e.target.value)}
              className="focus-ring flex-1 rounded-xl border border-line-2 bg-ivory-card px-4 py-3 text-sm"
            >
              <option value="">지역 선택</option>
              <option>유성구</option>
              <option>동구</option>
              <option>중구</option>
              <option>서구</option>
              <option>대덕구</option>
            </select>
            <select
              aria-label="아이 학년"
              value={heroGrade}
              onChange={(e) => setHeroGrade(e.target.value)}
              className="focus-ring flex-1 rounded-xl border border-line-2 bg-ivory-card px-4 py-3 text-sm"
            >
              <option value="">아이 학년</option>
              {grades.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            <select
              aria-label="필요한 시간"
              value={heroTime}
              onChange={(e) => setHeroTime(e.target.value)}
              className="focus-ring flex-1 rounded-xl border border-line-2 bg-ivory-card px-4 py-3 text-sm"
            >
              <option value="">필요한 시간</option>
              {times.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <Button onClick={goSearch}>검색</Button>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {orgTypes.map((t) => (
              <Chip key={t} selected={selectedOrgTypes.includes(t)} onClick={() => toggleOrgType(t)}>
                #{t}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      {/* 돌봄 MAP */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-xl font-extrabold text-ink">돌봄 MAP</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Link
            to="/find"
            className="focus-ring rounded-[20px] bg-green p-6 text-white transition hover:opacity-90"
          >
            <p className="text-lg font-bold">돌봄기관</p>
            <p className="mt-1 text-sm text-white/80">지도에서 바로 찾아보기</p>
          </Link>
          <div className="rounded-[20px] border border-line bg-ivory-card p-6">
            <p className="text-lg font-bold text-ink">체험기관</p>
            <p className="mt-1 text-sm text-ink-3">준비 중이에요</p>
          </div>
          <div className="rounded-[20px] border border-line bg-ivory-card p-6">
            <p className="text-lg font-bold text-ink">의료기관</p>
            <p className="mt-1 text-sm text-ink-3">준비 중이에요</p>
          </div>
        </div>
      </section>

      {/* 맞춤 매칭 */}
      <section className="bg-ivory-deep-2">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-xl font-extrabold text-ink">맞춤 매칭</h2>
          <div className="mt-5 grid items-stretch gap-4 md:grid-cols-2">
            <Card className="flex flex-col">
              <Calendar
                selectedDates={match.selectedDates}
                onToggle={match.toggleDate}
                onSelectWeekdays={match.setWeekdays}
              />
            </Card>
            <Card className="flex flex-col justify-between gap-6">
              <div>
                <p className="text-sm font-bold text-ink">아이 학년</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {grades.map((g) => (
                    <Chip key={g} selected={match.grade === g} onClick={() => match.setGrade(g)}>
                      {g}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-ink">필요한 시간</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {times.map((t) => (
                    <Chip key={t} selected={match.time === t} onClick={() => match.setTime(t)}>
                      {t}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-ink">꼭 필요한 것</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {needs.map((n) => (
                    <Chip key={n} selected={match.need === n} onClick={() => match.setNeed(n)}>
                      {n}
                    </Chip>
                  ))}
                </div>
              </div>
              <Button onClick={goMatch} className="w-full">
                추천 센터 {matchedCount}곳 보기
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* 추천 돌봄기관 */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-xl font-extrabold text-ink">추천 돌봄기관</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {centers.slice(0, 3).map((c) => (
            <Card key={c.id} highlight>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-green-soft px-3 py-1 text-xs font-bold text-green">
                  일치도 {c.match}%
                </span>
                <SeatBadge seats={c.seats} />
              </div>
              <p className="mt-3 text-base font-bold text-ink">{c.name}</p>
              <p className="mt-1 text-xs text-ink-3">
                ★ {c.rating} ({c.reviews}) · {c.area} · {c.distanceM}m · {c.grade}
              </p>
              <p className="mt-2 text-xs text-ink-2">
                {c.hours} · {c.bus ? '차량 운행' : '차량 없음'}
              </p>
              <p className="mt-1 text-sm font-bold text-ink">
                {c.feeMonthly === 0 ? '무료' : `월 ${c.feeMonthly.toLocaleString()}원`}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* 소식 + 양육정보 */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-extrabold text-ink">소식</h2>
            <ul className="mt-4 divide-y divide-line">
              {newsItems.map((n) => (
                <li key={n.id} className="flex items-center gap-3 py-3">
                  <span className="rounded-full bg-ivory-deep px-2.5 py-1 text-xs font-semibold text-ink-2">
                    {n.tag}
                  </span>
                  <span className="flex-1 truncate text-sm text-ink">{n.title}</span>
                  <span className="text-xs text-ink-3">{n.date}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-ink">양육정보</h2>
            <div role="tablist" className="mt-4 flex gap-1 rounded-xl border border-line bg-ivory-deep-2 p-1">
              {(['play', 'care', 'card'] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={infoTab === t}
                  onClick={() => setInfoTab(t)}
                  className={`focus-ring flex-1 rounded-lg py-2 text-sm font-semibold ${
                    infoTab === t ? 'bg-ivory text-ink' : 'text-ink-2'
                  }`}
                >
                  {t === 'play' ? '놀이' : t === 'care' ? '양육' : '카드뉴스'}
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {infoArticles
                .filter((a) => a.category === infoTab)
                .slice(0, 3)
                .map((a) => (
                  <div key={a.id}>
                    <PlaceholderImage caption={a.category} ratio="aspect-square" />
                    <p className="mt-2 line-clamp-2 text-xs font-semibold text-ink">{a.title}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* 문화·행사 */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-xl font-extrabold text-ink">아이와 함께하는 문화·행사</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {events.slice(0, 4).map((e) => {
            const applied = appliedEvents.includes(e.id)
            return (
              <Card key={e.id}>
                <span className="rounded-full bg-ivory-deep px-2.5 py-1 text-xs font-semibold text-ink-2">
                  {e.kind}
                </span>
                <p className="mt-2 text-sm font-bold text-ink">{e.title}</p>
                <p className="mt-1 text-xs text-ink-3">{e.date}</p>
                <Button
                  variant={applied ? 'outline' : 'primary'}
                  onClick={() => toggleApply(e.id)}
                  className="mt-3 w-full"
                >
                  {applied ? '신청 취소' : '신청하기'}
                </Button>
              </Card>
            )
          })}
        </div>
      </section>

      {/* CTA 배너 */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="flex flex-col items-center gap-4 rounded-[24px] bg-green px-8 py-12 text-center text-white md:flex-row md:justify-between md:text-left">
          <div>
            <p className="text-xl font-extrabold">원하는 돌봄기관을 못 찾으셨나요?</p>
            <p className="mt-1 text-sm text-white/80">돌봄 요청을 등록하면 센터가 먼저 제안을 보내드려요.</p>
          </div>
          <Link
            to="/request#new"
            className="focus-ring rounded-xl bg-white px-5 py-3 text-sm font-bold text-green hover:opacity-90"
          >
            돌봄 요청하기
          </Link>
        </div>
      </section>

      {/* 협력기관 */}
      <section className="border-t border-line bg-ivory-deep-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-4 py-6 text-sm text-ink-3">
          {partners.map((p) => (
            <span key={p}>{p}</span>
          ))}
        </div>
      </section>
    </div>
  )
}
