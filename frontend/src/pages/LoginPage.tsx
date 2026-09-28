import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const error = searchParams.get('error')

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true })
  }, [user, loading, navigate])

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">돌봄 매칭</h1>
        <p className="login-desc">돌봄이 필요한 사람과 돌봄 제공자를 연결합니다</p>

        {error && (
          <p className="login-error">
            {error === 'cancelled' ? '로그인이 취소됐습니다.' : '로그인 중 오류가 발생했습니다.'}
          </p>
        )}

        <div className="login-buttons">
          <a href={`${API_URL}/auth/kakao`} className="btn-kakao">
            <span className="btn-icon">💬</span>
            카카오로 시작하기
          </a>
          <a href={`${API_URL}/auth/naver`} className="btn-naver">
            <span className="btn-icon">N</span>
            네이버로 시작하기
          </a>
        </div>
      </div>
    </div>
  )
}
