import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHero } from '../components/PageHero'
import { Chip } from '../components/Chip'
import { DemoNotice } from '../components/DemoNotice'
import { fetchCareOptions } from '../api/careOptions'
import { careTypeLabels, matchesLocation, REGIONS } from '../data/careMatch'
import { DISTRICTS } from '../data/districts'
import type { CareOption, CareProviderType } from '../data/types'

// Facilities you visit in person; visiting care and babysitters have no center to find
const centerTypes: CareProviderType[] = ['school_care', 'community_care', 'academy']

function gradeLabel(c: CareOption) {
  if (c.min_grade == null && c.max_grade == null) return '학년 제한 없음'
  return `초${c.min_grade ?? 1}~${c.max_grade ?? 6}학년`
}

// Directory of care centers, separate from /find (which matches care to the user's conditions on a map)
export function Centers() {
  const [options, setOptions] = useState<CareOption[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('')
  const [district, setDistrict] = useState('')
  const [type, setType] = useState<CareProviderType | ''>('')

  useEffect(() => {
    fetchCareOptions()
      .then(setOptions)
      .catch(() => setOptions([]))
      .finally(() => setLoading(false))
  }, [])

  const centers = useMemo(() => options.filter((o) => centerTypes.includes(o.type)), [options])

  const results = useMemo(() => {
    const q = query.trim()
    return centers
      .filter(
        (c) =>
          (!type || c.type === type) &&
          matchesLocation(c, region, district) &&
          (!q || c.name.includes(q) || c.address.includes(q)),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [centers, query, region, district, type])

  return (
    <div>
      <PageHero title="센터 찾기" desc="우리 동네 돌봄교실·돌봄센터·학원을 한눈에 찾아보세요" />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="센터 이름이나 주소로 검색"
          aria-label="센터 검색"
          className="focus-ring w-full rounded-xl border border-line-2 bg-ivory-card px-4 py-3 text-sm"
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Chip selected={type === ''} onClick={() => setType('')}>
            전체 유형
          </Chip>
          {centerTypes.map((t) => (
            <Chip key={t} selected={type === t} onClick={() => setType(type === t ? '' : t)}>
              {careTypeLabels[t]}
            </Chip>
          ))}
          <span className="mx-1 w-px self-stretch bg-line" />
          <select
            aria-label="시/도"
            value={region}
            onChange={(e) => { setRegion(e.target.value); setDistrict('') }}
            className="focus-ring rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm"
          >
            <option value="">시/도 전체</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            aria-label="구/군"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            disabled={!region || (DISTRICTS[region]?.length ?? 0) === 0}
            className="focus-ring rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm disabled:opacity-40"
          >
            <option value="">구/군 전체</option>
            {(DISTRICTS[region] ?? []).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {!loading && <DemoNotice options={options} className="mt-5" />}
        {loading && <p className="mt-6 text-sm text-ink-2">불러오는 중...</p>}

        {!loading && (
          <>
            <p className="mt-6 text-sm text-ink-2">
              센터 <span className="font-bold text-ink">{results.length}</span>곳
            </p>
            {results.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-line bg-ivory-card p-8 text-center">
                <p className="text-sm font-bold text-ink">조건에 맞는 센터가 없어요</p>
                <p className="mt-1 text-xs text-ink-2">검색어를 바꾸거나 지역·유형 조건을 풀어 보세요</p>
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((c) => (
                  <div key={c.id} className="flex flex-col rounded-2xl border border-line bg-ivory-card p-4">
                    <span className="self-start rounded-full bg-green-soft px-2.5 py-1 text-[11px] font-bold text-green">
                      {careTypeLabels[c.type]}
                    </span>
                    <p className="mt-2 text-base font-bold text-ink">{c.name}</p>
                    <p className="mt-1 text-xs text-ink-2">{c.address}</p>
                    <dl className="mt-3 flex flex-col gap-1 text-xs text-ink-2">
                      <div className="flex gap-2">
                        <dt className="w-14 shrink-0 text-ink-2">운영</dt>
                        <dd>
                          {c.open_time}~{c.close_time}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-14 shrink-0 text-ink-2">대상</dt>
                        <dd>{gradeLabel(c)}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-14 shrink-0 text-ink-2">비용</dt>
                        <dd>{c.cost_per_hour === 0 ? '무료' : `시간당 ${c.cost_per_hour.toLocaleString()}원`}</dd>
                      </div>
                    </dl>
                    <div className="mt-4 flex gap-2 pt-1">
                      {c.phone && (
                        <a
                          href={`tel:${c.phone}`}
                          className="focus-ring flex-1 rounded-xl border border-line-2 px-3 py-2 text-center text-xs font-semibold text-ink hover:bg-ivory-deep"
                        >
                          전화 문의
                        </a>
                      )}
                      <Link
                        to={`/find/${c.id}`}
                        className="focus-ring flex-1 rounded-xl bg-green px-3 py-2 text-center text-xs font-semibold text-white hover:opacity-90"
                      >
                        상세 보기
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
