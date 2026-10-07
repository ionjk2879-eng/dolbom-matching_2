import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import logo from '../assets/logo.png'

export function Header() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navItems = [
    { to: '/find', label: '돌봄 찾기' },
    { to: '/consult', label: '상담' },
  ]
  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(`${to}/`)

  return (
    <header className="border-b border-line bg-ivory-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="After School" className="h-9 w-auto" />
        </Link>

        <nav aria-label="주요 메뉴" className="flex gap-6">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isActive(item.to) ? 'page' : undefined}
              className={`focus-ring inline-block border-b-2 py-2 text-sm font-semibold transition ${
                isActive(item.to) ? 'border-green text-green' : 'border-transparent text-ink-2 hover:text-ink'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/mypage" className="focus-ring text-sm font-semibold text-ink-2 hover:text-ink">
                마이 페이지
              </Link>
              <span className="text-sm font-semibold text-ink">{user.name ?? user.email ?? '사용자'}님</span>
              <button
                type="button"
                onClick={logout}
                className="focus-ring rounded-xl border border-line-2 px-4 py-2 text-sm font-semibold text-ink-2 hover:text-ink"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="focus-ring rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
