import type { CareOption } from './types'
import { DISTRICTS } from './districts'

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

// Addresses under the merged Gwangju-Jeonnam name belong to whichever old region (광주광역시 / 전라남도) lists their district
const MERGED_GWANGJU_JEONNAM = '전남광주통합특별시'

function inMergedRegion(address: string, region: string): boolean {
  if (region !== '광주광역시' && region !== '전라남도') return false
  const [head, district] = address.split(' ')
  return head === MERGED_GWANGJU_JEONNAM && DISTRICTS[region].includes(district)
}

export function matchesLocation(c: CareOption, region: string, district: string): boolean {
  if (region && !c.address.includes(region) && !inMergedRegion(c.address, region)) return false
  if (district && !c.address.includes(district)) return false
  return true
}

// 주소 -> 필터용 시/도, 구/군. 구/군은 두 번째 토큰의 앞부분으로 본다: '서구'가 '강서구'에 걸리지 않고,
// 띄어쓰기가 빠진 주소('김해시삼안로')도 잡힌다
export function locationOf(address: string): { region: string; district: string } | null {
  const region = REGIONS.find((r) => address.includes(r) || inMergedRegion(address, r))
  if (!region) return null
  const second = address.split(' ')[1] ?? ''
  return { region, district: DISTRICTS[region]?.find((d) => second.startsWith(d)) ?? '' }
}

export function matchesCost(c: CareOption, costFilter: 'all' | 'free' | 'paid'): boolean {
  if (costFilter === 'free') return c.cost_per_hour === 0
  if (costFilter === 'paid') return c.cost_per_hour > 0
  return true
}

export function matchesCareOption(
  c: CareOption,
  grade: string,
  time: string,
  region = '',
  district = '',
  costFilter: 'all' | 'free' | 'paid' = 'all',
): boolean {
  return coversGrade(c, grade) && coversCloseTime(c.close_time, time) && matchesLocation(c, region, district) && matchesCost(c, costFilter)
}

export const REGIONS = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시',
  '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원특별자치도',
  '충청북도', '충청남도', '전북특별자치도', '전라남도', '경상북도', '경상남도',
  '제주특별자치도',
]
