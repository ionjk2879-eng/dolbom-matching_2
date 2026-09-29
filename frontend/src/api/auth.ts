import { accounts, type Account } from '../data/accounts'
import { useAccountStore } from '../store/accountStore'

export type AuthUser = {
  id: string
  provider: 'kakao' | 'naver'
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
