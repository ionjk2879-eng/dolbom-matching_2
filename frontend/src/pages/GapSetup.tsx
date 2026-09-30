import { Link } from 'react-router-dom'
import { PageHero } from '../components/PageHero'
import { Card } from '../components/Card'
import { CareScheduleEditor } from '../components/CareScheduleEditor'

export function GapSetup() {
  return (
    <div>
      <PageHero
        title="반복 일정 등록"
        desc="캘린더에서 빈 칸을 드래그해서 부모 근무·아이 학교 시간을 등록하세요. 한 번만 등록하면 요일마다 반복 적용돼요."
      />
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
        <Card>
          <CareScheduleEditor />
        </Card>
        <Link to="/gaps" className="focus-ring text-center text-sm font-semibold text-green underline">
          돌봄 공백 캘린더에서 확인하기
        </Link>
      </div>
    </div>
  )
}
