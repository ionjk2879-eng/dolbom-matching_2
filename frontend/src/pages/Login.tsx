import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../components/Button'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import type { Role } from '../data/accounts'
import loginHero from '../assets/login-hero.png'

const API_URL = import.meta.env.VITE_API_URL as string

export function Login() {
  const user = useAuthStore((s) => s.user)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  const location = useLocation()
  const errorParam = new URLSearchParams(location.search).get('error')
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [role, setRole] = useState<Role>('user')
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [keepLoggedIn, setKeepLoggedIn] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user, from, navigate])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!id || !password) {
      setError('아이디와 비밀번호를 입력해주세요')
      return
    }
    try {
      const authUser = await login(id, password, role)
      setAuth(crypto.randomUUID(), authUser, keepLoggedIn)
    } catch (err) {
      setError((err as Error).message)
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

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <div>
            <label htmlFor="login-id" className="text-sm font-semibold text-ink">
              {role === 'center' ? '센터 아이디' : '아이디'}
            </label>
            <input
              id="login-id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="focus-ring mt-1.5 w-full rounded-xl border border-line-2 bg-ivory-card px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="text-sm font-semibold text-ink">
              비밀번호
            </label>
            <div className="relative mt-1.5">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus-ring w-full rounded-xl border border-line-2 bg-ivory-card px-4 py-2.5 pr-16 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-3"
              >
                {showPassword ? '숨기기' : '보기'}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <label className="flex items-center gap-2 text-xs text-ink-3">
            <input type="checkbox" checked={keepLoggedIn} onChange={(e) => setKeepLoggedIn(e.target.checked)} />
            로그인 상태 유지
          </label>

          <Button type="submit" className="w-full">
            로그인
          </Button>
        </form>

        {role === 'user' && (
          <div className="mt-4 flex flex-row gap-2">
            <a
              href={`${API_URL}/auth/kakao`}
              className="focus-ring flex-1 rounded-xl bg-[#FEE500] px-4 py-2.5 text-center text-sm font-semibold text-ink"
            >
              카카오로 로그인
            </a>
            <a
              href={`${API_URL}/auth/naver`}
              className="focus-ring flex-1 rounded-xl bg-[#03C75A] px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              네이버로 로그인
            </a>
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
        <img
          src={loginHero}
          alt="아이와 선생님이 함께 공부하는 모습"
          className="mt-6 aspect-video w-full rounded-xl border border-line-3 object-cover"
        />
      </div>
    </div>
  )
}
