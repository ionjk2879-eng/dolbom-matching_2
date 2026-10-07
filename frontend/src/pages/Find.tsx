import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link } from 'react-router-dom'
import { Chip } from '../components/Chip'
import { DemoNotice } from '../components/DemoNotice'
import { MapView, type MapPin } from '../components/MapView'
import { useMatchStore } from '../store/matchStore'
import { useAuthStore } from '../store/authStore'
import { useCareScheduleStore } from '../store/careScheduleStore'
import { usePaged } from '../hooks/usePaged'
import { fetchCareOptions } from '../api/careOptions'
import { careTypeLabels, matchesCareOption, gradeBuckets, timeBuckets, REGIONS } from '../data/careMatch'
import { DISTRICTS } from '../data/districts'
import { computeGaps, overlapWithGap } from '../data/gaps'
import { toISO } from '../data/date'
import type { CareOption } from '../data/types'

type SortKey = 'name' | 'cost'

export function Find() {
  const match = useMatchStore()
  const [options, setOptions] = useState<CareOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sort, setSort] = useState<SortKey>('name')
  const [selected, setSelected] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const { children, schedules, exceptions } = useCareScheduleStore()
  const [today] = useState(() => toISO(new Date()))
  const [fitMine, setFitMine] = useState(false)

  const mapRef = useRef<HTMLDivElement>(null)
  const filterBarRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef(new Map<string, HTMLElement>())

  useEffect(() => {
    if (user) useCareScheduleStore.getState().loadAll()
  }, [user])

  const todaysGaps = useMemo(
    () => (user ? children.flatMap((c) => computeGaps(c, today, schedules, exceptions)) : []),
    [user, children, schedules, exceptions, today],
  )
  const fitsMine = fitMine && todaysGaps.length > 0

  useEffect(() => {
    fetchCareOptions()
      .then(setOptions)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const results = useMemo(() => {
    const filtered = options.filter((c) =>
      matchesCareOption(c, match.grade, match.time, match.region, match.district, match.costFilter) &&
      (!fitsMine || todaysGaps.some((g) => overlapWithGap(c, g) !== null))
    )
    return [...filtered].sort((a, b) =>
      sort === 'name' ? a.name.localeCompare(b.name) : a.cost_per_hour - b.cost_per_hour,
    )
  }, [options, match.grade, match.time, match.region, match.district, match.costFilter, sort, fitsMine, todaysGaps])

  // Until the user picks one (or when the pick is filtered out), the map follows the top of the list
  const activeId = results.some((c) => c.id === selected) ? selected : (results[0]?.id ?? null)
  const selectedOption = results.find((c) => c.id === activeId) ?? null
  const paged = usePaged(results)
  const conditionSummary = [match.region, match.district, match.grade, match.time].filter(Boolean).join(' · ')

  const pins = useMemo<MapPin[]>(
    () =>
      results.flatMap((c) =>
        c.latitude != null && c.longitude != null
          ? [{ id: c.id, lat: c.latitude, lng: c.longitude, name: c.name, costPerHour: c.cost_per_hour }]
          : [],
      ),
    [results],
  )

  // 카드 클릭 → 지도로 smooth scroll + 핀 선택 (sticky 필터 바 높이 보정)
  const handleCardClick = (id: string) => {
    setSelected(id)
    if (!mapRef.current) return
    const top = mapRef.current.getBoundingClientRect().top + window.scrollY - (filterBarRef.current?.offsetHeight ?? 0)
    window.scrollTo({ top, behavior: 'smooth' })
  }

  // 지도 팝업 "목록에서 찾기 ↓" → 선택된 카드로 smooth scroll
  const scrollToCard = () => {
    if (!activeId) return
    // The card may sit past the "더 보기" cut, so render it before scrolling
    flushSync(() => paged.reveal(results.findIndex((c) => c.id === activeId)))
    cardRefs.current.get(activeId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-4">

      {/* ── 필터 바 (sticky, 스크롤해도 항상 표시) ── */}
      <div ref={filterBarRef} className="sticky top-0 z-20 -mx-4 border-b border-line bg-ivory-card px-4 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="font-bold text-ink">돌봄 찾기</span>
            {conditionSummary && (
              <span className="hidden truncate rounded-full bg-ivory-deep px-2 py-0.5 text-xs text-ink-2 sm:inline">
                {conditionSummary}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {conditionSummary && (
              <button type="button" onClick={match.reset} className="focus-ring text-xs text-ink-2 hover:text-error">
                초기화
              </button>
            )}
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className={`focus-ring rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                filterOpen ? 'border-green bg-green text-white' : 'border-green text-green hover:bg-green-soft'
              }`}
            >
              필터 {filterOpen ? '▲' : '▼'}
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <select
            aria-label="시/도"
            value={match.region}
            onChange={(e) => match.setRegion(e.target.value)}
            className="focus-ring rounded-lg border border-line-2 bg-ivory-card px-2 py-1.5 text-xs"
          >
            <option value="">시/도 전체</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            aria-label="구/군"
            value={match.district}
            onChange={(e) => match.setDistrict(e.target.value)}
            disabled={!match.region || (DISTRICTS[match.region]?.length ?? 0) === 0}
            className="focus-ring rounded-lg border border-line-2 bg-ivory-card px-2 py-1.5 text-xs disabled:opacity-40"
          >
            <option value="">구/군 전체</option>
            {(DISTRICTS[match.region] ?? []).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            aria-label="정렬"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="focus-ring ml-auto rounded-lg border border-line-2 bg-ivory-card px-2 py-1.5 text-xs"
          >
            <option value="name">이름순</option>
            <option value="cost">비용낮은순</option>
          </select>
        </div>

        {filterOpen && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-line pt-2">
            {todaysGaps.length > 0 && (
              <Chip selected={fitsMine} onClick={() => setFitMine((v) => !v)}>
                내 일정에 맞는 센터
              </Chip>
            )}
            {gradeBuckets.map((g) => (
              <Chip key={g} selected={match.grade === g} onClick={() => match.setGrade(g)}>{g}</Chip>
            ))}
            <span className="h-4 w-px bg-line" />
            {timeBuckets.map((t) => (
              <Chip key={t} selected={match.time === t} onClick={() => match.setTime(t)}>{t}</Chip>
            ))}
            <span className="h-4 w-px bg-line" />
            {(['all', 'free', 'paid'] as const).map((v) => (
              <Chip key={v} selected={match.costFilter === v} onClick={() => match.setCostFilter(v)}>
                {v === 'all' ? '전체' : v === 'free' ? '무료' : '유료'}
              </Chip>
            ))}
          </div>
        )}

        {fitsMine && (
          <p className="mt-2 rounded-xl bg-green-soft px-3 py-1.5 text-xs font-semibold text-green">
            오늘 공백({todaysGaps.map((g) => `${g.start}~${g.end}`).join(', ')})과 운영시간 겹치는 곳
          </p>
        )}
      </div>

      {/* ── 지도 (스크롤 됨, 비고정, 360px) ── */}
      <div ref={mapRef} className="relative mt-4">
        <div className="h-[360px] overflow-hidden rounded-2xl">
          <MapView pins={pins} selected={activeId} onSelect={setSelected} />
        </div>
        {/* On phones the card sits under the map so it doesn't cover it */}
        {selectedOption && (
          <div className="mt-2 rounded-2xl sm:absolute sm:bottom-3 sm:right-3 sm:mt-0 sm:w-64 border border-line bg-ivory-card p-3 shadow-[0_24px_40px_-28px_rgba(60,50,30,.45)]">
            <p className="text-sm font-bold leading-tight text-ink">{selectedOption.name}</p>
            <p className="mt-0.5 text-xs text-ink-2">{selectedOption.address}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {selectedOption.phone && (
                <a
                  href={`tel:${selectedOption.phone}`}
                  className="focus-ring flex-1 rounded-xl border border-line-2 px-2 py-1.5 text-center text-xs font-semibold text-ink hover:bg-ivory-deep"
                >
                  전화 문의
                </a>
              )}
              <button
                type="button"
                onClick={scrollToCard}
                className="focus-ring flex-1 rounded-xl border border-green px-2 py-1.5 text-center text-xs font-semibold text-green hover:bg-green-soft"
              >
                목록에서 찾기 ↓
              </button>
              <Link
                to={`/find/${selectedOption.id}`}
                className="focus-ring w-full rounded-xl bg-green px-2 py-1.5 text-center text-xs font-semibold text-white hover:opacity-90"
              >
                상세 보기
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── 결과 목록 ── */}
      <div className="mt-4">
        {loading && <p className="text-sm text-ink-2">불러오는 중...</p>}
        {error && <p className="text-sm text-error">{error}</p>}
        {!loading && <DemoNotice options={options} />}

        {!loading && !error && (
          <>
            <p className="mt-3 text-xs text-ink-2">
              <span className="font-bold text-ink">{results.length}</span>곳
            </p>
            <p className="mt-1 text-xs text-ink-2">표시된 운영시간은 통상 시간이라 실제와 다를 수 있어요. 방문 전 전화로 확인해 주세요.</p>
            {results.length === 0 && (
              <div className="mt-3 rounded-2xl border border-line bg-ivory-card p-8 text-center">
                <p className="text-sm font-bold text-ink">조건에 맞는 돌봄 옵션이 없어요</p>
              </div>
            )}
            <div className="mt-2 flex flex-col gap-2">
              {paged.visible.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  ref={(el) => { if (el) cardRefs.current.set(c.id, el); else cardRefs.current.delete(c.id) }}
                  onClick={() => handleCardClick(c.id)}
                  className={`focus-ring w-full rounded-2xl border p-4 text-left transition ${
                    activeId === c.id
                      ? 'border-green bg-green-soft/40'
                      : 'border-line bg-ivory-card hover:border-green/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-ink">{c.name}</p>
                    {c.cost_per_hour === 0 && (
                      <span className="shrink-0 rounded-full bg-green-soft px-2 py-0.5 text-xs font-bold text-green">무료</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink-2">
                    {careTypeLabels[c.type]} · {c.address}
                  </p>
                  <p className="mt-1 text-xs text-ink-2">
                    운영 {c.open_time}~{c.close_time}
                    {c.cost_per_hour > 0 && ` · 시간당 ${c.cost_per_hour.toLocaleString()}원`}
                  </p>
                </button>
              ))}
            </div>
            {paged.hasMore && (
              <button
                type="button"
                onClick={paged.showMore}
                className="focus-ring mt-3 min-h-11 w-full rounded-xl border border-line-2 bg-ivory-card text-sm font-semibold text-ink-2 hover:text-ink"
              >
                더 보기 ({paged.visible.length}/{results.length})
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
