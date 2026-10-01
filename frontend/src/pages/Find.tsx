import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapView, type MapPin } from '../components/MapView'
import { useMatchStore } from '../store/matchStore'
import { fetchCareOptions } from '../api/careOptions'
import { careTypeLabels, matchesCareOption } from '../data/careMatch'
import type { CareOption } from '../data/types'

type SortKey = 'name' | 'cost'

export function Find() {
  const match = useMatchStore()
  const [options, setOptions] = useState<CareOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sort, setSort] = useState<SortKey>('name')
  const [selected, setSelected] = useState<string | null>(null)

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
    const filtered = options.filter((c) => matchesCareOption(c, match.grade, match.time))
    return [...filtered].sort((a, b) =>
      sort === 'name' ? a.name.localeCompare(b.name) : a.cost_per_hour - b.cost_per_hour,
    )
  }, [options, match.grade, match.time, sort])

  const selectedOption = results.find((c) => c.id === selected) ?? null
  const conditionSummary = [match.grade, match.time].filter(Boolean).join(' · ')

  const pins: MapPin[] = results.map((c) => ({
    id: c.id,
    lat: c.latitude ?? 36.35,
    lng: c.longitude ?? 127.38,
    name: c.name,
    costPerHour: c.cost_per_hour,
  }))

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
          <Link
            to="/"
            className="focus-ring rounded-full border border-line-2 px-3 py-1.5 text-xs font-semibold text-ink-2 hover:border-green/50"
          >
            조건 변경
          </Link>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
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

      {loading && <p className="mt-6 text-sm text-ink-3">불러오는 중...</p>}
      {error && <p className="mt-6 text-sm text-error">{error}</p>}

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
