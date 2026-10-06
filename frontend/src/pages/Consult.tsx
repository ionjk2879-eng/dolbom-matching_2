import { Link } from 'react-router-dom'
import { PageHero } from '../components/PageHero'
import { Card } from '../components/Card'

const plannedSteps = [
  { title: '센터 선택', desc: '센터 찾기에서 상담받고 싶은 곳을 골라요' },
  { title: '상담 신청', desc: '희망 날짜·시간과 궁금한 점을 남겨요' },
  { title: '답변 확인', desc: '센터의 답변과 상담 일정을 여기서 확인해요' },
]

// Placeholder until the backend can store consult requests and deliver them to centers
export function Consult() {
  return (
    <div>
      <PageHero title="상담" desc="센터에 궁금한 점을 묻고 상담 일정을 잡을 수 있어요" />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card className="text-center">
          <span className="inline-block rounded-full bg-warn-bg px-3 py-1 text-xs font-bold text-warn">준비 중</span>
          <p className="mt-3 text-lg font-extrabold text-ink">온라인 상담 신청을 준비하고 있어요</p>
          <p className="mt-1 text-sm text-ink-2">그동안은 센터 찾기에서 센터에 전화로 문의해 주세요.</p>
          <Link
            to="/centers"
            className="focus-ring mt-5 inline-block rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            센터 찾기
          </Link>
        </Card>

        <p className="mt-8 text-sm font-bold text-ink">이렇게 이용하게 될 거예요</p>
        <ol className="mt-3 grid gap-3 sm:grid-cols-3">
          {plannedSteps.map((step, i) => (
            <li key={step.title} className="flex gap-3 rounded-2xl border border-line bg-ivory-card p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-line-2 text-xs font-bold text-ink-2">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-bold text-ink">{step.title}</p>
                <p className="mt-0.5 text-xs text-ink-2">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
