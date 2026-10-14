import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useDarkMode } from '../hooks/useDarkMode'
import logo from '../assets/logo.webp'
import logoDark from '../assets/logo-dark.webp'

export function Header() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const { dark, toggle: toggleDark } = useDarkMode()
  const navItems = [
    { to: '/find', label: '돌봄 찾기' },
    { to: '/consult', label: '상담' },
  ]
  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(`${to}/`)

  return (
    <header className="border-b border-line bg-ivory-card">
      {/* Phones: logo + account on the first row, menu on its own row below */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-1 px-4 py-3">
        <Link to="/" className="tap-target flex items-center">
          <img
            src={dark ? logoDark : logo}
            alt="After School"
            width={dark ? 324 : 320}
            height={120}
            className="h-9 w-auto select-none"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
        </Link>

        <nav aria-label="주요 메뉴" className="order-last flex w-full gap-6 sm:order-none sm:w-auto">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isActive(item.to) ? 'page' : undefined}
              className={`focus-ring inline-block whitespace-nowrap border-b-2 py-2 text-sm pointer-coarse:-mx-2 pointer-coarse:px-2 pointer-coarse:py-3 font-semibold transition ${
                isActive(item.to) ? 'border-green text-green' : 'border-transparent text-ink-2 hover:text-ink'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleDark}
            aria-label={dark ? '라이트 모드로 전환' : '다크 모드로 전환'}
            className="focus-ring tap-target flex items-center justify-center rounded-xl border border-line-2 p-2 text-ink-2 hover:text-ink"
          >
            {dark ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            )}
          </button>
          {user ? (
            <>
              <Link to="/mypage" className="focus-ring tap-link whitespace-nowrap text-sm font-semibold text-ink-2 hover:text-ink">
                마이 페이지
              </Link>
              <span className="hidden whitespace-nowrap text-sm font-semibold text-ink sm:inline">{user.name ?? user.email ?? '사용자'}님</span>
              <button
                type="button"
                // Leave the page first, or on a login-only page RequireAuth would bounce to /login
                onClick={() => { navigate('/'); logout() }}
                className="focus-ring tap-target whitespace-nowrap rounded-xl border border-line-2 px-4 py-2 text-sm font-semibold text-ink-2 hover:text-ink"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="focus-ring tap-target whitespace-nowrap rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
