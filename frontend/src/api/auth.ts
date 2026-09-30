export type AuthUser = {
  id: string
  provider: 'kakao' | 'naver' | 'local'
  provider_id: string
  email: string | null
  name: string | null
  profile_image: string | null
  login_id?: string | null
  created_at: string
  updated_at: string
}

const API_URL = import.meta.env.VITE_API_URL as string

export async function getMe(token: string): Promise<AuthUser | null> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const data = (await res.json()) as { user: AuthUser | null }
  return data.user
}

