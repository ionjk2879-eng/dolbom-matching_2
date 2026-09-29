import { PageHero } from '../components/PageHero'
import { Card } from '../components/Card'
import { ShareToggle } from '../components/ShareToggle'
import { useScheduleStore } from '../store/scheduleStore'

export function ScheduleSettings() {
  const { shareWithFamily, shareWithCenters, setShareWithFamily, setShareWithCenters } = useScheduleStore()

  return (
    <div>
      <PageHero title="캘린더 설정" breadcrumb={[{ label: '내 일정', to: '/calendar' }, { label: '캘린더 설정' }]} />
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
      </div>
    </div>
  )
}
