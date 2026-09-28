import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import AuthCallbackPage from './pages/AuthCallbackPage'

function Home() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>로딩 중...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div style={{ padding: '2rem' }}>
      <h1>안녕하세요, {user.name ?? '사용자'}님!</h1>
      {user.email && <p>{user.email}</p>}
      <button onClick={logout}>로그아웃</button>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
