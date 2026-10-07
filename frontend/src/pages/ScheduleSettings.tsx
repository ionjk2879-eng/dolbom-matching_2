import { PageHero } from '../components/PageHero'
import { Card } from '../components/Card'
import { useScheduleStore } from '../store/scheduleStore'

function ShareToggle({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string
  desc: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-bold text-ink">{title}</p>
        <p className="mt-1 text-xs text-ink-2">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`focus-ring relative h-7 w-12 shrink-0 rounded-full pointer-coarse:after:absolute pointer-coarse:after:-inset-2 pointer-coarse:after:content-[''] transition ${checked ? 'bg-green' : 'bg-line-3'}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-6' : 'left-1'}`}
        />
      </button>
    </div>
  )
}

export function ScheduleSettings() {
  const { shareWithFamily, shareWithCenters, setShareWithFamily, setShareWithCenters } = useScheduleStore()

  return (
    <div>
      <PageHero title="캘린더 설정" back="/calendar" breadcrumb={[{ label: '내 일정', to: '/calendar' }, { label: '캘린더 설정' }]} />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Card className="divide-y divide-line">
          <ShareToggle
            title="가족과 공유"
            desc="내 일정 전체를 가족 구성원이 볼 수 있어요"
            checked={shareWithFamily}
            onChange={setShareWithFamily}
          />
          <ShareToggle
            title="돌봄 업체와 공유"
            desc="센터를 연결한 일정만 해당 센터에 공유돼요"
            checked={shareWithCenters}
            onChange={setShareWithCenters}
          />
        </Card>
        <p className="mt-3 text-xs text-ink-2">
          설정은 이 브라우저에만 저장돼요. 실제로 가족·업체에 공유하는 기능은 준비 중이에요.
        </p>
      </div>
    </div>
  )
}
