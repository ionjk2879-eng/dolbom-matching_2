import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PlaceholderImage } from '../components/PlaceholderImage'
import { loginWithPassword } from '../api/auth'
import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL as string

const inputClass =
  'focus-ring w-full rounded-xl border border-line-2 bg-ivory-card px-4 py-2.5 text-sm'

export function Login() {
  const [role, setRole] = useState<'user' | 'center'>('user')
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const errorParam = new URLSearchParams(useLocation().search).get('error')
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    if (!loginId || !password) return setError('아이디와 비밀번호를 입력해주세요')
    setError('')
    setLoading(true)
    try {
      const { token, user } = await loginWithPassword(loginId, password)
      setAuth(token, user, true)
      navigate('/', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col-reverse gap-10 px-4 py-14 md:flex-row-reverse md:items-center">
      <div className="flex-1">
        <div className="mb-6 inline-flex rounded-xl border border-line bg-ivory-deep-2 p-1">
          <button
            type="button"
            onClick={() => setRole('user')}
            className={`focus-ring rounded-lg px-4 py-2 text-sm font-semibold ${role === 'user' ? 'bg-ivory text-ink' : 'text-ink-2'}`}
          >
            사용자
          </button>
          <button
            type="button"
            onClick={() => setRole('center')}
            className={`focus-ring rounded-lg px-4 py-2 text-sm font-semibold ${role === 'center' ? 'bg-ivory text-ink' : 'text-ink-2'}`}
          >
            센터 운영자
          </button>
        </div>

        {errorParam && (
          <p className="mb-4 rounded-xl border border-error/30 bg-warn-bg px-4 py-3 text-sm text-warn">
            {errorParam === 'cancelled' ? '로그인이 취소되었습니다.' : '로그인 중 오류가 발생했습니다. 다시 시도해주세요.'}
          </p>
        )}

        {role === 'user' ? (
          <div className="flex flex-col gap-3">
            <a
              href={`${API_URL}/auth/kakao`}
              className="focus-ring block rounded-xl bg-[#FEE500] px-4 py-3 text-center text-sm font-semibold text-ink"
            >
              카카오로 로그인
            </a>
            <a
              href={`${API_URL}/auth/naver`}
              className="focus-ring block rounded-xl bg-[#03C75A] px-4 py-3 text-center text-sm font-semibold text-white"
            >
              네이버로 로그인
            </a>

            <div className="flex items-center gap-3 my-1">
              <span className="flex-1 h-px bg-line-2" />
              <span className="text-xs text-ink-3">또는</span>
              <span className="flex-1 h-px bg-line-2" />
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="아이디"
                autoComplete="username"
                className={inputClass}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                autoComplete="current-password"
                className={inputClass}
              />
              {error && <p className="text-sm text-error">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="focus-ring rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-ivory-deep-2 px-6 py-8 text-center">
            <p className="text-sm text-ink-3">센터 운영자 로그인은 준비 중입니다.</p>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-ink-3">
          아직 계정이 없으신가요?{' '}
          <Link to="/signup" className="font-semibold text-green underline">
            회원가입
          </Link>
        </p>
      </div>

      <div className="flex-1">
        <Link to="/" className="focus-ring text-xl font-extrabold text-ink">
          After School
        </Link>
        <p className="mt-3 text-2xl font-extrabold tracking-[-0.03em] text-ink">
          방과 후에도
          <br />
          안심할 수 있도록
        </p>
        <PlaceholderImage caption="로그인 이미지" className="mt-6" />
      </div>
    </div>
  )
}
