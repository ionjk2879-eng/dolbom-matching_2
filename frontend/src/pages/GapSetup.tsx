import { Link } from 'react-router-dom'
import { PageHero } from '../components/PageHero'
import { Card } from '../components/Card'
import { CareScheduleEditor } from '../components/CareScheduleEditor'
// Drag only works with a mouse; on touch the editor offers an add form instead
import { isTouchDevice } from '../data/device'

export function GapSetup() {
  return (
    <div>
      <PageHero
        title="반복 일정 등록"
        back="/"
        desc={
          isTouchDevice
            ? '‘일정 추가’에서 요일과 시간을 골라 부모 근무·아이 학교 시간을 등록하세요. 한 번만 등록하면 요일마다 반복 적용돼요.'
            : '캘린더에서 빈 칸을 드래그해서 부모 근무·아이 학교 시간을 등록하세요. 한 번만 등록하면 요일마다 반복 적용돼요.'
        }
      />
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
        <Card>
          <CareScheduleEditor />
        </Card>
        <Link to="/gaps" className="focus-ring tap-link text-center text-sm font-semibold text-green underline">
          날짜별 공백 캘린더에서 확인하기
        </Link>
      </div>
    </div>
  )
}
