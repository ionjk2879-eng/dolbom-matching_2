import { accounts, type Account, type Role } from '../data/accounts'
import { useAccountStore } from '../store/accountStore'

export type AuthUser = Omit<Account, 'password'>

const allAccounts = () => [...accounts, ...useAccountStore.getState().registered]

export function login(id: string, password: string, role: Role): Promise<AuthUser> {
  const found = allAccounts().find((a) => a.id === id && a.password === password && a.role === role)
  if (!found) return Promise.reject(new Error('아이디 또는 비밀번호가 올바르지 않습니다'))
  const { password: _, ...user } = found
  return Promise.resolve(user)
}

export function isIdAvailable(id: string): Promise<boolean> {
  return Promise.resolve(!allAccounts().some((a) => a.id === id))
}

export function signup(account: Account): Promise<void> {
  if (allAccounts().some((a) => a.id === account.id)) return Promise.reject(new Error('이미 사용 중인 아이디예요'))
  useAccountStore.getState().register(account)
  return Promise.resolve()
}
