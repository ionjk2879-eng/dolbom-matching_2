import { Outlet, Route, Routes } from 'react-router-dom'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { StoreErrorBanner } from './components/StoreErrorBanner'
import AuthCallbackPage from './pages/AuthCallbackPage'
import { Home } from './pages/Home'
import { Find } from './pages/Find'
import { CareOptionDetail } from './pages/CareOptionDetail'
import { Centers } from './pages/Centers'
import { Consult } from './pages/Consult'
import { Login } from './pages/Login'
import { Schedule } from './pages/Schedule'
import { ScheduleNew } from './pages/ScheduleNew'
import { ScheduleSettings } from './pages/ScheduleSettings'
import { MyPage } from './pages/MyPage'
import { GapCalendar } from './pages/GapCalendar'
import { GapSetup } from './pages/GapSetup'
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

// 지도 페이지 전용 레이아웃: footer 없이 main이 남은 높이 전체를 차지
function MapLayout() {
  return (
    <div className="flex h-screen flex-col bg-ivory">
      <Header />
      <StoreErrorBanner />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route element={<MapLayout />}>
        <Route path="/find" element={<Find />} />
      </Route>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/find/:id" element={<CareOptionDetail />} />
        <Route path="/centers" element={<Centers />} />
        <Route path="/consult" element={<Consult />} />
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/gaps" element={<GapCalendar />} />
          <Route path="/gaps/setup" element={<GapSetup />} />
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
