import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Account } from '../data/accounts'

// Accounts created through the signup form until the member API is ready
type AccountState = {
  registered: Account[]
  register: (a: Account) => void
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set) => ({
      registered: [],
      register: (a) => set((s) => ({ registered: [...s.registered, a] })),
    }),
    { name: 'accounts' },
  ),
)
