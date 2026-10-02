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
  const user = useAuthStore((s) => s.user)
  const { children, schedules, exceptions } = useCareScheduleStore()
  const [today] = useState(() => toISO(new Date()))
  const [fitMine, setFitMine] = useState(false)

  // /find is public, so schedules may not be loaded yet when landing here directly
  useEffect(() => {
    if (user) useCareScheduleStore.getState().loadAll()
  }, [user])

  // Today's gaps still left after already chosen care, across all children
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

  // Options without coordinates (visiting care) get no pin instead of a fake one at the city center.
  // Memoized so MapView doesn't redraw markers and pan back to the selection on every render.
  const pins = useMemo<MapPin[]>(
    () =>
      results.flatMap((c) =>
        c.latitude != null && c.longitude != null
          ? [{ id: c.id, lat: c.latitude, lng: c.longitude, name: c.name, costPerHour: c.cost_per_hour }]
          : [],
      ),
    [results],
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="focus-ring text-lg font-extrabold text-ink">
            After School
          </Link>
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
        </div>
      </div>

      {/* 지역 필터 */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          aria-label="시/도"
          value={match.region}
          onChange={(e) => match.setRegion(e.target.value)}
          className="focus-ring rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm"
        >
          <option value="">시/도 전체</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          aria-label="구/군"
          value={match.district}
          onChange={(e) => match.setDistrict(e.target.value)}
          disabled={!match.region || (DISTRICTS[match.region]?.length ?? 0) === 0}
          className="focus-ring rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm disabled:opacity-40"
        >
          <option value="">구/군 전체</option>
          {(DISTRICTS[match.region] ?? []).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {todaysGaps.length > 0 && (
            <>
              <Chip selected={fitsMine} onClick={() => setFitMine((v) => !v)}>
                내 일정에 맞는 센터
              </Chip>
              <span className="mx-1 w-px self-stretch bg-line" />
            </>
          )}
          {gradeBuckets.map((g) => (
            <Chip key={g} selected={match.grade === g} onClick={() => match.setGrade(g)}>
              {g}
            </Chip>
          ))}
          <span className="mx-1 w-px self-stretch bg-line" />
          {timeBuckets.map((t) => (
            <Chip key={t} selected={match.time === t} onClick={() => match.setTime(t)}>
              {t}
            </Chip>
          ))}
          <span className="mx-1 w-px self-stretch bg-line" />
          {(['all', 'free', 'paid'] as const).map((v) => (
            <Chip key={v} selected={match.costFilter === v} onClick={() => match.setCostFilter(v)}>
              {v === 'all' ? '전체' : v === 'free' ? '무료' : '유료'}
            </Chip>
          ))}
        </div>
        <select
          aria-label="정렬"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="focus-ring rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm"
        >
          <option value="name">이름순</option>
          <option value="cost">비용낮은순</option>
        </select>
      </div>

      {fitsMine && (
        <p className="mt-3 rounded-xl bg-green-soft px-3.5 py-2.5 text-xs font-semibold text-green">
          오늘 돌봄 공백({todaysGaps.map((g) => `${g.start}~${g.end}`).join(', ')})과 운영 시간이 겹치는 곳만 보여드려요
        </p>
      )}
      {loading && <p className="mt-6 text-sm text-ink-3">불러오는 중...</p>}
      {error && <p className="mt-6 text-sm text-error">{error}</p>}
      {!loading && <DemoNotice options={options} className="mt-5" />}

      {!loading && !error && (
        <div className="mt-5 flex flex-col gap-4 lg:flex-row">
          <div className="flex w-full flex-col gap-3 lg:w-[440px]">
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
                  selected === c.id ? 'border-green bg-green-soft/40' : 'border-line bg-ivory-card hover:border-green/40'
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

          <div className="relative flex-1">
            <MapView pins={pins} selected={selected} onSelect={setSelected} />
            {selectedOption && (
              <div className="absolute bottom-4 right-4 w-72 rounded-2xl border border-line bg-ivory-card p-4 shadow-[0_24px_40px_-28px_rgba(60,50,30,.45)]">
                <p className="text-sm font-bold text-ink">{selectedOption.name}</p>
                <p className="mt-1 text-xs text-ink-3">
                  {selectedOption.address} · {careTypeLabels[selectedOption.type]}
                </p>
                {selectedOption.phone && (
                  <a
                    href={`tel:${selectedOption.phone}`}
                    className="focus-ring mt-3 block rounded-xl bg-green px-4 py-2 text-center text-sm font-semibold text-white hover:opacity-90"
                  >
                    {selectedOption.phone} 전화 문의
                  </a>
                )}
                <Link
                  to={`/find/${selectedOption.id}`}
                  className="focus-ring mt-2 block rounded-xl border border-line-2 px-4 py-2 text-center text-sm font-semibold text-ink hover:bg-ivory-deep"
                >
                  상세 보기
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
