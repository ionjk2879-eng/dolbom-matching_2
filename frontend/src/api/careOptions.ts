import type { CareOption } from '../data/types'
import { overlapWithGap, type Gap } from '../data/gaps'
import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL as string

function authHeaders(): HeadersInit {
  const token = useAuthStore.getState().token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

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

async function queryCareOptions(start: string, end: string, grade: number): Promise<CareOption[]> {
  const res = await fetch(`${API_URL}/care-options?start=${start}&end=${end}&grade=${grade}`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('돌봄 옵션을 불러오지 못했어요')
  return res.json()
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
// 공백과 부분적으로만 겹치는 옵션(조합용)은 못 찾는다. 공백의 시작/끝 두 순간을 각각
// 질의해서 합쳐 근사한다 — 공백 한가운데서만 열고 닫는 옵션은 놓칠 수 있음.
// 백엔드에 overlap 전용 파라미터가 생기면 이 함수만 교체하면 됨.
export async function fetchCareOptionsForGap(grade: number, gap: Gap): Promise<CareOption[]> {
  try {
    const [atStart, atEnd] = await Promise.all([
      queryCareOptions(gap.start, gap.start, grade),
      queryCareOptions(gap.end, gap.end, grade),
    ])
    const byId = new Map<string, CareOption>()
    for (const o of [...atStart, ...atEnd]) byId.set(o.id, o)
    return [...byId.values()]
  } catch {
    return demoOptions.filter((o) => overlapWithGap(o, gap) !== null)
  }
}
