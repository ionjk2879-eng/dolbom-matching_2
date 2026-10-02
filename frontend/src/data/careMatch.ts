import type { CareOption } from './types'

export const careTypeLabels: Record<CareOption['type'], string> = {
  school_care: '학교돌봄',
  community_care: '다함께돌봄센터',
  child_care_service: '아이돌봄서비스',
  academy: '학원',
  babysitter: '베이비시터',
}

export const gradeBuckets = ['유아', '초1~2', '초3~4', '초5~6']
export const timeBuckets = ['~오후5시', '~오후7시', '오후7시 이후']
export const districts = ['동구', '중구', '서구', '유성구', '대덕구']

// '대전광역시 서구 봉명로 215' -> '서구'; null for addresses without a district (e.g. 방문 돌봄)
export function districtOf(address: string): string | null {
  return address.match(/(\S+구)(\s|$)/)?.[1] ?? null
}

// Options without a district (visiting care) are available in every area
export function coversArea(c: CareOption, area: string): boolean {
  if (!area) return true
  const district = districtOf(c.address)
  return district === null || district === area
}

// match.grade(학년 구간 라벨) <-> care_providers.min/max_grade(숫자) 변환
export function gradeRange(bucket: string): [number, number] | null {
  if (bucket === '초1~2') return [1, 2]
  if (bucket === '초3~4') return [3, 4]
  if (bucket === '초5~6') return [5, 6]
  return null // '유아' 등 숫자 학년이 없는 구간은 필터하지 않음
}

export function coversGrade(c: CareOption, bucket: string): boolean {
  const range = gradeRange(bucket)
  if (!range) return true
  const [lo, hi] = range
  if (c.min_grade != null && hi < c.min_grade) return false
  if (c.max_grade != null && lo > c.max_grade) return false
  return true
}

export function coversCloseTime(closeTime: string, time: string): boolean {
  const closeMinutes = Number(closeTime.slice(0, 2)) * 60 + Number(closeTime.slice(3, 5))
  if (time === '~오후5시') return closeMinutes >= 17 * 60
  if (time === '~오후7시') return closeMinutes >= 19 * 60
  if (time === '오후7시 이후') return closeMinutes > 19 * 60
  return true
}

export function matchesCareOption(c: CareOption, grade: string, time: string, area = ''): boolean {
  return coversArea(c, area) && coversGrade(c, grade) && coversCloseTime(c.close_time, time)
}
