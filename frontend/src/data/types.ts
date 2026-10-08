export type CareProviderType = 'school_care' | 'community_care' | 'child_care_service' | 'academy' | 'babysitter'

// GET /care-options 응답 모양 (backend/src/db/schema.sql 의 care_providers 테이블과 동일)
export type CareOption = {
  id: string
  name: string
  type: CareProviderType
  address: string
  latitude: number | null
  longitude: number | null
  min_grade: number | null
  max_grade: number | null
  open_time: string
  close_time: string
  cost_per_hour: number
  phone: string | null
  url: string | null
  created_at: string
}

export type ScheduleType = 'child_school' | 'parent_work' | 'care'

// GET/POST /schedules 응답 모양 (backend/src/db/schema.sql 의 schedules 테이블과 동일)
export type Schedule = {
  id: string
  user_id: string
  child_id: string | null
  type: ScheduleType
  days_of_week: number[]
  start_time: string
  end_time: string
  created_at: string
}

// -- 반복 주간 일정 / 돌봄 공백 계산 (careScheduleStore가 API 응답을 변환해 쓰는 UI 모델) --

export type Child = {
  id: string
  name: string
  grade: number // 1~6
  commuteMinutes: number
}

export type RecurringSchedule = {
  id: string
  childId: string | null // null = 부모 본인 일정(parent_work)
  type: ScheduleType
  daysOfWeek: number[] // 0(일)~6(토), WEEKDAY_LABELS와 동일한 인덱스
  startTime: string // 'HH:mm'
  endTime: string
  careOptionId?: string // type: 'care'일 때, 어느 CareOption을 선택해서 생긴 일정인지
  title?: string // 사용자가 붙인 이름 (예: 피아노 학원). 없으면 유형 기본 이름을 씀
  memo?: string
  parentLabel?: 'mom' | 'dad' // type: 'parent_work'일 때, 엄마/아빠 구분
  color?: string // 사용자 지정 색상 (hex). 없으면 type 기본 색상 사용
}

export type ScheduleException = {
  id: string
  scheduleId: string
  date: string // 'YYYY-MM-DD'
  startTime: string | null
  endTime: string | null
  isCancelled: boolean
}
