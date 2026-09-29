import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { PlaceholderImage } from '../components/PlaceholderImage'

type Role = 'user' | 'center'

export function Login() {
  const [role, setRole] = useState<Role>('user')
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [keepLoggedIn, setKeepLoggedIn] = useState(false)
  const [errors, setErrors] = useState<{ id?: string; password?: string }>({})

  const idLabel = role === 'center' ? '센터 아이디' : '아이디'

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!id) next.id = `${idLabel}를 입력해주세요`
    if (!password) next.password = '비밀번호를 입력해주세요'
    setErrors(next)
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

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <div>
            <label htmlFor="login-id" className="text-sm font-semibold text-ink">
              {idLabel}
            </label>
            <input
              id="login-id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className={`focus-ring mt-1.5 w-full rounded-xl border bg-ivory-card px-4 py-2.5 text-sm ${
                errors.id ? 'border-error' : 'border-line-2'
              }`}
            />
            {errors.id && <p className="mt-1 text-xs text-error">{errors.id}</p>}
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
                className={`focus-ring w-full rounded-xl border bg-ivory-card px-4 py-2.5 pr-16 text-sm ${
                  errors.password ? 'border-error' : 'border-line-2'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-3"
              >
                {showPassword ? '숨기기' : '보기'}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-error">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-between text-xs text-ink-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={keepLoggedIn} onChange={(e) => setKeepLoggedIn(e.target.checked)} />
              로그인 상태 유지
            </label>
            <div className="flex gap-3">
              <button type="button" className="focus-ring hover:text-ink-2">
                아이디 찾기
              </button>
              <button type="button" className="focus-ring hover:text-ink-2">
                비밀번호 찾기
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full">
            로그인
          </Button>
        </form>

        {role === 'user' && (
          <div className="mt-4 flex flex-col gap-2">
            <button className="focus-ring rounded-xl bg-[#FEE500] px-4 py-2.5 text-sm font-semibold text-ink">
              카카오로 로그인
            </button>
            <button className="focus-ring rounded-xl bg-[#03C75A] px-4 py-2.5 text-sm font-semibold text-white">
              네이버로 로그인
            </button>
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
        <Link to="/" className="focus-ring text-xl font-extrabold text-ink">After School</Link>
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
