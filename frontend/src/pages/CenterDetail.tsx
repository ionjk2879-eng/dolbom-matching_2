import { Link, useParams } from 'react-router-dom'
import { PageHero } from '../components/PageHero'
import { Card } from '../components/Card'
import { SeatBadge } from '../components/SeatBadge'
import { PlaceholderImage } from '../components/PlaceholderImage'
import { centers } from '../data/centers'
import { useConsultStore } from '../store/consultStore'

export function CenterDetail() {
  const { id } = useParams()
  const center = centers.find((c) => c.id === id)
  const applied = useConsultStore((s) => s.consults.some((c) => c.centerId === id))

  if (!center) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-sm font-bold text-ink">센터를 찾을 수 없어요</p>
        <Link to="/find" className="focus-ring mt-4 inline-block text-sm font-semibold text-green underline">
          돌봄 찾기로 돌아가기
        </Link>
      </div>
    )
  }

  const info = [
    { label: '기관 유형', value: center.type },
    { label: '위치', value: `대전 ${center.district} ${center.area} · ${center.distanceM}m` },
    { label: '대상 학년', value: center.grade },
    { label: '운영 시간', value: center.hours },
    { label: '운영 요일', value: center.days.join(', ') },
    { label: '월 이용료', value: center.feeMonthly === 0 ? '무료' : `${center.feeMonthly.toLocaleString()}원` },
    { label: '차량 운행', value: center.bus ? '운행' : '없음' },
  ]

  return (
    <div>
      <PageHero
        title={center.name}
        desc={`★ ${center.rating} (후기 ${center.reviews}개)`}
        breadcrumb={[{ label: '돌봄 찾기', to: '/find' }, { label: center.name }]}
      />
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-[1fr_320px]">
        <Card className="flex flex-col gap-5">
          <PlaceholderImage caption="센터 사진" />
          <dl className="grid grid-cols-[96px_1fr] gap-y-3 text-sm">
            {info.map((i) => (
              <div key={i.label} className="contents">
                <dt className="text-ink-3">{i.label}</dt>
                <dd className="font-semibold text-ink">{i.value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-2">
            {center.tags.map((t) => (
              <span key={t} className="rounded-full bg-ivory-deep px-3 py-1 text-xs font-semibold text-ink-2">
                {t}
              </span>
            ))}
          </div>
        </Card>

        <Card className="flex h-fit flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-ink">빈자리</p>
            <SeatBadge seats={center.seats} />
          </div>
          {applied ? (
            <p className="rounded-xl bg-green-soft px-4 py-2.5 text-center text-sm font-semibold text-green">
              상담 신청 완료
            </p>
          ) : (
            <Link
              to={`/centers/${center.id}/consult`}
              className="focus-ring rounded-xl bg-green px-4 py-2.5 text-center text-sm font-semibold text-white hover:opacity-90"
            >
              상담 신청
            </Link>
          )}
        </Card>
      </div>
    </div>
  )
}
