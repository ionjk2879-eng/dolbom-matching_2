import type { CareOption } from '../data/types'

const API_URL = import.meta.env.VITE_API_URL as string

// ponytail: 백엔드 /care-options가 아직 없어서 실패 시 데모 옵션으로 대체.
// 엔드포인트 생기면 이 catch 블록은 지우고 에러를 그대로 올리면 됨.
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

export async function fetchCareOptions(): Promise<CareOption[]> {
  try {
    const res = await fetch(`${API_URL}/care-options`)
    if (!res.ok) throw new Error('돌봄 옵션을 불러오지 못했어요')
    return await res.json()
  } catch {
    return demoOptions
  }
}
