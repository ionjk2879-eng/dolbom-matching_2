import { Outlet, Route, Routes } from 'react-router-dom'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { Find } from './pages/Find'
import { RequestPage } from './pages/Request'
import { Events } from './pages/Events'
import { Info } from './pages/Info'
import { Guide } from './pages/Guide'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'

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
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/find" element={<Find />} />
        <Route path="/request" element={<RequestPage />} />
        <Route path="/events" element={<Events />} />
        <Route path="/info" element={<Info />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>
    </Routes>
  )
}
