export type Role = 'user' | 'center'

export type Account = {
  id: string
  password: string
  name: string
  role: Role
}

// Test accounts until the member API is ready
export const accounts: Account[] = [
  { id: 'test', password: 'test1234', name: '테스트 사용자', role: 'user' },
  { id: 'center', password: 'center1234', name: '테스트 센터', role: 'center' },
]
