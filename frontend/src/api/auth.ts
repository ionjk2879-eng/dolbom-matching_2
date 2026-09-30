export type AuthUser = {
  id: string
  provider: 'kakao' | 'naver' | 'local'
  provider_id: string
  email: string | null
  name: string | null
  profile_image: string | null
  login_id: string | null
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

export async function loginWithPassword(loginId: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId, password }),
  })
  const data = (await res.json()) as { token: string; user: AuthUser } | { error: string }
  if (!res.ok) throw new Error((data as { error: string }).error)
  return data as { token: string; user: AuthUser }
}

export async function isIdAvailable(loginId: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/auth/check-id?loginId=${encodeURIComponent(loginId)}`)
  if (!res.ok) return false
  const data = (await res.json()) as { available: boolean }
  return data.available
}

export async function signup(data: { loginId: string; password: string; name: string }): Promise<void> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const { error } = (await res.json()) as { error: string }
    throw new Error(error)
  }
}
