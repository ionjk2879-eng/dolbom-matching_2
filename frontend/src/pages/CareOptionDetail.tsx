import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHero } from '../components/PageHero'
import { Card } from '../components/Card'
import { DemoNotice } from '../components/DemoNotice'
import { MapView, type MapPin } from '../components/MapView'
import { fetchCareOption } from '../api/careOptions'
import { careTypeLabels } from '../data/careMatch'
import type { CareOption } from '../data/types'

const noop = () => {}

function gradeLabel(c: CareOption) {
  if (c.min_grade == null && c.max_grade == null) return '제한 없음'
  return `초${c.min_grade ?? 1}~${c.max_grade ?? 6}학년`
}

// No single-item API yet, so look the option up in the list endpoint
export function CareOptionDetail() {
  const { id } = useParams()
  // Result is tagged with the id it was fetched for, so loading is derived instead of set in the effect
  const [result, setResult] = useState<{ id: string; option: CareOption | null } | null>(null)

  useEffect(() => {
    if (!id) return
    fetchCareOption(id)
      .then((option) => setResult({ id, option }))
      .catch(() => setResult({ id, option: null }))
  }, [id])

  const loading = !!id && result?.id !== id
  const option = result && result.id === id ? result.option : null

  // Stable reference so MapView doesn't redraw its markers on every render
  const pins = useMemo<MapPin[]>(
    () =>
      option?.latitude != null && option.longitude != null
        ? [{ id: option.id, lat: option.latitude, lng: option.longitude, name: option.name, costPerHour: option.cost_per_hour }]
        : [],
    [option],
  )

  if (loading) return <p className="mx-auto max-w-6xl px-4 py-20 text-sm text-ink-2">불러오는 중...</p>

  if (!option) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-sm font-bold text-ink">돌봄 기관을 찾을 수 없어요</p>
        <Link to="/find" className="focus-ring mt-4 inline-block text-sm font-semibold text-green underline">
          돌봄 찾기로 돌아가기
        </Link>
      </div>
    )
  }

  // 핵심 정보는 타일로 먼저 보여주고, 나머지는 아래 목록에 둔다
  const facts: [string, string][] = [
    ['운영 시간', `${option.open_time}~${option.close_time}`],
    ['비용', option.cost_per_hour === 0 ? '무료' : `시간당 ${option.cost_per_hour.toLocaleString()}원`],
    ['대상 학년', gradeLabel(option)],
  ]
  const rows: [string, string][] = [
    ['유형', careTypeLabels[option.type]],
    // Non-breaking hyphen keeps lot numbers like 30-26 on one line
    ['주소', option.address.replaceAll('-', '‑')],
    ['전화', option.phone ?? '정보 없음'],
  ]

  return (
    <div>
      <PageHero
        title={option.name}
        desc={careTypeLabels[option.type]}
        breadcrumb={[{ label: '돌봄 찾기', to: '/find' }, { label: option.name }]} />
      <DemoNotice options={[option]} className="mx-auto mt-6 max-w-6xl" />
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-[360px_1fr]">
        <Card className="flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-2">
            {facts.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-ivory-deep px-3 py-2.5">
                <p className="text-xs text-ink-2">{label}</p>
                <p className="mt-0.5 text-sm font-bold text-ink">{value}</p>
              </div>
            ))}
          </div>
          <p className="-mt-2 text-xs text-ink-2">운영시간은 통상 시간이라 실제와 다를 수 있어요. 방문 전 전화로 확인해 주세요.</p>
          <dl className="flex flex-col gap-3">
            {rows.map(([label, value]) => (
              <div key={label} className="flex gap-4 text-sm">
                <dt className="w-20 shrink-0 font-semibold text-ink-2">{label}</dt>
                <dd className="break-keep text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          {option.phone && (
            <a
              href={`tel:${option.phone}`}
              className="focus-ring min-h-11 rounded-xl bg-green px-4 py-2.5 text-center text-sm font-semibold text-white hover:opacity-90"
            >
              전화 문의
            </a>
          )}
        </Card>

        {pins.length > 0 ? (
          // One column on phones has no row height to stretch into, so give the map its own
          <div className="h-[360px] md:h-auto">
            <MapView pins={pins} selected={option.id} onSelect={noop} />
          </div>
        ) : (
          <Card className="flex items-center justify-center text-sm text-ink-2">방문형 돌봄이라 위치 정보가 없어요</Card>
        )}
      </div>
    </div>
  )
}
