import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthCallbackPage() {
  const { saveToken } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const error = params.get('error')

    if (token) {
      saveToken(token)
      navigate('/', { replace: true })
    } else {
      navigate(`/login?error=${error ?? 'unknown'}`, { replace: true })
    }
  }, [saveToken, navigate])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p>로그인 처리 중...</p>
    </div>
  )
}
