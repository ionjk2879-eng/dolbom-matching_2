import { Outlet, Route, Routes } from 'react-router-dom'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import AuthCallbackPage from './pages/AuthCallbackPage'
import { Home } from './pages/Home'
import { Find } from './pages/Find'
import { RequestPage } from './pages/Request'
import { Events } from './pages/Events'
import { Info } from './pages/Info'
import { Guide } from './pages/Guide'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Schedule } from './pages/Schedule'
import { ScheduleNew } from './pages/ScheduleNew'
import { ScheduleSettings } from './pages/ScheduleSettings'
import { CenterDetail } from './pages/CenterDetail'
import { ConsultNew } from './pages/ConsultNew'
import { Consults } from './pages/Consults'
import { MyPage } from './pages/MyPage'
import { RequireAuth } from './components/RequireAuth'

function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/find" element={<Find />} />
        <Route path="/request" element={<RequestPage />} />
        <Route path="/events" element={<Events />} />
        <Route path="/info" element={<Info />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/centers/:id" element={<CenterDetail />} />
        <Route element={<RequireAuth />}>
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/calendar" element={<Schedule />} />
          <Route path="/calendar/new" element={<ScheduleNew />} />
          <Route path="/calendar/:id/edit" element={<ScheduleNew />} />
          <Route path="/calendar/settings" element={<ScheduleSettings />} />
          <Route path="/centers/:id/consult" element={<ConsultNew />} />
          <Route path="/consults" element={<Consults />} />
        </Route>
      </Route>
    </Routes>
  )
}
