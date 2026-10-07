import { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LOGIN_REDIRECT_KEY, useAuthStore } from '../store/authStore'
import loginHero from '../assets/login-hero.webp'

const API_URL = import.meta.env.VITE_API_URL as string

export function Login() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const location = useLocation()
  const errorParam = new URLSearchParams(location.search).get('error')
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user, from, navigate])

  return (
    <div className="mx-auto flex max-w-5xl flex-col-reverse gap-10 px-4 py-14 md:flex-row-reverse md:items-center">
      <title>로그인 | After School</title>
      <div className="flex-1">
        <p className="mb-6 text-sm text-ink-2">카카오·네이버 계정으로 바로 시작해요. 최초 로그인 시 자동으로 가입돼요.</p>

        {errorParam && (
          <p className="mb-4 rounded-xl border border-error/30 bg-warn-bg px-4 py-3 text-sm text-warn">
            {errorParam === 'cancelled' ? '로그인이 취소되었습니다.' : '로그인 중 오류가 발생했습니다. 다시 시도해주세요.'}
          </p>
        )}

        {/* OAuth leaves the SPA, so keep the destination for AuthCallbackPage */}
        <div className="flex flex-row gap-2" onClick={() => sessionStorage.setItem(LOGIN_REDIRECT_KEY, from)}>
          <a
            href={`${API_URL}/auth/kakao`}
            className="focus-ring flex-1 rounded-xl bg-[#FEE500] px-4 py-3 text-center text-sm font-semibold text-ink"
          >
            카카오로 시작하기
          </a>
          <a
            href={`${API_URL}/auth/naver`}
            className="focus-ring flex-1 rounded-xl bg-[#03C75A] px-4 py-3 text-center text-sm font-semibold text-white"
          >
            네이버로 시작하기
          </a>
        </div>
      </div>

      <div className="flex-1">
        <Link to="/" className="focus-ring tap-link text-xl font-extrabold text-ink">
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
          width={960}
          height={640}
          className="mt-6 aspect-video w-full rounded-xl border border-line-3 object-cover"
        />
      </div>
    </div>
  )
}
