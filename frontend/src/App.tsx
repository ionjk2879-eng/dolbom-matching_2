import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { apiFetch } from './api/client'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { StoreErrorBanner } from './components/StoreErrorBanner'
import AuthCallbackPage from './pages/AuthCallbackPage'
import { Home } from './pages/Home'
import { Find } from './pages/Find'
import { CareOptionDetail } from './pages/CareOptionDetail'
import { Consult } from './pages/Consult'
import { Login } from './pages/Login'
import { Schedule } from './pages/Schedule'
import { ScheduleNew } from './pages/ScheduleNew'
import { ScheduleSettings } from './pages/ScheduleSettings'
import { MyPage } from './pages/MyPage'
import { RequireAuth } from './components/RequireAuth'
import { NotFound } from './pages/NotFound'

function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <Header />
      <StoreErrorBanner />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  // The stored login may have expired; apiFetch logs out on a 401
  useEffect(() => {
    if (useAuthStore.getState().token) apiFetch('/auth/me').catch(() => {})
  }, [])

  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/find" element={<Find />} />
        <Route path="/find/:id" element={<CareOptionDetail />} />
        <Route path="/centers" element={<Navigate to="/find" replace />} />
        <Route path="/consult" element={<Consult />} />
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/gaps" element={<Navigate to="/" replace />} />
          <Route path="/gaps/setup" element={<Navigate to="/" replace />} />
          <Route path="/calendar" element={<Schedule />} />
          <Route path="/calendar/new" element={<ScheduleNew />} />
          <Route path="/calendar/:id/edit" element={<ScheduleNew />} />
          <Route path="/calendar/settings" element={<ScheduleSettings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
