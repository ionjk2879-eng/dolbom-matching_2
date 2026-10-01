import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { AuthUser } from '../api/auth'

// sessionStorage key: where to go after the OAuth round trip (set by Login, read by AuthCallbackPage)
export const LOGIN_REDIRECT_KEY = 'login-redirect'

type AuthState = {
  token: string | null
  user: AuthUser | null
  keep: boolean
  setAuth: (token: string, user: AuthUser, keep?: boolean) => void
  logout: () => void
}

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
      token: null,
      user: null,
      keep: true,
      setAuth: (token, user, keep = true) => set({ token, user, keep }),
      logout: () => set({ token: null, user: null, keep: false }),
    }),
    { name: 'auth', storage: createJSONStorage(() => authStorage) },
  ),
)
