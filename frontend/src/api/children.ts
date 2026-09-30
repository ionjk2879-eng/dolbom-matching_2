import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL as string

function authHeaders(): HeadersInit {
  const token = useAuthStore.getState().token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

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
  const res = await fetch(`${API_URL}/children`, { headers: authHeaders() })
  if (!res.ok) throw new Error('아이 목록을 불러오지 못했어요')
  return res.json()
}

export async function createChild(data: NewChild): Promise<ApiChild> {
  const res = await fetch(`${API_URL}/children`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('아이를 등록하지 못했어요')
  return res.json()
}

export async function deleteChild(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/children/${id}`, { method: 'DELETE', headers: authHeaders() })
  if (!res.ok) throw new Error('아이를 삭제하지 못했어요')
}
