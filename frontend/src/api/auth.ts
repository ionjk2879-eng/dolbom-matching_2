import { accounts, type Account, type Role } from '../data/accounts'
import { useAccountStore } from '../store/accountStore'

export type AuthUser = {
  id: string
  provider: 'kakao' | 'naver' | 'local'
  provider_id: string
  email: string | null
  name: string | null
  profile_image: string | null
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

const allAccounts = () => [...accounts, ...useAccountStore.getState().registered]

export function isIdAvailable(id: string): Promise<boolean> {
  return Promise.resolve(!allAccounts().some((a) => a.id === id))
}

export function signup(account: Account): Promise<void> {
  if (allAccounts().some((a) => a.id === account.id)) return Promise.reject(new Error('이미 사용 중인 아이디예요'))
  useAccountStore.getState().register(account)
  return Promise.resolve()
}

// 백엔드에 아이디/비밀번호 로그인 API가 아직 없어서, signup()으로 만든 계정을 로컬에서 대조한다.
export function login(id: string, password: string, role: Role): Promise<AuthUser> {
  const account = allAccounts().find((a) => a.id === id && a.password === password && a.role === role)
  if (!account) return Promise.reject(new Error('아이디, 비밀번호 또는 역할을 다시 확인해주세요'))
  const now = new Date().toISOString()
  return Promise.resolve({
    id: account.id,
    provider: 'local',
    provider_id: account.id,
    email: null,
    name: account.name,
    profile_image: null,
    created_at: now,
    updated_at: now,
  })
}
