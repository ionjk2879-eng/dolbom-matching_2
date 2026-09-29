import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { AuthUser } from '../api/auth'

type AuthState = {
  user: AuthUser | null
  keep: boolean
  setUser: (user: AuthUser, keep: boolean) => void
  logout: () => void
}

// "Keep me logged in" goes to localStorage; otherwise sessionStorage, which clears when the tab closes
const authStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name) ?? sessionStorage.getItem(name),
  setItem: (name, value) => {
    const keep = JSON.parse(value).state.keep
    ;(keep ? localStorage : sessionStorage).setItem(name, value)
    ;(keep ? sessionStorage : localStorage).removeItem(name)
  },
  removeItem: (name) => {
    localStorage.removeItem(name)
    sessionStorage.removeItem(name)
  },
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      keep: false,
      setUser: (user, keep) => set({ user, keep }),
      logout: () => set({ user: null, keep: false }),
    }),
    { name: 'auth', storage: createJSONStorage(() => authStorage) },
  ),
)
