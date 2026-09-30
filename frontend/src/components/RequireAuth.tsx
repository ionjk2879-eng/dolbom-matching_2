import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useCareScheduleStore } from '../store/careScheduleStore'

// Sends logged-out visitors to /login and remembers where they were going
export function RequireAuth() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  useEffect(() => {
    if (user) useCareScheduleStore.getState().loadAll()
  }, [user])

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />
  return <Outlet />
}
