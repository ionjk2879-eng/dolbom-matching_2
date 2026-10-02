import { apiFetch } from './client'

// GET/POST /children 응답 모양 (backend/src/db/children.ts 와 동일)
export type ApiChild = {
  id: string
  user_id: string
  name: string
  grade: number
  commute_minutes: number
  created_at: string
}

export type NewChild = { name: string; grade: number; commute_minutes?: number }

export async function fetchChildren(): Promise<ApiChild[]> {
  const res = await apiFetch('/children')
  if (!res.ok) throw new Error('아이 목록을 불러오지 못했어요')
  return res.json()
}

export async function createChild(data: NewChild): Promise<ApiChild> {
  const res = await apiFetch('/children', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('아이를 등록하지 못했어요')
  return res.json()
}

export async function updateChild(id: string, data: Partial<NewChild>): Promise<ApiChild> {
  const res = await apiFetch(`/children/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('아이 정보를 수정하지 못했어요')
  return res.json()
}

export async function deleteChild(id: string): Promise<void> {
  const res = await apiFetch(`/children/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('아이를 삭제하지 못했어요')
}
