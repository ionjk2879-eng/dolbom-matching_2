import type { CareOption } from '../data/types'
import { overlapWithGap, toMinutes, toTime, type Gap } from '../data/gaps'
import { apiFetch } from './client'

// ponytail: 백엔드/네트워크가 준비 안 됐을 때를 위한 데모 옵션(비전 예시 그대로).
const demoOptions: CareOption[] = [
  {
    id: 'demo-school-care',
    name: '학교돌봄교실',
    type: 'school_care',
    address: '대전광역시 유성구',
    latitude: 36.35,
    longitude: 127.38,
    min_grade: 1,
    max_grade: 6,
    open_time: '15:00',
    close_time: '17:00',
    cost_per_hour: 0,
    phone: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-community-care',
    name: '다함께돌봄센터',
    type: 'community_care',
    address: '대전광역시 유성구',
    latitude: 36.36,
    longitude: 127.37,
    min_grade: 1,
    max_grade: 6,
    open_time: '16:00',
    close_time: '19:00',
    cost_per_hour: 3000,
    phone: '042-000-0000',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-childcare-service',
    name: '아이돌봄서비스',
    type: 'child_care_service',
    address: '방문 돌봄',
    latitude: null,
    longitude: null,
    min_grade: null,
    max_grade: null,
    open_time: '09:00',
    close_time: '22:00',
    cost_per_hour: 11080,
    phone: '1577-2514',
    created_at: new Date().toISOString(),
  },
]

export const isDemoOption = (o: CareOption) => o.id.startsWith('demo-')

export async function fetchCareOption(id: string): Promise<CareOption | null> {
  const res = await apiFetch(`/care-options/${id}`)
  if (res.status === 404) return null
  if (!res.ok) return null
  const o: CareOption = await res.json()
  return { ...o, open_time: o.open_time.slice(0, 5), close_time: o.close_time.slice(0, 5) }
}

async function queryCareOptions(start: string, end: string, grade: number): Promise<CareOption[]> {
  const res = await apiFetch(`/care-options?start=${start}&end=${end}&grade=${grade}`)
  if (!res.ok) throw new Error('돌봄 옵션을 불러오지 못했어요')
  const rows: CareOption[] = await res.json()
  // Postgres TIME comes back as 'HH:mm:ss'; the UI shows 'HH:mm'
  return rows.map((o) => ({ ...o, open_time: o.open_time.slice(0, 5), close_time: o.close_time.slice(0, 5) }))
}

// 일반 둘러보기(공백 미확정 상태)용 — 실제 API는 start/end/grade가 필수라 이 호출은
// 항상 실패하고 데모 옵션으로 대체된다. 진짜 매칭은 fetchCareOptionsForGap을 쓴다.
export async function fetchCareOptions(): Promise<CareOption[]> {
  try {
    return await queryCareOptions('00:00', '23:59', 1)
  } catch {
    return demoOptions
  }
}

// 특정 공백(gap)에 맞는 돌봄 옵션 후보를 가져온다.
// ponytail: /care-options는 [start,end] 구간을 "완전히 커버"하는 곳만 찾아주는 API라
// 공백 안을 30분 간격(+끝 시각)으로 순간 질의해서 합쳐 근사한다 — 공백 안에서 30분 미만만
// 여는 옵션은 놓칠 수 있음. 백엔드에 overlap 전용 파라미터가 생기면 이 함수만 교체하면 됨.
const SAMPLE_STEP_MIN = 30

export async function fetchCareOptionsForGap(grade: number, gap: Gap): Promise<CareOption[]> {
  const start = toMinutes(gap.start)
  const end = toMinutes(gap.end)
  const times: string[] = []
  for (let m = start; m < end; m += SAMPLE_STEP_MIN) times.push(toTime(m))
  times.push(gap.end)
  try {
    const results = await Promise.all(times.map((t) => queryCareOptions(t, t, grade)))
    const byId = new Map<string, CareOption>()
    for (const o of results.flat()) byId.set(o.id, o)
    const matched = [...byId.values()].filter((o) => overlapWithGap(o, gap) !== null)
    if (matched.length > 0) return matched
  } catch {
    // fall through to demo
  }
  return demoOptions.filter((o) => overlapWithGap(o, gap) !== null)
}
