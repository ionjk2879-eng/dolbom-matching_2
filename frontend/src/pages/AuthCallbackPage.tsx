import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LOGIN_REDIRECT_KEY, useAuthStore } from '../store/authStore'
import { getMe } from '../api/auth'

export default function AuthCallbackPage() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const error = params.get('error')

    if (!token) {
      navigate(`/login?error=${error ?? 'unknown'}`, { replace: true })
      return
    }

    getMe(token)
      .then((user) => {
        if (!user) {
          navigate('/login?error=auth_failed', { replace: true })
          return
        }
        setAuth(token, user, true)
        const redirect = sessionStorage.getItem(LOGIN_REDIRECT_KEY) ?? '/'
        sessionStorage.removeItem(LOGIN_REDIRECT_KEY)
        navigate(redirect, { replace: true })
      })
      .catch(() => {
        navigate('/login?error=auth_failed', { replace: true })
      })
  }, [setAuth, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory">
      <p className="text-ink-2">로그인 처리 중...</p>
    </div>
  )
}
