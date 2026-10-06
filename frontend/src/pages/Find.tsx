import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Chip } from '../components/Chip'
import { DemoNotice } from '../components/DemoNotice'
import { MapView, type MapPin } from '../components/MapView'
import { useMatchStore } from '../store/matchStore'
import { useAuthStore } from '../store/authStore'
import { useCareScheduleStore } from '../store/careScheduleStore'
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
      .then((data) => {
        setOptions(data)
        setSelected(data[0]?.id ?? null)
      })
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

  const selectedOption = results.find((c) => c.id === selected) ?? null
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

  // 모바일/데스크탑 공통 필터 컨트롤 (두 곳에 렌더링)
  const filterControls = (
    <>
      {/* 행1: 타이틀 + 조건 요약 + 초기화 + 필터 토글 */}
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
            <button
              type="button"
              onClick={match.reset}
              className="focus-ring text-xs text-ink-3 hover:text-error"
            >
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

      {/* 행2: 지역 + 정렬 (항상 표시) */}
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

      {/* 접이식 필터 칩 */}
      {filterOpen && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-line pt-2">
          {todaysGaps.length > 0 && (
            <Chip selected={fitsMine} onClick={() => setFitMine((v) => !v)}>
              내 일정에 맞는 센터
            </Chip>
          )}
          {gradeBuckets.map((g) => (
            <Chip key={g} selected={match.grade === g} onClick={() => match.setGrade(g)}>
              {g}
            </Chip>
          ))}
          <span className="h-4 w-px bg-line" />
          {timeBuckets.map((t) => (
            <Chip key={t} selected={match.time === t} onClick={() => match.setTime(t)}>
              {t}
            </Chip>
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
    </>
  )

  return (
    /*
     * MapLayout의 main이 flex-1 min-h-0 overflow-hidden flex-col 이므로
     * flex-1 min-h-0을 써야 h-full 없이 남은 높이를 채울 수 있음
     */
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden lg:flex-row">

      {/* ── 모바일 전용 필터 바 (지도 위에 표시) ── */}
      <div className="shrink-0 border-b border-line bg-ivory-card px-4 py-2.5 lg:hidden">
        {filterControls}
      </div>

      {/* ── 지도: 모바일=200px 고정 / 데스크탑=왼쪽 전체 높이 ── */}
      <div className="relative h-[200px] shrink-0 overflow-hidden lg:h-auto lg:flex-1">
        <MapView pins={pins} selected={selected} onSelect={setSelected} />
        {selectedOption && (
          <div className="absolute bottom-3 right-3 w-60 rounded-2xl border border-line bg-ivory-card p-3 shadow-[0_24px_40px_-28px_rgba(60,50,30,.45)]">
            <p className="text-sm font-bold leading-tight text-ink">{selectedOption.name}</p>
            <p className="mt-0.5 text-xs text-ink-3">{selectedOption.address}</p>
            <div className="mt-2.5 flex gap-1.5">
              {selectedOption.phone && (
                <a
                  href={`tel:${selectedOption.phone}`}
                  className="focus-ring flex-1 rounded-xl border border-line-2 px-2 py-1.5 text-center text-xs font-semibold text-ink hover:bg-ivory-deep"
                >
                  전화 문의
                </a>
              )}
              <Link
                to={`/find/${selectedOption.id}`}
                className="focus-ring flex-1 rounded-xl bg-green px-2 py-1.5 text-center text-xs font-semibold text-white hover:opacity-90"
              >
                상세 보기
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── 오른쪽 패널: 데스크탑 필터 헤더 + 결과 목록 ── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:w-[420px] lg:flex-none lg:border-l lg:border-line">

        {/* 데스크탑 전용 필터 헤더 */}
        <div className="hidden shrink-0 border-b border-line bg-ivory-card px-4 py-2.5 lg:block">
          {filterControls}
        </div>

        {/* 결과 목록 (스크롤) */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading && <p className="text-sm text-ink-3">불러오는 중...</p>}
          {error && <p className="text-sm text-error">{error}</p>}
          {!loading && <DemoNotice options={options} />}

          {!loading && !error && (
            <div className="mt-2 flex flex-col gap-2">
              <p className="text-xs text-ink-3">
                <span className="font-bold text-ink">{results.length}</span>곳
              </p>
              {results.length === 0 && (
                <div className="rounded-2xl border border-line bg-ivory-card p-8 text-center">
                  <p className="text-sm font-bold text-ink">조건에 맞는 돌봄 옵션이 없어요</p>
                </div>
              )}
              {results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected(c.id)}
                  className={`focus-ring rounded-2xl border p-4 text-left transition ${
                    selected === c.id
                      ? 'border-green bg-green-soft/40'
                      : 'border-line bg-ivory-card hover:border-green/40'
                  }`}
                >
                  <p className="text-sm font-bold text-ink">{c.name}</p>
                  <p className="mt-1 text-xs text-ink-3">
                    {careTypeLabels[c.type]} · {c.address}
                  </p>
                  <p className="mt-1 text-xs text-ink-2">
                    {c.open_time}~{c.close_time} · 시간당{' '}
                    {c.cost_per_hour === 0 ? '무료' : `${c.cost_per_hour.toLocaleString()}원`}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
