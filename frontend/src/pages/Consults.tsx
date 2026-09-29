import { Link } from 'react-router-dom'
import { PageHero } from '../components/PageHero'
import { Card } from '../components/Card'
import { centers } from '../data/centers'
import { toISO } from '../data/date'
import { useConsultStore } from '../store/consultStore'

export function Consults() {
  const consults = useConsultStore((s) => s.consults)
  const sorted = [...consults].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div>
      <PageHero title="상담 내역" desc="센터에 보낸 상담 신청을 확인하세요" />
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-10">
        {sorted.length === 0 && (
          <Card className="text-center">
            <p className="text-sm font-bold text-ink">아직 신청한 상담이 없어요</p>
            <Link
              to="/find"
              className="focus-ring mt-4 inline-block rounded-xl bg-green px-4 py-2 text-sm font-semibold text-white"
            >
              돌봄기관 찾기
            </Link>
          </Card>
        )}
        {sorted.map((c) => {
          const center = centers.find((x) => x.id === c.centerId)
          return (
            <Card key={c.id}>
              <div className="flex items-center justify-between">
                <Link to={`/centers/${c.centerId}`} className="focus-ring text-sm font-bold text-ink hover:text-green">
                  {center?.name ?? '알 수 없는 센터'}
                </Link>
                <span className="text-xs text-ink-3">신청일 {toISO(new Date(c.createdAt))}</span>
              </div>
              <p className="mt-2 text-xs text-ink-2">
                희망 상담일 {c.date} · {c.grade} · {c.phone}
              </p>
              {c.message && <p className="mt-2 text-sm text-ink-2">{c.message}</p>}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
