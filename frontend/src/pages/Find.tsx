import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Chip } from '../components/Chip'
import { Button } from '../components/Button'
import { SeatBadge } from '../components/SeatBadge'
import { MapView } from '../components/MapView'
import { useMatchStore } from '../store/matchStore'
import { centers } from '../data/centers'
import { gradesOverlap } from '../data/grade'
import { toISO } from '../data/date'
import { fitsSlot, matchesConditions } from '../data/match'
import { useScheduleStore } from '../store/scheduleStore'
import type { Center } from '../data/types'

const filterDefs: { label: string; test: (c: Center) => boolean }[] = [
  { label: '빈자리 있음', test: (c) => c.seats > 0 },
  { label: '차량 운행', test: (c) => c.bus },
  { label: '저녁 7시 이후', test: (c) => c.tags.includes('저녁 7시 이후') },
  { label: '무료·저비용', test: (c) => c.feeMonthly === 0 || c.feeMonthly <= 50000 },
  { label: '평점 4.8+', test: (c) => c.rating >= 4.8 },
  { label: '초1~2', test: (c) => gradesOverlap(c.grade, '초1~2') },
]

type SortKey = 'match' | 'distance' | 'rating'

export function Find() {
  const match = useMatchStore()
  const navigate = useNavigate()
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [sort, setSort] = useState<SortKey>('match')
  const [selected, setSelected] = useState<string | null>(centers[0]?.id ?? null)
  const schedules = useScheduleStore((s) => s.schedules)
  const [fitMine, setFitMine] = useState(false)

  const today = toISO(new Date())
  const upcoming = useMemo(() => schedules.filter((s) => s.date >= today), [schedules, today])
  const fitsMine = fitMine && upcoming.length > 0

  const toggleFilter = (label: string) =>
    setActiveFilters((prev) => (prev.includes(label) ? prev.filter((f) => f !== label) : [...prev, label]))

  const results = useMemo(() => {
    const active = filterDefs.filter((f) => activeFilters.includes(f.label))
    const filtered = centers.filter(
      (c) =>
        matchesConditions(c, match) &&
        active.every((f) => f.test(c)) &&
        // Open for every upcoming schedule's weekday and time
        (!fitsMine || upcoming.every((s) => fitsSlot(c, s.date, s.start, s.end))),
    )
    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'match') return b.match - a.match
      if (sort === 'distance') return a.distanceM - b.distanceM
      return b.rating - a.rating
    })
    return sorted
  }, [activeFilters, sort, match, fitsMine, upcoming])

  const selectedCenter = results.find((c) => c.id === selected) ?? null
  const conditionSummary = [match.area, match.grade, match.time, match.selectedDates.length ? `${match.selectedDates.length}일` : '']
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="focus-ring text-lg font-extrabold text-ink">After School</Link>
          <span className="rounded-full bg-ivory-deep px-3 py-1.5 text-xs font-semibold text-ink-2">
            {conditionSummary || '조건을 선택해주세요'}
          </span>
        </div>
        <div className="flex gap-2">
          {conditionSummary && (
            <button
              type="button"
              onClick={match.reset}
              className="focus-ring rounded-full border border-line-2 px-3 py-1.5 text-xs font-semibold text-ink-2 hover:border-green/50"
            >
              조건 초기화
            </button>
          )}
          <Link to="/" className="focus-ring rounded-full border border-line-2 px-3 py-1.5 text-xs font-semibold text-ink-2 hover:border-green/50">
            조건 변경
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {upcoming.length > 0 && (
            <Chip selected={fitsMine} onClick={() => setFitMine((v) => !v)}>
              내 일정에 맞는 센터
            </Chip>
          )}
          {filterDefs.map((f) => (
            <Chip key={f.label} selected={activeFilters.includes(f.label)} onClick={() => toggleFilter(f.label)}>
              {f.label}
            </Chip>
          ))}
        </div>
        <select
          aria-label="정렬"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="focus-ring rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm"
        >
          <option value="match">일치도순</option>
          <option value="distance">거리순</option>
          <option value="rating">평점순</option>
        </select>
      </div>

      {fitsMine && (
        <p className="mt-3 rounded-xl bg-green-soft px-3.5 py-2.5 text-xs font-semibold text-green">
          다가오는 일정 {upcoming.length}건에 모두 맞는 센터만 보여줘요
        </p>
      )}

      <div className="mt-5 flex flex-col gap-4 lg:flex-row">
        <div className="flex w-full flex-col gap-3 lg:w-[440px]">
          {results.length === 0 && (
            <div className="rounded-2xl border border-line bg-ivory-card p-8 text-center">
              <p className="text-sm font-bold text-ink">조건에 맞는 돌봄기관이 없어요</p>
              <p className="mt-1 text-xs text-ink-3">돌봄 요청을 등록하면 센터가 먼저 제안을 보내드려요.</p>
              <Link
                to="/request#new"
                className="focus-ring mt-4 inline-block rounded-xl bg-green px-4 py-2 text-sm font-semibold text-white"
              >
                돌봄 요청하기
              </Link>
            </div>
          )}
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c.id)}
              className={`focus-ring rounded-2xl border p-4 text-left transition ${
                selected === c.id ? 'border-green bg-green-soft/40' : 'border-line bg-ivory-card hover:border-green/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-green-soft px-2.5 py-1 text-xs font-bold text-green">
                  일치도 {c.match}%
                </span>
                <SeatBadge seats={c.seats} />
              </div>
              <p className="mt-2 text-sm font-bold text-ink">{c.name}</p>
              <p className="mt-1 text-xs text-ink-3">
                ★ {c.rating} · {c.area} · {c.distanceM}m · {c.grade}
              </p>
              <p className="mt-1 text-xs text-ink-2">
                {c.hours} · {c.bus ? '차량 운행' : '차량 없음'} ·{' '}
                {c.feeMonthly === 0 ? '무료' : `월 ${c.feeMonthly.toLocaleString()}원`}
              </p>
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <MapView pins={results} selected={selected} onSelect={setSelected} />
          {selectedCenter && (
            <div className="absolute bottom-4 right-4 w-72 rounded-2xl border border-line bg-ivory-card p-4 shadow-[0_24px_40px_-28px_rgba(60,50,30,.45)]">
              <p className="text-sm font-bold text-ink">{selectedCenter.name}</p>
              <p className="mt-1 text-xs text-ink-3">
                {selectedCenter.area} · {selectedCenter.grade} · {selectedCenter.hours}
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" onClick={() => navigate(`/centers/${selectedCenter.id}`)} className="flex-1">
                  상세 보기
                </Button>
                <Button onClick={() => navigate(`/centers/${selectedCenter.id}/consult`, { state: { from: '/find' } })} className="flex-1">
                  상담 신청
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
