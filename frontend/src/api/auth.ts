import { accounts, type Account, type Role } from '../data/accounts'

export type AuthUser = Omit<Account, 'password'>

export function login(id: string, password: string, role: Role): Promise<AuthUser> {
  const found = accounts.find((a) => a.id === id && a.password === password && a.role === role)
  if (!found) return Promise.reject(new Error('아이디 또는 비밀번호가 올바르지 않습니다'))
  const { password: _, ...user } = found
  return Promise.resolve(user)
}
