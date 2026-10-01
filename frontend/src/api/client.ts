import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL as string

// fetch with the stored token; a 401 means the token expired or is invalid, so log out
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = useAuthStore.getState().token
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...init.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (res.status === 401 && token) useAuthStore.getState().logout()
  return res
}
